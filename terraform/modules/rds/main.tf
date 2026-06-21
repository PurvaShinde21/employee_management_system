resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = { Name = "${var.environment}-db-subnet-group" }
}

resource "aws_db_instance" "main" {
  identifier             = "${var.environment}-employee-db"
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = "employees"
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  skip_final_snapshot    = true
  multi_az               = var.multi_az
  vpc_security_group_ids = [var.db_security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = { Name = "${var.environment}-employee-db" }
}
