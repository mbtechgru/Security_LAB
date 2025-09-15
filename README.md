# AWS Pentest Lab (Terraform)

This Terraform project deploys an isolated pentesting lab that mirrors the CloudFormation version:
- VPC with attacker (public), victim (private), and services (private) subnets
- Kali (t2.micro) with public IP
- Metasploitable 2 (t2.micro) private
- Windows Server (t2.micro) auto-promoted to AD DS (domain default `lab.local`)
- OWASP Juice Shop on AL2023 (Docker) in services subnet (port 3000) reachable from Kali only
- Public read/write S3 bucket (FOR LAB ONLY)
- Intentionally over-permissive IAM role for cloud-esc practice

## Usage
1. Fill `terraform.tfvars` (see `terraform.tfvars.example`).
2. `terraform init`
3. `terraform apply`
4. On success, note the outputs (Kali public IP, bucket name, etc.).
5. Destroy with `terraform destroy` when done.

> ⚠️ **Safety**: Use in your own AWS account only. The environment is intentionally insecure.
