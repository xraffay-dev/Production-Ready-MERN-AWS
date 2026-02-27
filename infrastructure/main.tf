
# Storage Module
# //S3 Bucket for Frontend Deployment
# module "s3-bucket-frontend-deployment" {
#   source = "../modules/storage"
# }

# VPC Module
module "vpc" {
  source = "../modules/vpc"
}

# Networking Module (Public Subnet, IGW, Route Table)
module "networking" {
  source = "../modules/networking"

  vpc_id               = module.vpc.vpc_id
  public_subnet_cidr_a = "10.0.1.0/24"
  availability_zone_a  = "ap-south-1a"
  public_subnet_cidr_b = "10.0.2.0/24"
  availability_zone_b  = "ap-south-1b"
}

# IAM Module
module "iam" {
  source = "../modules/iam"
}

# Security Module
module "security" {
  source = "../modules/security"

  mongo_uri    = var.mongo_uri
  frontend_url = var.frontend_url
  port         = var.port
  vpc_id       = module.vpc.vpc_id
}

# EC2 instance with ECR and SSM access
module "ec2" {
  source = "../modules/compute"

  iam_instance_profile = module.iam.ec2_instance_profile_name
  security_group_id    = module.security.security_group_id
  vpc_id               = module.vpc.vpc_id
  public_subnet_id     = module.networking.public_subnet_id
  public_subnet_id_b   = module.networking.public_subnet_id_b
}
