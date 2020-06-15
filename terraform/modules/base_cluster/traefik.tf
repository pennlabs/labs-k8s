resource "helm_release" "traefik" {
  name       = "traefik"
  repository = "https://kubernetes-charts.storage.googleapis.com"
  chart      = "traefik"
  version    = "1.86.2"
  namespace  = "kube-system"

  values = var.traefik_values
}
