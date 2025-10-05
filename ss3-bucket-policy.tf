# This resource is no longer needed as the policy will handle permissions
# resource "aws_s3_bucket_public_access_block" "example" { ... }

# This resource is also not needed with OAC
# resource "aws_s3_bucket_ownership_controls" "s3_bucket_acl_ownership" { ... }

resource "aws_s3_bucket_policy" "bucket-policy" {
  bucket = data.aws_s3_bucket.selected-bucket.id
  policy = data.aws_iam_policy_document.iam-policy-1.json
}

# Updated IAM policy to only allow access from CloudFront
data "aws_iam_policy_document" "iam-policy-1" {
  statement {
    sid    = "AllowCloudFront"
    effect = "Allow"
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.bucket-1.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.s3_distribution.arn]
    }
  }
}