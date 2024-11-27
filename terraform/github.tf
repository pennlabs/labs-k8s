resource "github_actions_organization_secret" "aws_account_id" {
  secret_name     = "AWS_ACCOUNT_ID"
  visibility      = "all"
  plaintext_value = data.aws_caller_identity.current.account_id
}

resource "github_actions_organization_secret" "aws_access_key" {
  secret_name     = "GH_AWS_ACCESS_KEY_ID"
  visibility      = "all"
  plaintext_value = aws_iam_access_key.gh-actions.id
}

resource "github_actions_organization_secret" "aws_secret_key" {
  secret_name     = "GH_AWS_SECRET_ACCESS_KEY"
  visibility      = "all"
  plaintext_value = aws_iam_access_key.gh-actions.secret
}

// Set github action secrets for private repositories (bc no access to org secrets)
data "github_repositories" "private_repos" {
  query = "org:pennlabs is:private"
}

resource "github_actions_secret" "private_repos_aws_account_id" {
  for_each        = toset(data.github_repositories.private_repos.names)
  repository      = each.key
  secret_name     = "AWS_ACCOUNT_ID"
  plaintext_value = data.aws_caller_identity.current.account_id
}

resource "github_actions_secret" "private_repos_aws_access_key" {
  for_each        = toset(data.github_repositories.private_repos.names)
  repository      = each.key
  secret_name     = "GH_AWS_ACCESS_KEY_ID"
  plaintext_value = aws_iam_access_key.gh-actions.id
}

resource "github_actions_secret" "private_repos_aws_secret_key" {
  for_each        = toset(data.github_repositories.private_repos.names)
  repository      = each.key
  secret_name     = "GH_AWS_SECRET_ACCESS_KEY"
  plaintext_value = aws_iam_access_key.gh-actions.secret
}

// Ensure a kube-manifests repository exists for Argo deployments
resource "github_repository" "kube_manifests_repository" {
  name        = "kube-manifests"
  description = "Kubernetes manifests for our cluster"
}
