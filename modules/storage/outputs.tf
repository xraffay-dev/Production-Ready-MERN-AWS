output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name (use this as FRONTEND_URL)"
  value       = "https://${aws_cloudfront_distribution.frontend_dist.domain_name}"
}
