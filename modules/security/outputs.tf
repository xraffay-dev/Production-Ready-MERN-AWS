output "security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_security_group.id
}

output "security_group_name" {
  description = "Name of the EC2 security group"
  value       = aws_security_group.ec2_security_group.name
}
