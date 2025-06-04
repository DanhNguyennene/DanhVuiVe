output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

output "cluster_name" {
  value = google_container_cluster.primary.name
}

output "node_pool_names" {
  value = google_container_cluster.primary.node_pool[*].name
}