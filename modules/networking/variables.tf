variable "vpc_id" {
  description = "The ID of the VPC in which to create the subnet"
  type        = string
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability Zone in which to place the public subnet"
  type        = string
  default     = "ap-south-1a"
}