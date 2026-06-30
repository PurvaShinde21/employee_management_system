variable "environment" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "app_security_group_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "target_group_arns" {
  type = list(string)
}

variable "db_host" {
  type        = string
  description = "RDS database endpoint"
}

variable "db_user" {
  type        = string
  description = "RDS database username"
}

variable "db_pass" {
  type        = string
  sensitive   = true
  description = "RDS database password"
}

variable "db_name" {
  type        = string
  default     = "employees"
  description = "RDS database name"
}
