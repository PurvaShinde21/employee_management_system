terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Production-grade remote state management with state locking
  backend "s3" {
    bucket         = "employee-mgmt-tf-state-purva"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "employee-mgmt-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
