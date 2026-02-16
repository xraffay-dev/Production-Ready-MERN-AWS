output "ec2_instance_profile_name" {
  description = "Name of the instance profile for EC2 application"
  value       = aws_iam_instance_profile.ec2_instance_profile.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the instance profile for EC2 application"
  value       = aws_iam_instance_profile.ec2_instance_profile.arn
}

output "ec2_app_role_name" {
  description = "Name of the IAM role for EC2 application"
  value       = aws_iam_role.ec2_app_role.name
}

output "ec2_app_role_arn" {
  description = "ARN of the IAM role for EC2 application"
  value       = aws_iam_role.ec2_app_role.arn
}
