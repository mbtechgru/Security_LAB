output "notes" {
  value = "Kali has public Internet; Victim/Services are private. Reach Windows DC and Metasploitable from Kali. Juice Shop listens on port 3000 in Services subnet. Instance profile is intentionally over-permissive."
}

output "deployment_instructions" {
  value = "Run: terraform init && terraform apply. Destroy with: terraform destroy"
}
