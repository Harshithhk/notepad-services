resource "aws_s3_bucket" "bucket-1" {
  # The bucket will be named after the first domain in your list
  bucket = var.full_domain_names[0]
}

data "aws_s3_bucket" "selected-bucket" {
  bucket = aws_s3_bucket.bucket-1.bucket
}