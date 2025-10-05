# Requests the SSL certificate for your custom domain
resource "aws_acm_certificate" "default" {
  provider          = aws.us-east-1 # CloudFront requires certs in us-east-1
  domain_name       = "${var.subdomain}.${var.root_domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Creates the DNS records in Route 53 to validate certificate ownership
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.default.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.default.zone_id
}

# Waits for the certificate to be fully validated before proceeding
resource "aws_acm_certificate_validation" "default" {
  provider                = aws.us-east-1
  certificate_arn         = aws_acm_certificate.default.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}