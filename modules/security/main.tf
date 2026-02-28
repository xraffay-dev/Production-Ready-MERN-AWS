# Security Group for EC2 Instance
resource "aws_security_group" "ec2_security_group" {
  name        = "ec2-app-sg"
  description = "Security group for EC2 instance running Docker containers with MongoDB Atlas connectivity"
  vpc_id      = var.vpc_id

  # Inbound rule - Allow SSH from anywhere
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound rule - Allow HTTP traffic
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound rule - Allow HTTPS traffic
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound rule - Allow application traffic on port 8000
  # This allows the Load Balancer to communicate with the backend
  ingress {
    description = "Application port from Load Balancer"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound rule - Allow all outbound traffic
  # This allows:
  # - Docker to pull images from ECR
  # - EC2 instance to connect to MongoDB Atlas (port 27017)
  # - General internet access for package updates
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "EC2 Application Security Group"
  }
}

# Security Group for VPC Interface Endpoints (ECR API / ECR DKR)
#
# WHY THIS EXISTS:
# EC2 instances in the private subnets need to pull Docker images from ECR.
# Without VPC Endpoints, that traffic would have to leave the VPC to reach ECR
# over the public internet — which doesn't work from private subnets with no NAT Gateway.
#
# Instead, we create Interface VPC Endpoints (aws_vpc_endpoint) that put an ENI
# (Elastic Network Interface) directly inside the private subnets. EC2 instances
# talk to ECR through that private ENI, staying entirely inside the VPC.
#
# This SG is attached to those endpoint ENIs to control what traffic they accept.
resource "aws_security_group" "vpc_endpoint_sg" {
  name        = "vpc-endpoint-sg"
  description = "Allow HTTPS from within the VPC to interface endpoints"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC CIDR"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    # Port 443 only — ECR's API and Docker registry both communicate over HTTPS.
    # Scoped to the VPC CIDR (e.g. 10.0.0.0/16) so only resources inside this
    # VPC can reach the endpoint ENI. Nothing from the internet can hit it.
    cidr_blocks = [var.vpc_cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    # Open egress so the endpoint ENI can respond back to callers
    # and make any necessary outbound calls to the AWS service.
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "VPC Endpoint Security Group"
  }
}

resource "aws_ssm_parameter" "ec2_config_PORT" {
  name  = "/ec2/config/PORT"
  type  = "String"
  value = tostring(var.port)
}

resource "aws_ssm_parameter" "ec2_config_MONGO_URI" {
  name  = "/ec2/config/MONGO_URI"
  type  = "SecureString"
  value = var.mongo_uri
}

resource "aws_ssm_parameter" "ec2_config_Frontend_URL" {
  name  = "/ec2/config/Frontend_URL"
  type  = "String"
  value = var.frontend_url
}

