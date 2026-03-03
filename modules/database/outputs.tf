# ============================================================================
# Outputs from the DocumentDB Module
# ============================================================================

output "cluster_endpoint" {
  description = "The cluster endpoint (use this for read-write operations)"
  value       = aws_docdb_cluster.docdb.endpoint
}

output "cluster_reader_endpoint" {
  description = "The reader endpoint (load-balanced across read replicas)"
  value       = aws_docdb_cluster.docdb.reader_endpoint
}

output "cluster_port" {
  description = "The port the DocumentDB cluster listens on"
  value       = aws_docdb_cluster.docdb.port
}

output "cluster_id" {
  description = "The DocumentDB cluster identifier"
  value       = aws_docdb_cluster.docdb.id
}

output "cluster_arn" {
  description = "ARN of the DocumentDB cluster"
  value       = aws_docdb_cluster.docdb.arn
}

# Full MongoDB-compatible connection string with TLS enabled.
# Usage: mongosh "this_output" --tls --tlsCAFile global-bundle.pem
output "connection_string" {
  description = "MongoDB-compatible connection URI for the DocumentDB cluster"
  value       = "mongodb://${var.docdb_master_username}:${var.docdb_master_password}@${aws_docdb_cluster.docdb.endpoint}:${aws_docdb_cluster.docdb.port}/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  sensitive   = true
}

output "config_bucket_name" {
  description = "Name of the S3 bucket storing the DocumentDB TLS certificate"
  value       = aws_s3_bucket.docdb_config.id
}
