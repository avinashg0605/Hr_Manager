provider "aws" {
  region = "ap-south-1"
}

#################################
# KEY PAIR (AUTO GENERATED)
#################################

resource "tls_private_key" "generated" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  key_name   = "jenkins-key"
  public_key = tls_private_key.generated.public_key_openssh
}

resource "local_file" "private_key" {
  content  = tls_private_key.generated.private_key_pem
  filename = "jenkins-key.pem"
}

#################################
# VPC + NETWORK
#################################

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
}

#################################
# ROUTING
#################################

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_rt.id
}

#################################
# NAT GATEWAY
#################################

resource "aws_eip" "nat_eip" {}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public.id
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private_rt.id
}

#################################
# SECURITY GROUPS
#################################

resource "aws_security_group" "jenkins_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # restrict later!
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "private_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.jenkins_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

#################################
# AMI
#################################

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
}

#################################
# JENKINS INSTALL SCRIPT
#################################

locals {
  jenkins_userdata = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y java-17-amazon-corretto

    wget -O /etc/yum.repos.d/jenkins.repo \
    https://pkg.jenkins.io/redhat-stable/jenkins.repo

    rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key

    yum install -y jenkins
    systemctl enable jenkins
    systemctl start jenkins
  EOF
}

#################################
# EC2 INSTANCES
#################################

resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  key_name               = aws_key_pair.generated.key_name
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]

  user_data = local.jenkins_userdata

  tags = {
    Name = "Jenkins-Server"
  }
}

resource "aws_instance" "private" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private.id
  key_name               = aws_key_pair.generated.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name = "Private-Agent"
  }
}

#################################
# OUTPUTS
#################################

output "jenkins_public_ip" {
  value = aws_instance.jenkins.public_ip
}

output "private_ip" {
  value = aws_instance.private.private_ip
}

# -------------------
# 🔐 Where to run ssh-keygen?

# You should run it inside the Public EC2 (Jenkins server).

# ✅ Step-by-step Flow
# 1. Connect to Jenkins (Public EC2)

# From your local machine:

# ssh -i jenkins-key.pem ec2-user@<jenkins-public-ip>
# 2. Generate SSH Key (INSIDE Jenkins EC2)
# ssh-keygen

# Just press Enter for all prompts (no passphrase for simplicity).

# This creates:

# ~/.ssh/id_rsa
# ~/.ssh/id_rsa.pub
# 3. Copy Key to Private EC2
# ssh-copy-id ec2-user@<private-ip>

# 👉 This works because:

# Both EC2 instances are in same VPC
# Security group allows SSH from Jenkins → Private EC2
# 4. Test Connection
# ssh ec2-user@<private-ip>

# If it connects without password, you're done ✅

# 🔗 Now Connect from Jenkins UI

# In Jenkins dashboard:

# Go to: Manage Jenkins → Nodes → New Node
# Choose:
# Type: Permanent Agent
# Launch method: SSH
# Enter:
# Host: <private-ip>
# Credentials:
# → Add → SSH Username with private key
# → Paste content of:
# cat ~/.ssh/id_rsa
# ⚠️ Important Clarification
# Where	Purpose
# Local machine	SSH into Jenkins (using .pem)
# Public EC2 (Jenkins)	Generate SSH key
# Private EC2	Receives public key