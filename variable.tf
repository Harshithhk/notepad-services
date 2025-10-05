variable "root_domain_name" {
  type        = string
  description = "The root domain name, e.g., harshithkelkar.com"
  default     = "harshithkelkar.com"
}

variable "subdomain" {
  type        = string
  description = "The subdomain to use, e.g., www"
  default     = "www"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "profile" {
  type    = string
  default = "default"
}