data "aws_route53_zone" "default" {
  name         = var.root_domain_name
  private_zone = false
}

# This will now create a record for each domain name in your list
resource "aws_route53_record" "site_records" {
  for_each = toset(var.full_domain_names) 

  zone_id = data.aws_route53_zone.default.zone_id
  name    = each.value 
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}