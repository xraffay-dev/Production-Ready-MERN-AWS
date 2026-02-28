
# Storage Module
# //S3 Bucket for Frontend Deployment
# module "s3-bucket-frontend-deployment" {
#   source = "../modules/storage"
# }

# VPC Module
module "vpc" {
  source = "../modules/vpc"
}

# IAM Module
module "iam" {
  source = "../modules/iam"
}

# Security Module
module "security" {
  source = "../modules/security"

  mongo_uri      = var.mongo_uri
  frontend_url   = var.frontend_url
  port           = var.port
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
