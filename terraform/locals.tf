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