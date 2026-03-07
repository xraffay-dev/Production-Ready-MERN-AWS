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

variable "public_subnet_id_a" {
  description = "ID of the first public subnet (AZ-a) for the EC2 instance"
  type        = string
}

variable "public_subnet_id_b" {
  description = "ID of the second public subnet (AZ-b) for the ALB"
  type        = string
}

variable "private_subnet_id_a" {
  description = "ID of the first private subnet (AZ-a) for the EC2 instance"
  type        = string
}

variable "private_subnet_id_b" {
  description = "ID of the second private subnet (AZ-b) for the ALB"
  type        = string
}

variable "port" {
  description = "Port the backend application listens on"
  type        = number
  default     = 8000
}
