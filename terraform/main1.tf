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