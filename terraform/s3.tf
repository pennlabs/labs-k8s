module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "pennlabs-lambda-deployment"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"
}
