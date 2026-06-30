data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.environment}-app-lt"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  # SECURITY: No SSH key pair is configured.
  # Instance access is handled exclusively via AWS Systems Manager (SSM) Session Manager,
  # which provides audited, keyless shell access without opening port 22.
  # The EC2 IAM role must have AmazonSSMManagedInstanceCore policy for SSM to work.
  network_interfaces {
    security_groups = [var.app_security_group_id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }


  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install docker -y
              service docker start
              usermod -a -G docker ec2-user
              chkconfig docker on

              # Install AWS CLI v2
              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              sudo ./aws/install

              # Login to ECR dynamically using the instance profile
              REGION="${data.aws_region.current.name}"
              ACCOUNT_ID="${data.aws_caller_identity.current.account_id}"
              /usr/local/bin/aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

              # Pull and run containers
              docker pull $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/employee-mgmt-backend:latest || true
              docker run -d --name backend --restart unless-stopped -p 5000:5000 \
                -e DB_HOST="${var.db_host}" \
                -e DB_USER="${var.db_user}" \
                -e DB_PASS="${var.db_pass}" \
                -e DB_NAME="${var.db_name}" \
                -e FLASK_ENV=production \
                $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/employee-mgmt-backend:latest || true

              docker pull $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/employee-mgmt-frontend:latest || true
              docker run -d --name frontend --restart unless-stopped -p 80:80 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/employee-mgmt-frontend:latest || true
              EOF
  )
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.environment}-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = var.target_group_arns
  health_check_type   = "ELB"
  min_size            = 1
  max_size            = 3
  desired_capacity    = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-app-instance"
    propagate_at_launch = true
  }
}
