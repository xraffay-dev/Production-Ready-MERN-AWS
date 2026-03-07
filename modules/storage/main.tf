resource "aws_s3_bucket" "s3-bucket-frontend-deployment" {
  bucket = "mern-on-aws-frontend-deployment-bucket"

  tags = {
    Name = "Frontend-Deployment-Bucket"
  }
}

resource "aws_s3_bucket_versioning" "s3-versioning" {
  bucket = aws_s3_bucket.s3-bucket-frontend-deployment.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  bucket = aws_s3_bucket.s3-bucket-frontend-deployment.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "bucket-block" {
  bucket = aws_s3_bucket.s3-bucket-frontend-deployment.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Uploading Files to S3 Bucket
resource "aws_s3_object" "frontend-files" {
  for_each = fileset("../frontend/dist", "**")

  bucket = aws_s3_bucket.s3-bucket-frontend-deployment.id
  key    = each.value
  source = "../frontend/dist/${each.value}"
  etag   = filemd5("../frontend/dist/${each.value}")

  # Set correct Content-Type to prevent files from downloading
  content_type = lookup(
    {
      "html"  = "text/html"
      "css"   = "text/css"
      "js"    = "application/javascript"
      "json"  = "application/json"
      "png"   = "image/png"
      "jpg"   = "image/jpeg"
      "jpeg"  = "image/jpeg"
      "gif"   = "image/gif"
      "svg"   = "image/svg+xml"
      "ico"   = "image/x-icon"
      "woff"  = "font/woff"
      "woff2" = "font/woff2"
      "ttf"   = "font/ttf"
      "eot"   = "application/vnd.ms-fontobject"
    },
    split(".", each.value)[length(split(".", each.value)) - 1],
    "application/octet-stream"
  )

  server_side_encryption = "AES256"
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "frontend-s3-oac"
  description                       = "Origin Access Control for Frontend S3 Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Function — strip the /api prefix before forwarding to the ALB
# Without this, a request to /api/products would arrive at the ALB as
# /api/products. The backend only handles /products, so we rewrite the URI
# by removing the /api prefix here before the request leaves CloudFront.
resource "aws_cloudfront_function" "api_rewrite" {
  name    = "api-path-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Strip /api prefix from requests before forwarding to the ALB"
  publish = true

  code = <<-EOF
    async function handler(event) {
      var request = event.request;
      // Remove the leading /api segment so /api/foo becomes /foo
      request.uri = request.uri.replace(/^\/api/, '');
      if (request.uri === '' || request.uri === undefined) {
        request.uri = '/';
      }
      return request;
    }
  EOF
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_dist" {
  enabled             = true
  default_root_object = "index.html"

  # Origin 1: S3 bucket for static frontend files
  origin {
    domain_name              = aws_s3_bucket.s3-bucket-frontend-deployment.bucket_regional_domain_name
    origin_id                = "S3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  # Origin 2: ALB for backend API
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "ALB-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: serve static files from S3
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-frontend"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # API behavior: forward /api/* requests to the ALB (no caching)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-backend"
    viewer_protocol_policy = "redirect-to-https"

    # Strip /api prefix before forwarding to ALB
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.api_rewrite.arn
    }

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Authorization", "Accept", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Custom error responses (SPA routing)
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "Frontend-CloudFront-Distribution"
  }
}

# S3 Bucket Policy for CloudFront Access
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.s3-bucket-frontend-deployment.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.s3-bucket-frontend-deployment.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_dist.arn
          }
        }
      }
    ]
  })
}

# Invalidate CloudFront cache whenever S3 objects change
# Triggered by a hash of all object etags — only runs when at least one file differs.
resource "null_resource" "cloudfront_invalidation" {
  triggers = {
    s3_etags = sha1(join(",", [for obj in aws_s3_object.frontend-files : obj.etag]))
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend_dist.id} --paths '/*' --region ap-south-1"
  }

  depends_on = [aws_s3_object.frontend-files]
}
