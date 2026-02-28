resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  # Required for Interface VPC Endpoints (ECR, SSM, etc.) with private_dns_enabled = true.
  #
  # HOW PRIVATE DNS ON VPC ENDPOINTS WORKS:
  # When you create an Interface VPC Endpoint with private_dns_enabled = true, AWS
  # automatically creates a Route 53 Private Hosted Zone inside your VPC. This PHZ
  # overrides the public DNS for the AWS service (e.g. api.ecr.ap-south-1.amazonaws.com)
  # so that it resolves to the private IP of the endpoint ENI instead of the public one.
  # This means EC2 instances can call the AWS SDK normally — no code changes needed —
  # and the traffic stays inside the VPC without needing a NAT Gateway.
  #
  # enable_dns_support   → Enables the Route 53 resolver (AmazonProvidedDNS) in the VPC.
  #                         Without this, DNS queries from inside the VPC go nowhere.
  #
  # enable_dns_hostnames → Allows AWS to assign DNS hostnames to instances and endpoints.
  #                         Required for the Private Hosted Zone override to take effect.
  #                         Without this, private_dns_enabled on an Interface endpoint
  #                         will be rejected by AWS with an InvalidParameter error.
  enable_dns_support   = true
  enable_dns_hostnames = true
}
