variable "region" {
  description = "AWS Region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the lab VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "attacker_subnet_cidr" {
  description = "CIDR for the attacker (public) subnet"
  type        = string
  default     = "10.20.10.0/24"
}

variable "victim_subnet_cidr" {
  description = "CIDR for the victim (private) subnet"
  type        = string
  default     = "10.20.20.0/24"
}

variable "services_subnet_cidr" {
  description = "CIDR for the services (private) subnet"
  type        = string
  default     = "10.20.30.0/24"
}

variable "key_pair_name" {
  description = "Existing EC2 KeyPair name for SSH/RDP"
  type        = string
}

variable "allowed_admin_cidr" {
  description = "Your IP/CIDR allowed to reach the Kali host via SSH (e.g., 203.0.113.0/24)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "domain_name" {
  description = "Active Directory domain name to create on the Windows Server"
  type        = string
  default     = "lab.local"
}

variable "dsrm_password" {
  description = "DSRM (Safe Mode) password used when promoting the domain controller"
  type        = string
  sensitive   = true
}

variable "instance_type_free_tier" {
  description = "Free Tier eligible instance type"
  type        = string
  default     = "t2.micro"
}

variable "kali_ami_id" {
  description = "AMI ID for Kali Linux (AWS Marketplace) in your region (must be subscribed)"
  type        = string
}

variable "metasploitable_ami_id" {
  description = "AMI ID for Metasploitable 2 (or equivalent vulnerable Linux) in your region"
  type        = string
}

variable "windows_ami_id" {
  description = "AMI ID for Windows Server 2019/2022 Base in your region"
  type        = string
}

variable "victim_instance_count" {
  description = "Number of Metasploitable victim instances to provision in the victim subnet (1-10)"
  type        = number
  default     = 1
}
