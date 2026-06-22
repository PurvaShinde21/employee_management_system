module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

module "security_groups" {
  source      = "./modules/security_groups"
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

module "rds" {
  source               = "./modules/rds"
  environment          = var.environment
  subnet_ids           = module.vpc.private_db_subnets
  db_security_group_id = module.security_groups.db_sg_id
  db_username          = var.db_username
  db_password          = var.db_password
  multi_az             = false # Set false to save free tier credits
}

module "alb" {
  source                = "./modules/alb"
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnets
  alb_security_group_id = module.security_groups.alb_sg_id
}

module "ec2_asg" {
  source                = "./modules/ec2_asg"
  environment           = var.environment
  private_subnet_ids    = module.vpc.private_app_subnets
  app_security_group_id = module.security_groups.app_sg_id
  target_group_arns     = [module.alb.frontend_target_group_arn, module.alb.backend_target_group_arn]
}
