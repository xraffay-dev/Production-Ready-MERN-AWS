variable "iam_instance_profile" {
  description = "IAM instance profile name for EC2 instance"
  type        = string
  default     = null
}

variable "security_group_id" {
  description = "Security group ID for EC2 instance"
  type        = string
}
