resource "google_container_node_pool" "default-pool" {
  name       = "default-pool"
  location   = "us-central1-c"
  cluster    = google_container_cluster.primary.name

  node_count = 2

  node_config {
    machine_type = "e2-medium"
    disk_size_gb = 40
    disk_type    = "pd-balanced"
    image_type   = "COS_CONTAINERD"

    metadata = {
      "disable-legacy-endpoints" = "true"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only", 
      "https://www.googleapis.com/auth/logging.write", 
      "https://www.googleapis.com/auth/monitoring", 
      "https://www.googleapis.com/auth/service.management.readonly", 
      "https://www.googleapis.com/auth/servicecontrol", 
      "https://www.googleapis.com/auth/trace.append", 
    ]

    service_account = "default"

    shielded_instance_config {
      enable_integrity_monitoring = true
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  network_config {
    pod_ipv4_cidr_block = "10.76.0.0/14"
    pod_range           = "gke-danhvuive-pods-8c444cf9"
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
    strategy        = "SURGE"
  }
}