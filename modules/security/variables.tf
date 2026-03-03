variable "project_name" {
  description = "Project name used as a prefix for resource names"
  type        = string
  default     = "grocy"
}

variable "vpc_id" {
  description = "The ID of the VPC in which to create the security group"
  type        = string
}

variable "vpc_cidr_block" {
  description = "CIDR block of the VPC (used to scope VPC endpoint SG ingress)"
  type        = string
}
