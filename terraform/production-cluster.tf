resource "helm_release" "team-sync" {
  name       = "team-sync"
  repository = "https://helm.pennlabs.org"
  chart      = "icarus"
  version    = "0.1.23"

  values = [
    templatefile("helm/team-sync.yaml", {
      roleARN = module.iam-products["team-sync"].role-arn
    })
  ]
}

resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://charts.helm.sh/stable"
  chart      = "grafana"
  version    = "5.1.4"

  values = [file("helm/grafana.yaml")]
}

resource "helm_release" "bitwarden" {
  name       = "bitwarden"
  repository = "https://helm.pennlabs.org"
  chart      = "icarus"
  version    = "0.1.20"

  values = [file("helm/bitwarden.yaml")]
}

module "production-cluster" {
  source         = "./modules/base_cluster"
  traefik_values = [templatefile("helm/traefik.yaml", { count = local.k8s_cluster_size })]
  vault_secret_sync_values = [templatefile("helm/vault-secret-sync.yaml", {
    role_arn = module.iam-secret-sync.role-arn
  })]
  prometheus_values = [file("helm/prometheus.yaml")]
  cert_manager_values = [templatefile("helm/cert-manager.yaml", {
    roleARN = module.iam-cert-manager.role-arn
  })]
  datadog_values = [file("helm/datadog.yaml")]
  argo-cd_values = [file("helm/argo-cd.yaml")]
}


resource "helm_release" "db-backup" {
  name       = "db-backup"
  repository = "https://helm.pennlabs.org"
  chart      = "icarus"
  version    = "0.1.23"

  values = [
    templatefile("helm/db-backup.yaml", {
      roleARN = module.iam-products["db-backup"].role-arn
    })
  ]
}
