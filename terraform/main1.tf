#################################
# Provider
#################################
provider "aws" {
  region = local.region
}

#################################
# Locals
#################################
locals {
  region            = "us-east-1"
  project_name      = "hr_manager"
  availability_zone = "us-east-1a"

  common_tags = {
    Project = local.project_name
    Managed = "terraform"
  }

  names = {
    vpc            = "${local.project_name}-vpc"
    igw            = "${local.project_name}-igw"
    public_subnet  = "${local.project_name}-public-subnet"
    private_subnet = "${local.project_name}-private-subnet"
    public_rt      = "${local.project_name}-public-rt"
    private_rt     = "${local.project_name}-private-rt"
    nat            = "${local.project_name}-nat"
  }
}

#################################
# Variables
#################################
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "Private subnet CIDR"
  type        = string
  default     = "10.0.2.0/24"
}

#################################
# VPC
#################################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = local.names.vpc
  })
}

#################################
# Internet Gateway
#################################
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = local.names.igw
  })
}

#################################
# Subnets (Single AZ)
#################################
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = local.availability_zone
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = local.names.public_subnet
  })
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = local.availability_zone

  tags = merge(local.common_tags, {
    Name = local.names.private_subnet
  })
}

#################################
# Route Tables
#################################
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = local.names.public_rt
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = local.names.private_rt
  })
}

#################################
# Routes
#################################
# Public → Internet
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

#################################
# NAT Gateway (Private Internet Access)
#################################
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-eip"
  })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = merge(local.common_tags, {
    Name = local.names.nat
  })

  depends_on = [aws_internet_gateway.igw]
}

# Private → Internet via NAT
resource "aws_route" "private_internet" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

#################################
# Route Table Associations
#################################
resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

#################################
# Outputs (Optional but useful)
#################################
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "private_subnet_id" {
  value = aws_subnet.private.id
}

output "nat_gateway_id" {
  value = aws_nat_gateway.nat.id
}
resource "aws_key_pair" "key_pair" {
  key_name   = "hr_manager"
  public_key = file("~/.ssh/hr_manager.pub")
}
# =========================================
# SECURITY GROUPS
# =========================================
# Public EC2 Security Group (allow SSH, HTTP)
resource "aws_security_group" "public_sg" {
  name        = "${local.project_name}-public-sg"
  description = "Allow SSH and HTTP"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.project_name}-public-sg"
  }
}

# Private EC2 Security Group (allow SSH only from public SG)
resource "aws_security_group" "private_sg" {
  name        = "${local.project_name}-private-sg"
  description = "Private subnet SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from public"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.public_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.project_name}-private-sg"
  }
}

# =========================================
# EC2 INSTANCES
# =========================================
# Public EC2 (t2.micro)
variable "instance_type" {
  default = "t2.micro"
}

variable "ami_id" {
  # Amazon Linux 2023 AMI in us-east-1
  default = "ami-0c02fb55956c7d316"
}

resource "aws_instance" "public_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.public_sg.id]
  key_name               = aws_key_pair.key_pair.id

  tags = {
    Name = "${local.project_name}-public-ec2"
  }
}

# Private EC2 (t2.micro)
resource "aws_instance" "private_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private.id
  vpc_security_group_ids = [aws_security_group.private_sg.id]
  key_name               = aws_key_pair.key_pair.id

  tags = {
    Name = "${local.project_name}-private-ec2"
  }
}