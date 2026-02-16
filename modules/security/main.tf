# ============================================================================
# Security Group for EC2 Instance
# ============================================================================

resource "aws_security_group" "ec2_security_group" {
  name        = "ec2-app-sg"
  description = "Security group for EC2 instance running Docker containers with MongoDB Atlas connectivity"

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
