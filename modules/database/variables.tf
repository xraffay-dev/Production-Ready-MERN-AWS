# ============================================================================
# Input Variables for the DocumentDB Module
# ============================================================================

variable "project_name" {
  description = "Project name used as a prefix for all DocumentDB resources"
  type        = string
  default     = "grocy"
}

variable "docdb_security_group_id" {
  description = "ID of the security group to attach to the DocumentDB cluster (created in the security module)"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DocumentDB subnet group"
  type        = list(string)
}

variable "docdb_master_username" {
  description = "Master username for the DocumentDB cluster"
  type        = string
  sensitive   = true
}

variable "docdb_master_password" {
  description = "Master password for the DocumentDB cluster (min 8 characters)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.docdb_master_password) >= 8
    error_message = "DocumentDB master password must be at least 8 characters."
  }
}

variable "instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "instance_count" {
  description = "Number of DocumentDB instances (1 = primary only, 2+ = primary + replicas)"
  type        = number
  default     = 2
}

variable "availability_zones" {
  description = "List of AZs for each instance — index 0 = primary, index 1+ = replicas"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups (1-35)"
  type        = number
  default     = 1

  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days."
  }
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when destroying the cluster (set false for prod)"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection on the cluster"
  type        = bool
  default     = false
}

variable "docdb_tls_cert_path" {
  description = "Local path to the AWS global-bundle.pem TLS certificate for DocumentDB"
  type        = string
}
