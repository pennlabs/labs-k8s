// Traefik values
variable "traefik_values" {
  description = "Values to provide to the Traefik helm chart"
  type        = list(string)
}

// Vault Secret Sync values
variable "vault_secret_sync_values" {
  description = "Values to provide to the Vault Secret Sync helm chart"
  type        = list(string)
}

// Prometheus values
variable "prometheus_values" {
  description = "Values to provide to the Prometheus helm chart"
  type        = list(string)
}

// Cert Manager values
variable "cert_manager_values" {
  description = "Values to provide to the Cert Manager helm chart"
  type        = list(string)
}

// Datadog values
variable "datadog_values" {
  description = "Values to provide to the Datadog helm chart"
  type        = list(string)
}

// Argo-cd values
variable "argo-cd_values" {
  description = "Values to provide to the Argo-cd helm chart"
  type        = list(string)
}
