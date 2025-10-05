terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.region
}

# Provider for us-east-1 region, required for ACM certificate for CloudFront
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}