output "public_subnet_id" {
  description = "The ID of the public subnet (AZ-a)"
  value       = aws_subnet.public.id
}

output "public_subnet_cidr" {
  description = "The CIDR block of the public subnet (AZ-a)"
  value       = aws_subnet.public.cidr_block
}

output "public_subnet_id_b" {
  description = "The ID of the second public subnet (AZ-b)"
  value       = aws_subnet.public_b.id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.internet_gateway.id
}

output "public_route_table_id" {
  description = "The ID of the public route table"
  value       = aws_route_table.public.id
}

