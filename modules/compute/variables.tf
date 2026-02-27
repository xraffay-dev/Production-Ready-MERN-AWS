variable "iam_instance_profile" {
  description = "IAM instance profile name for EC2 instance"
  type        = string
  default     = null
}

variable "security_group_id" {
  description = "Security group ID for EC2 instance"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC to deploy compute resources into"
  type        = string
}

variable "public_subnet_id" {
  description = "ID of the public subnet for the EC2 instance and ALB"
  type        = string
}
