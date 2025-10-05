#!/bin/bash
set -e

# Go to root where Terraform files are
ROOT_DIR="$(dirname "$0")/.."
cd "$ROOT_DIR"

# Terraform variables file
TF_VARS_FILE="terraform-prod.tfvars"

# ---------------------------
# Auto-create TFVARS if missing
# ---------------------------
if [ ! -f "$TF_VARS_FILE" ]; then
  echo "Terraform variables file not found. Creating $TF_VARS_FILE with default production values..."
  cat > "$TF_VARS_FILE" <<EOL
domain_name = "harshithkelkar.com"
bucket_name = "harshithkelkar.com"
EOL
  echo "$TF_VARS_FILE created."
fi

# ---------------------------
# Read variables from TFVARS
# ---------------------------
DOMAIN_NAME=$(grep domain_name "$TF_VARS_FILE" | awk -F'=' '{print $2}' | tr -d ' "')
BUCKET_NAME=$(grep bucket_name "$TF_VARS_FILE" | awk -F'=' '{print $2}' | tr -d ' "')

echo "==============================="
echo "  Deploying Terraform Infra"
echo "==============================="

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Plan the deployment
echo "Planning Terraform apply..."
terraform plan -var-file="$TF_VARS_FILE"

# Apply Terraform
echo "Applying Terraform configuration..."
terraform apply -var-file="$TF_VARS_FILE" --auto-approve

# Get the S3 bucket name directly from Terraform output
BUCKET_NAME=$(terraform output -raw s3_bucket_name)

# Sync static site files
echo "Uploading static site files to S3 bucket: $BUCKET_NAME..."
aws s3 sync ./static-files/ s3://$BUCKET_NAME \
  --exclude "terraform/*" 


echo "=================================================="
echo "  Terraform Infrastructure Deployed Successfully" 
echo "=================================================="