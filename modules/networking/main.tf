# Public Subnet (AZ-a)
resource "aws_subnet" "public_a" {
  vpc_id                  = var.vpc_id
  cidr_block              = var.public_subnet_cidr_a
  availability_zone       = var.availability_zone_a
  map_public_ip_on_launch = false # ALB handles public traffic; EC2s don't need auto-assigned public IPs

  tags = {
    Type = "Public"
  }
}

# Public Subnet (AZ-b) — required by ALB (needs 2 subnets in different AZs)
resource "aws_subnet" "public_b" {
  vpc_id                  = var.vpc_id
  cidr_block              = var.public_subnet_cidr_b
  availability_zone       = var.availability_zone_b
  map_public_ip_on_launch = true

  tags = {
    Type = "Public"
  }
}

# Private Subnet (AZ-a)
resource "aws_subnet" "private_a" {
  vpc_id            = var.vpc_id
  cidr_block        = var.private_subnet_cidr_a
  availability_zone = var.availability_zone_a

  tags = {
    Type = "Private"
  }
}

# Private Subnet (AZ-b)
resource "aws_subnet" "private_b" {
  vpc_id            = var.vpc_id
  cidr_block        = var.private_subnet_cidr_b
  availability_zone = var.availability_zone_b

  tags = {
    Type = "Private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = var.vpc_id
  tags = {
    Name = "igw"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = var.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }

  tags = {
    Name = "public-rt"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = var.vpc_id

  tags = {
    Name = "private-rt"
  }
}

# Route Table Association (Public AZ-a)
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

# Route Table Association (Public AZ-b)
resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Route Table Association (Private AZ-a)
resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

# Route Table Association (Private AZ-b)
resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# VPC Endpoint — ECR API (for image metadata / auth)
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type = "Interface"

  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids = [var.vpc_endpoint_sg_id]

  private_dns_enabled = true
}

# VPC Endpoint — ECR DKR (for Docker image layer pulls)
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type = "Interface"

  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids = [var.vpc_endpoint_sg_id]

  private_dns_enabled = true
}


# VPC Endpoint — S3 (Gateway type, no SG needed)
# S3 is used by ECR to store Docker image layers.
# Gateway endpoints are free and route traffic via the route table — no ENI, no SG.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [aws_route_table.private.id]
}

# VPC Endpoint — SSM (Systems Manager API)
#
# WHY ALL THREE SSM ENDPOINTS ARE NEEDED:
# Instances in private subnets have no internet access and no NAT Gateway.
# Without these endpoints, any call to SSM (e.g. fetching parameters from
# Parameter Store in user-data, or SSM Agent heartbeats) will time out —
# exactly the "Connect timeout on ssm.ap-south-1.amazonaws.com" error seen at boot.
#
#   ssm          → The SSM API itself. Used by the AWS CLI / SDK to call
#                  GetParameter, PutParameter, etc. from within the instance.
#
#   ssmmessages  → Used by SSM Session Manager to open interactive shell sessions.
#                  Also required for SSM Agent to establish its control channel.
#
#   ec2messages  → Used by the SSM Agent to send/receive Run Command messages
#                  and report instance status back to the SSM service.
#
# All three are Interface endpoints — they place ENIs in your private subnets
# and use the same vpc_endpoint_sg (port 443 from VPC CIDR) as the ECR endpoints.
resource "aws_vpc_endpoint" "ssm" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.ssm"
  vpc_endpoint_type = "Interface"

  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids = [var.vpc_endpoint_sg_id]

  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.ssmmessages"
  vpc_endpoint_type = "Interface"

  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids = [var.vpc_endpoint_sg_id]

  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.ec2messages"
  vpc_endpoint_type = "Interface"

  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids = [var.vpc_endpoint_sg_id]

  private_dns_enabled = true
}
