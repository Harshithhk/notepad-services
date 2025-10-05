# Gets your existing Route 53 hosted zone for "domain.com"
data "aws_route53_zone" "default" {
  name         = var.root_domain_name
  private_zone = false
}

# Creates the A record for "subdomain.domain.com" pointing to CloudFront
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.default.zone_id
  name    = "${var.subdomain}.${var.root_domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}