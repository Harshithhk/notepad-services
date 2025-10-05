resource "aws_s3_bucket" "bucket-1" {
  bucket = "${var.subdomain}.${var.root_domain_name}"
}

data "aws_s3_bucket" "selected-bucket" {
  bucket = aws_s3_bucket.bucket-1.bucket
}