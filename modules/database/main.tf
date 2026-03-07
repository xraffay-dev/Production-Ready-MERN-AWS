# ============================================================================
# AWS DocumentDB Cluster — db.t3.medium
# ============================================================================
#
# ARCHITECTURE OVERVIEW:
# DocumentDB is Amazon's managed MongoDB-compatible database service.
# It runs inside your VPC in private subnets, accessible only from within
# the VPC. The architecture here is:
#
#   EC2 (private subnets) ──▶ DocumentDB SG (port 27017) ──▶ DocumentDB Cluster
#
# DocumentDB requires:
#   1. A Subnet Group   — tells DocumentDB which subnets to place instances in
#   2. A Cluster        — the database engine (manages storage, replication)
#   3. Instance(s)      — the compute nodes that serve queries
#
# The Security Group for DocumentDB lives in the security module and is
# passed in via var.docdb_security_group_id.
#

# ---------------------------------------------------------------------------
# 1. DocumentDB Subnet Group
# ---------------------------------------------------------------------------
# A subnet group is a collection of subnets that DocumentDB can use to place
# cluster instances. We use the PRIVATE subnets so the database is never
# directly exposed to the internet.
resource "aws_docdb_subnet_group" "docdb" {
  name       = "${var.project_name}-docdb-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name} DocumentDB Subnet Group"
  }
}

# ---------------------------------------------------------------------------
# 3. DocumentDB Cluster Parameter Group
# ---------------------------------------------------------------------------
# Parameter groups let you configure engine-level settings. Here we enable
# TLS (enforced by default) and set the audit log level. You can add more
# parameters as needed (e.g., profiler, TTL monitor).
resource "aws_docdb_cluster_parameter_group" "docdb" {
  family      = "docdb5.0"
  name        = "${var.project_name}-docdb-params"
  description = "DocumentDB cluster parameter group for ${var.project_name}"

  # TLS enforcement — "enabled" means all connections MUST use TLS.
  # Clients need the global-bundle.pem certificate.
  parameter {
    name  = "tls"
    value = "enabled"
  }

  # Audit logs — logs all DDL, DML, and authentication events to CloudWatch.
  # Useful for compliance and debugging. Set to "disabled" to reduce cost.
  parameter {
    name  = "audit_logs"
    value = "disabled"
  }

  tags = {
    Name = "${var.project_name} DocumentDB Parameter Group"
  }
}

# ---------------------------------------------------------------------------
# 4. DocumentDB Cluster
# ---------------------------------------------------------------------------
# The cluster is the "brain" of DocumentDB. It manages the shared storage
# volume, replication, and failover. You set credentials here and reference
# the parameter group, subnet group, and security group created above.
resource "aws_docdb_cluster" "docdb" {
  cluster_identifier              = "${var.project_name}-docdb-cluster"
  engine                          = "docdb"
  engine_version                  = "5.0.0"
  master_username                 = var.docdb_master_username
  master_password                 = var.docdb_master_password
  db_subnet_group_name            = aws_docdb_subnet_group.docdb.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.docdb.name
  vpc_security_group_ids          = [var.docdb_security_group_id]

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00" # UTC — 8:00-9:00 AM PKT

  # Maintenance window (non-overlapping with backup window)
  preferred_maintenance_window = "sun:05:00-sun:06:00"

  # Skip final snapshot on destroy (set to false for production)
  skip_final_snapshot = var.skip_final_snapshot

  # Deletion protection — prevents accidental `terraform destroy`
  deletion_protection = var.deletion_protection

  # Storage encryption at rest using AWS-managed KMS key
  storage_encrypted = true

  tags = {
    Name = "${var.project_name} DocumentDB Cluster"
  }
}

# ---------------------------------------------------------------------------
# 5. DocumentDB Instance(s)
# ---------------------------------------------------------------------------
# Instances are the compute nodes that actually serve queries. Each instance
# reads from the shared cluster storage. The first instance is the PRIMARY
# (read-write), and any additional instances are READ REPLICAS.
#
# AZ placement:
#   - Instance 0 (primary)  → ap-south-1a
#   - Instance 1 (replica)  → ap-south-1b
#
# We're using db.t3.medium as requested:
#   - 2 vCPUs, 4 GiB RAM
#   - Burstable performance (good for dev/staging or moderate workloads)
#   - Supports DocumentDB 5.0
resource "aws_docdb_cluster_instance" "docdb" {
  count              = var.instance_count
  identifier         = "${var.project_name}-docdb-instance-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.docdb.id
  instance_class     = var.instance_class
  availability_zone  = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name} DocumentDB Instance ${count.index + 1}"
  }
}

# ---------------------------------------------------------------------------
# 6. SSM Parameter — DOCDB_URI
# ---------------------------------------------------------------------------
# Stores the DocumentDB connection string in SSM Parameter Store so EC2
# instances can fetch it at boot (via user-data). This replaces the old
# MongoDB Atlas URI.
#
# Key differences from Atlas:
#   - tls=true              (DocumentDB enforces TLS)
#   - tlsCAFile path        (EC2 downloads global-bundle.pem at boot)
#   - retryWrites=false     (DocumentDB does not support retryable writes)
#   - directConnection=true (connect directly, not via SRV)
resource "aws_ssm_parameter" "docdb_uri" {
  name  = "/ec2/config/DOCDB_URI"
  type  = "SecureString"
  value = "mongodb://${var.docdb_master_username}:${var.docdb_master_password}@${aws_docdb_cluster.docdb.endpoint}:${aws_docdb_cluster.docdb.port}/Grocy?tls=true&tlsCAFile=/home/ec2-user/global-bundle.pem&retryWrites=false&directConnection=true&authMechanism=SCRAM-SHA-1"

  tags = {
    Name = "${var.project_name} DocumentDB Connection URI"
  }
}

# ---------------------------------------------------------------------------
# 7. S3 Bucket + Object — TLS Certificate
# ---------------------------------------------------------------------------
# The global-bundle.pem certificate (~90KB) is too large for SSM Parameter
# Store (4KB limit). Instead, we store it in S3. EC2 instances download it
# at boot via the S3 VPC Gateway Endpoint (no internet needed).
resource "aws_s3_bucket" "docdb_config" {
  bucket = "${var.project_name}-docdb-config-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name} DocumentDB Config Bucket"
  }
}

resource "aws_s3_bucket_public_access_block" "docdb_config" {
  bucket = aws_s3_bucket.docdb_config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "docdb_tls_cert" {
  bucket = aws_s3_bucket.docdb_config.id
  key    = "certs/global-bundle.pem"
  source = var.docdb_tls_cert_path

  tags = {
    Name = "${var.project_name} DocumentDB TLS Certificate"
  }
}

# Data source to get the current AWS account ID for unique bucket naming
data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# 8. SSM Parameter — Cert Bucket Name
# ---------------------------------------------------------------------------
# Store the S3 bucket name in SSM so user-data can reference it dynamically.
resource "aws_ssm_parameter" "docdb_cert_bucket" {
  name  = "/ec2/config/DOCDB_CERT_BUCKET"
  type  = "String"
  value = aws_s3_bucket.docdb_config.id

  tags = {
    Name = "${var.project_name} DocumentDB Cert Bucket"
  }
}
