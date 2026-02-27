variable "mongo_uri" {
  description = "MongoDB Atlas connection URI for the application"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "Frontend URL for CORS configuration"
  type        = string
}

variable "port" {
  description = "Port number for the backend application"
  type        = number
}

variable "vpc_id" {
  description = "The ID of the VPC in which to create the security group"
  type        = string
}
