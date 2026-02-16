# ============================================================================
# STEP 5: Create EC2 Instance Template and Attach IAM Role
# ============================================================================

resource "aws_launch_template" "ec2-launch-template" {
  name = "ec2-launch-template"

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  image_id = "ami-0317b0f0a0144b137"

  instance_initiated_shutdown_behavior = "terminate"

  instance_market_options {
    market_type = "spot"
  }

  instance_type = "t3.micro"

  vpc_security_group_ids = [var.security_group_id]

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "ECR-Enabled EC2 Instance"
    }
  }

  user_data = filebase64("${path.module}/user-data.sh")
}

# Create EC2 Instance from the Template
resource "aws_instance" "ec2-instance" {
  # Reference the launch template ID and use the $Latest version
  launch_template {
    id      = aws_launch_template.ec2-launch-template.id
    version = "$Latest"
  }

}
