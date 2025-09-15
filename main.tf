terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

# --------- VPC & Networking ---------
resource "aws_vpc" "lab" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "PentestLab-VPC" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.lab.id
  tags   = { Name = "PentestLab-IGW" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.lab.id
  tags   = { Name = "PentestLab-PublicRT" }
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table" "private_victim" {
  vpc_id = aws_vpc.lab.id
  tags   = { Name = "PentestLab-PrivateRT-Victim" }
}

resource "aws_route_table" "private_services" {
  vpc_id = aws_vpc.lab.id
  tags   = { Name = "PentestLab-PrivateRT-Services" }
}

resource "aws_subnet" "attacker" {
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = var.attacker_subnet_cidr
  map_public_ip_on_launch = true
  tags = { Name = "PentestLab-Subnet-Attacker" }
}

resource "aws_subnet" "victim" {
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = var.victim_subnet_cidr
  map_public_ip_on_launch = false
  tags = { Name = "PentestLab-Subnet-Victim" }
}

resource "aws_subnet" "services" {
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = var.services_subnet_cidr
  map_public_ip_on_launch = false
  tags = { Name = "PentestLab-Subnet-Services" }
}

resource "aws_route_table_association" "assoc_attacker" {
  subnet_id      = aws_subnet.attacker.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "assoc_victim" {
  subnet_id      = aws_subnet.victim.id
  route_table_id = aws_route_table.private_victim.id
}

resource "aws_route_table_association" "assoc_services" {
  subnet_id      = aws_subnet.services.id
  route_table_id = aws_route_table.private_services.id
}

# --------- Security Groups ---------
resource "aws_security_group" "attacker" {
  name        = "PentestLab-SG-Attacker"
  description = "Allow SSH from AllowedAdminCidr; all egress"
  vpc_id      = aws_vpc.lab.id

  ingress {
    description = "SSH from admin CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "PentestLab-SG-Attacker" }
}

resource "aws_security_group" "victim" {
  name        = "PentestLab-SG-Victim"
  description = "Allow all from attacker & services subnets; all egress"
  vpc_id      = aws_vpc.lab.id

  # Allow all from attacker subnet
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.attacker_subnet_cidr]
  }

  # Allow all from services subnet
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.services_subnet_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "PentestLab-SG-Victim" }
}

resource "aws_security_group" "services" {
  name        = "PentestLab-SG-Services"
  description = "Allow Attacker subnet to reach Juice Shop on 3000; all egress"
  vpc_id      = aws_vpc.lab.id

  ingress {
    description = "Juice Shop TCP/3000 from attacker subnet"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.attacker_subnet_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "PentestLab-SG-Services" }
}

# --------- IAM (over-permissive for lab) ---------
resource "aws_iam_role" "lab_role" {
  name = "PentestLab-OverPermissive-Role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action   = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "over_permissive" {
  name   = "PentestLab-AdminLike-Policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "*"
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach_policy" {
  role       = aws_iam_role.lab_role.name
  policy_arn = aws_iam_policy.over_permissive.arn
}

resource "aws_iam_instance_profile" "lab_profile" {
  name = "PentestLab-InstanceProfile"
  role = aws_iam_role.lab_role.name
}

# --------- S3 (deliberately public) ---------
resource "aws_s3_bucket" "vuln" {
  bucket        = "pentest-lab-vuln-${data.aws_caller_identity.current.account_id}-${var.region}"
  force_destroy = true
  tags          = { Name = "PentestLab-VulnBucket" }
}

resource "aws_s3_bucket_public_access_block" "vuln" {
  bucket                  = aws_s3_bucket.vuln.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "vuln" {
  bucket = aws_s3_bucket.vuln.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid      = "PublicReadWrite",
      Effect   = "Allow",
      Principal= "*",
      Action   = ["s3:GetObject","s3:PutObject"],
      Resource = "${aws_s3_bucket.vuln.arn}/*"
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.vuln]
}

# --------- AMI lookups ---------
# Juice Shop host uses latest Amazon Linux 2023 x86_64
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# --------- EC2 Instances ---------
resource "aws_instance" "kali" {
  ami                    = var.kali_ami_id
  instance_type          = var.instance_type_free_tier
  key_name               = var.key_pair_name
  iam_instance_profile   = aws_iam_instance_profile.lab_profile.name
  subnet_id              = aws_subnet.attacker.id
  vpc_security_group_ids = [aws_security_group.attacker.id]
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -eux
    if command -v apt >/dev/null 2>&1; then
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -y || true
      apt-get install -y nmap gobuster awscli jq docker.io || true
      systemctl enable docker || true
      systemctl start docker || true
    fi
    echo "Vuln bucket: ${aws_s3_bucket.vuln.bucket}" > /root/lab-info.txt
  EOF

  tags = { Name = "PentestLab-Kali" }
}

resource "aws_instance" "metasploitable" {
  ami                    = var.metasploitable_ami_id
  instance_type          = var.instance_type_free_tier
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.victim.id
  vpc_security_group_ids = [aws_security_group.victim.id]
  associate_public_ip_address = false
  tags = { Name = "PentestLab-Metasploitable" }
}

resource "aws_instance" "windows_dc" {
  ami                    = var.windows_ami_id
  instance_type          = var.instance_type_free_tier
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.victim.id
  vpc_security_group_ids = [aws_security_group.victim.id]
  associate_public_ip_address = false

  user_data = <<-EOF
    <powershell>
    Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
    $sec = ConvertTo-SecureString "${var.dsrm_password}" -AsPlainText -Force
    Install-ADDSForest -DomainName "${var.domain_name}" -SafeModeAdministratorPassword $sec -Force -NoRebootOnCompletion:$false
    </powershell>
  EOF

  tags = { Name = "PentestLab-Windows-DC" }
}

resource "aws_instance" "juice_shop" {
  ami                    = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.instance_type_free_tier
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.services.id
  vpc_security_group_ids = [aws_security_group.services.id]
  iam_instance_profile   = aws_iam_instance_profile.lab_profile.name
  associate_public_ip_address = false

  user_data = <<-EOF
    #!/bin/bash
    set -eux
    dnf -y update || true
    dnf -y install docker || true
    systemctl enable docker
    systemctl start docker
    docker pull bkimminich/juice-shop
    docker run -d --restart always -p 3000:3000 --name juice bkimminich/juice-shop
    echo "Juice Shop on port 3000 (private). Access from Kali in ${var.attacker_subnet_cidr}." > /etc/motd
  EOF

  tags = { Name = "PentestLab-JuiceShop" }
}

# --------- Outputs ---------
output "vpc_id" {
  value       = aws_vpc.lab.id
  description = "VPC ID"
}

output "kali_public_ip" {
  value       = aws_instance.kali.public_ip
  description = "Public IPv4 of the Kali attacker host"
}

output "kali_ssh" {
  value       = "ssh -i <your-key>.pem ec2-user@${aws_instance.kali.public_dns}"
  description = "Example SSH command"
}

output "victim_subnet_id" {
  value       = aws_subnet.victim.id
  description = "Subnet ID for victim hosts"
}

output "services_subnet_id" {
  value       = aws_subnet.services.id
  description = "Subnet ID for services hosts"
}

output "vuln_bucket_name" {
  value       = aws_s3_bucket.vuln.bucket
  description = "Publicly readable/writable bucket (FOR LAB ONLY)"
}
