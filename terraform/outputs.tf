output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = module.alb.alb_dns_name
}

output "db_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.rds.db_endpoint
}
