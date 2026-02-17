# ECR Pull Policy
resource "aws_iam_policy" "ecr_pull_policy" {
  name        = "ecr-pull-policy"
  description = "Policy to allow EC2 instances to pull images from ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "ECR Pull Policy"
  }
}

# IAM Role (Trust Policy for EC2)
resource "aws_iam_role" "ec2_app_role" {
  name        = "ec2-app-role"
  description = "IAM role for EC2 instances with ECR and SSM access"

  # Trust policy - allows EC2 service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "EC2 Application Role"
  }
}

# Attach Policy to Role
resource "aws_iam_role_policy_attachment" "ecr_policy_attachment" {
  role       = aws_iam_role.ec2_app_role.name
  policy_arn = aws_iam_policy.ecr_pull_policy.arn
}

# Instance Profile using Role
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_app_role.name

  tags = {
    Name = "EC2 Application Instance Profile"
  }
}

# Create SSM Parameter Store Policy
resource "aws_iam_policy" "ec2_ssm_policy" {
  name        = "ec2-ssm-parameter-read-policy"
  description = "Policy to allow EC2 instances to read parameters from SSM Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/ec2/config/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:DescribeParameters"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "SSM Parameter Read Policy for EC2"
  }
}

resource "aws_iam_role_policy_attachment" "ssm_policy_attachment" {
  role       = aws_iam_role.ec2_app_role.name
  policy_arn = aws_iam_policy.ec2_ssm_policy.arn
}
