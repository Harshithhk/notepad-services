# Terraform S3 Static Website - Manual Deployment

This guide explains how to use Terraform to manually provision and deploy a static website to an AWS S3 bucket.

## Table of Contents

- Prerequisites
- Terraform Configuration
- How to Deploy the Infrastructure
- File Descriptions

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Terraform**: Install Terraform
- **AWS CLI**: Install AWS CLI and Configure AWS Credentials

## Terraform Configuration

The Terraform files in this repository will create the following AWS resources:

- **S3 Bucket**: An S3 bucket to store the static website files.
- **S3 Bucket Policy**: A public-read policy to make the website accessible.
- **S3 Bucket Versioning**: Enabled to keep a history of your objects.
- **S3 Website Configuration**: Configured to serve index.html as the main page.

## How to Deploy the Infrastructure

1. **Clone the repository:**

```bash
git clone <your-repository-url>
cd <your-repository-name>
```

2. **Update Terraform variables:**
   Modify the `terraform-dev.tfvars` file with your desired domain_name and bucket_name.

```hcl
domain_name = "your-domain.com"
bucket_name = "your-bucket-name.com"
```

3. **Initialize Terraform:**

```bash
terraform init
```

4. **Plan the deployment:**

```bash
terraform plan -var-file="terraform-dev.tfvars"
```

5. **Apply the configuration:**

```bash
terraform apply -var-file="terraform-dev.tfvars" --auto-approve
```

After applying, Terraform will output the website endpoint URL.

## File Descriptions

| File                   | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `providers.tf`         | Configures the AWS provider for Terraform.                                               |
| `variable.tf`          | Declares the input variables used in the Terraform configuration.                        |
| `terraform-dev.tfvars` | Sets the values for the variables for a development environment.                         |
| `s3-bucket.tf`         | Creates the S3 bucket.                                                                   |
| `s3-acl.tf`            | Sets the Access Control List (ACL) for the S3 bucket to public-read.                     |
| `s3-versioning.tf`     | Enables versioning on the S3 bucket.                                                     |
| `s3-website.tf`        | Configures the S3 bucket for static website hosting.                                     |
| `s3-bucket-policy.tf`  | Defines the bucket policy to allow public read access and configures ownership controls. |
| `s3-object-upload.tf`  | Uploads files from the local uploads/ directory to the S3 bucket.                        |
