output "public_subnet_id" {
  description = "The ID of the public subnet"
  value = aws_subnet.public.id
}

output "public_subnet_cidr" {
  description = "The CIDR block of the public subnet"
  value = aws_subnet.public.cidr_block
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value = aws_internet_gateway.internet_gateway.id
}

output "public_route_table_id" {
  description = "The ID of the public route table"
  value = aws_route_table.public.id
}
