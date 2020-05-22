resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://kubernetes-charts.storage.googleapis.com"
  chart      = "prometheus"
  version    = "11.2.3"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = var.prometheus_values
}

resource "helm_release" "fluentd" {
  name       = "fluentd"
  repository = "https://kiwigrid.github.io"
  chart      = "fluentd-elasticsearch"
  version    = "9.1.1"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = var.fluentd_values
}