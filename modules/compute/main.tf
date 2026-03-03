# Create EC2 Instance Template and Attach IAM Role
resource "aws_launch_template" "ec2-launch-template" {
  name = "ec2-launch-template"

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  image_id                             = "ami-0bfc980bcfa30ed57"
  instance_initiated_shutdown_behavior = "terminate"
  instance_type                        = "c7i-flex.large"
  vpc_security_group_ids               = [var.security_group_id]

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "ECR-Enabled EC2 Instance"
    }
  }

  user_data = filebase64("${path.module}/user-data.sh")
}


# Create Load Balancer
resource "aws_lb" "mern-lb" {
  name               = "mern-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = [var.public_subnet_id_a, var.public_subnet_id_b]
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

# Target group attachment is handled by the ASG via aws_autoscaling_attachment below

# Auto Scaling Group
resource "aws_autoscaling_group" "asg" {
  desired_capacity = 1
  max_size         = 2
  min_size         = 1
  vpc_zone_identifier = [
    var.private_subnet_id_a,
    var.private_subnet_id_b
  ]

  target_group_arns = [aws_lb_target_group.mern-tg.arn]
  health_check_type = "ELB"

  launch_template {
    id      = aws_launch_template.ec2-launch-template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "cpu_policy" {
  name                   = "cpu-scaling-policy"
  autoscaling_group_name = aws_autoscaling_group.asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}
