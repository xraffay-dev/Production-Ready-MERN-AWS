
# Storage Module
# S3 Bucket + CloudFront Distribution for Frontend Deployment
# alb_dns_name is wired from the compute module so CloudFront can forward
# /api/* requests to the ALB backend origin.
module "s3-bucket-frontend-deployment" {
  source = "../modules/storage"

  alb_dns_name = module.ec2.alb_dns_name

  # The storage module depends on the compute module to know the ALB DNS.
  depends_on = [module.ec2]
}

# VPC Module
module "vpc" {
  source = "../modules/vpc"
}

# IAM Module
module "iam" {
  source = "../modules/iam"

  docdb_cert_bucket = module.database.config_bucket_name
}

# Security Module
module "security" {
  source = "../modules/security"

  vpc_id         = module.vpc.vpc_id
  vpc_cidr_block = module.vpc.vpc_cidr_block
}

# Networking Module (Subnets, IGW, Route Tables, VPC Endpoints)
module "networking" {
  source = "../modules/networking"

  vpc_id                = module.vpc.vpc_id
  vpc_endpoint_sg_id    = module.security.vpc_endpoint_sg_id
  public_subnet_cidr_a  = "10.0.1.0/24"
  availability_zone_a   = "ap-south-1a"
  public_subnet_cidr_b  = "10.0.2.0/24"
  availability_zone_b   = "ap-south-1b"
  private_subnet_cidr_a = "10.0.3.0/24"
  private_subnet_cidr_b = "10.0.4.0/24"
}

# EC2 Launch Template + ALB + Auto Scaling Group
module "ec2" {
  source = "../modules/compute"

  iam_instance_profile = module.iam.ec2_instance_profile_name
  security_group_id    = module.security.security_group_id
  vpc_id               = module.vpc.vpc_id
  public_subnet_id_a   = module.networking.public_subnet_id_a
  public_subnet_id_b   = module.networking.public_subnet_id_b
  private_subnet_id_a  = module.networking.private_subnet_id_a
  private_subnet_id_b  = module.networking.private_subnet_id_b
  port                 = var.port
}

# DocumentDB Module
module "database" {
  source = "../modules/database"

  docdb_security_group_id = module.security.docdb_sg_id
  private_subnet_ids      = [module.networking.private_subnet_id_a, module.networking.private_subnet_id_b]

  docdb_master_username = var.docdb_master_username
  docdb_master_password = var.docdb_master_password

  # Instance configuration
  instance_class     = "db.t3.medium"
  instance_count     = 2
  availability_zones = ["ap-south-1a", "ap-south-1b"]

  # Backup & protection (adjust for production)
  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  # TLS certificate path (local file, uploaded to S3 by Terraform)
  docdb_tls_cert_path = var.docdb_tls_cert_path
}

# ---------------------------------------------------------------------------
# SSM Parameter — FRONTEND_URL
# ---------------------------------------------------------------------------
# The EC2 user-data fetches this at boot and passes it to the Docker container
# as FRONTEND_URL (used for CORS). We set it here — after CloudFront is
# created — so it always reflects the real CloudFront domain, not localhost.
resource "aws_ssm_parameter" "frontend_url" {
  name  = "/ec2/config/Frontend_URL"
  type  = "String"
  value = module.s3-bucket-frontend-deployment.cloudfront_domain_name

  tags = {
    Name = "Frontend CloudFront URL"
  }
}

# SSM Parameter — PORT
# Keeps the port value in SSM so the user-data script can fetch it without
# any hardcoded values in the launch template.
resource "aws_ssm_parameter" "port" {
  name  = "/ec2/config/PORT"
  type  = "String"
  value = tostring(var.port)

  tags = {
    Name = "Backend Application Port"
  }
}

# ---------------------------------------------------------------------------
# Frontend .env.production — kept in sync with the real CloudFront URL
# ---------------------------------------------------------------------------
# After every apply, Terraform rewrites ../frontend/.env.production so the
# next `npm run build` picks up the correct VITE_API_BASE_URL automatically.
# No manual copy-paste of CloudFront domains ever needed.
resource "local_file" "frontend_env_production" {
  content  = "VITE_API_BASE_URL=${module.s3-bucket-frontend-deployment.cloudfront_domain_name}/api\n"
  filename = "${path.module}/../frontend/.env.production"
}

# Outputs
output "asg_id" {
  description = "The ID of the Auto Scaling Group"
  value       = module.ec2.asg_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ec2.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution URL — use this as your frontend URL"
  value       = module.s3-bucket-frontend-deployment.cloudfront_domain_name
}

output "docdb_cluster_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.database.cluster_endpoint
}

output "docdb_connection_string" {
  description = "DocumentDB connection string (sensitive)"
  value       = module.database.connection_string
  sensitive   = true
}
