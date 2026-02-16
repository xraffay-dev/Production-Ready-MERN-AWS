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
  default     = 8000

  validation {
    condition     = var.port > 0 && var.port <= 65535
    error_message = "Port must be between 1 and 65535."
  }
}
