# resource "aws_key_pair" "key_pair" {
#   key_name   = "hr_manager"
#   public_key = file("~/.ssh/hr_manager.pub")
# }

resource "tls_private_key" "generated" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  key_name   = "hr_manager"
  public_key = tls_private_key.generated.public_key_openssh
}

resource "local_file" "private_key" {
  content  = tls_private_key.generated.private_key_pem
  filename = "hr_manager.pem"
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
  ingress {
    description = "Jenkins"
    from_port   = 8080
    to_port     = 8080
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
  ingress {
    description     = "Backend-API"
    from_port       = 3000
    to_port         = 3000
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
  default = "ami-0c3389a4fa5bddaad"
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