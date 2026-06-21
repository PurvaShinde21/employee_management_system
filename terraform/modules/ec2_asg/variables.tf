variable "environment" { type = string }
variable "instance_type" { type = string; default = "t3.micro" }
variable "app_security_group_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "target_group_arn" { type = string }
# variable "iam_instance_profile_name" { type = string; default = "" }
