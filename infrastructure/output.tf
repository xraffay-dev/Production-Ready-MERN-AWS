output "asg_name" {
  description = "The name of the Auto Scaling Group"
  value       = module.ec2.asg_name
}

output "cloudfront_distribution_id" {
  description = "The CloudFront distribution ID"
  value       = module.s3-bucket-frontend-deployment.cloudfront_distribution_id
}