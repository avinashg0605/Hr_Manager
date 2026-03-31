#################################
# Terraform
#################################
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

#################################
# Provider
#################################
provider "aws" {
  region = local.region
}