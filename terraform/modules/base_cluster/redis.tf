resource "kubernetes_config_map" "redis_config_map" {
  metadata {
    name = "redis-config"
  }

  data = {
    "redis-config" = <<-EOF
    save 3600 30
    dir /redis-master-data/
    dbfilename dump.rdb
    protected-mode no
    EOF
  }
}
