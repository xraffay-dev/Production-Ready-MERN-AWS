
# Storage Module

# //S3 Bucket for Frontend Deployment
# module "s3-bucket-frontend-deployment" {
#   source = "../modules/storage"
# }

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
}

# EC2 instance with ECR and SSM access
module "ec2" {
  source = "../modules/compute"

  iam_instance_profile = module.iam.ec2_instance_profile_name
  security_group_id    = module.security.security_group_id
}
