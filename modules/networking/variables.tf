variable "vpc_id" {
  description = "The ID of the VPC in which to create the subnet"
  type        = string
}

variable "public_subnet_cidr_a" {
  description = "CIDR block for the first public subnet (AZ-a)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone_a" {
  description = "Availability Zone for the first public subnet (AZ-a)"
  type        = string
  default     = "ap-south-1a"
}

variable "public_subnet_cidr_b" {
  description = "CIDR block for the second public subnet (AZ-b)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "availability_zone_b" {
  description = "Availability Zone for the second public subnet (AZ-b)"
  type        = string
  default     = "ap-south-1b"
}
