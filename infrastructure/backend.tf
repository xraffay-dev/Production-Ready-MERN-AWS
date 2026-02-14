terraform {
  backend "s3" {
    bucket       = "mern-on-aws-backend"
    key          = "terraform.tfstate"
    region       = "ap-south-1"
    use_lockfile = true
  }
}
