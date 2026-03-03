variable "port" {
  description = "Port number for the backend application"
  type        = number
  default     = 8000

  validation {
    condition     = var.port > 0 && var.port <= 65535
    error_message = "Port must be between 1 and 65535."
  }
}

# DocumentDB Credentials
variable "docdb_master_username" {
  description = "Master username for the DocumentDB cluster"
  type        = string
  sensitive   = true
}

variable "docdb_master_password" {
  description = "Master password for the DocumentDB cluster (min 8 chars)"
  type        = string
  sensitive   = true
}

variable "docdb_tls_cert_path" {
  description = "Local path to the global-bundle.pem TLS certificate for DocumentDB"
  type        = string
}
