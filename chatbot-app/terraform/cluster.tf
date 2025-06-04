resource "google_container_cluster" "primary" {
  name     = "danhvuive"
  location = "us-central1-c"

  initial_node_count = 2

  node_config {
    machine_type = "e2-medium"
    disk_size_gb = 40
  }
}