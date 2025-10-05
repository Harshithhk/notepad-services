#!/bin/bash
set -e

# Go to root where Terraform files are
ROOT_DIR="$(dirname "$0")/.."
cd "$ROOT_DIR"

TF_VARS_FILE="terraform-dev.tfvars"

echo "==============================="
echo "  Destroying Terraform Infra"
echo "==============================="

read -p "Are you sure you want to destroy all infrastructure? This action is irreversible! (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Initializing Terraform..."
terraform init

echo "Planning destroy..."
terraform plan -destroy -var-file="$TF_VARS_FILE"

echo "Destroying infrastructure..."
terraform destroy -var-file="$TF_VARS_FILE" --auto-approve

echo "==============================="
echo "  Infrastructure Destroyed"
echo "==============================="
