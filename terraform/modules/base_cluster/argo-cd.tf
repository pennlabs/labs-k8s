resource "kubernetes_namespace" "argo-cd" {
  metadata {
    name = "argo-cd"
  }
}

resource "helm_release" "argo-cd" {
  name       = "argo-cd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "4.3.0"
  namespace  = kubernetes_namespace.argo-cd.metadata[0].name
  values     = var.argo-cd_values
}
