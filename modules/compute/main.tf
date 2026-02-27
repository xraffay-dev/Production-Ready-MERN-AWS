# Create EC2 Instance Template and Attach IAM Role
resource "aws_launch_template" "ec2-launch-template" {
  name = "ec2-launch-template"

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  image_id                             = "ami-0317b0f0a0144b137"
  instance_initiated_shutdown_behavior = "terminate"
  instance_type                        = "t3.micro"
  vpc_security_group_ids               = [var.security_group_id]

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

  subnet_id = var.public_subnet_id
}

# Create Load Balancer
resource "aws_lb" "mern-lb" {
  name               = "mern-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = [var.public_subnet_id]
}

resource "aws_lb_target_group" "mern-tg" {
  name     = "mern-tg"
  port     = 8000 # Change to var after testing
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "app_listener" {
  load_balancer_arn = aws_lb.mern-lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.mern-tg.arn
    type             = "forward"
  }
}

resource "aws_lb_target_group_attachment" "app_tg_attachment" {
  target_group_arn = aws_lb_target_group.mern-tg.arn
  target_id        = aws_instance.ec2-instance.id
  port             = 8000
}
