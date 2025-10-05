variable "root_domain_name" {
  type        = string
  description = "The root domain name, e.g., harshithkelkar.com"
  default     = "harshithkelkar.com"
}

# This new variable will hold all the domains you want to use
variable "full_domain_names" {
  type        = list(string)
  description = "A list of full domain names for the website."
  default     = [
    "notepad-minus-minus.harshithkelkar.com",
    "www.notepad-minus-minus.harshithkelkar.com"
  ]
}

# The old "subdomain" variable is no longer needed

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "profile" {
  type    = string
  default = "default"
}