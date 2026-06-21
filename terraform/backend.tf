terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Note: For initial local testing without setting up S3, you can comment this out.
  # For production, we will use S3 and DynamoDB for remote state management.
  # backend "s3" {
  #   bucket         = "emp-mgmt-tf-state-bucket"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}
