resource "google_container_cluster" "primary" {
  name               = "danhvuive"
  location           = "us-central1-c"
  initial_node_count = 0
  project            = var.project_id

  networking_mode = "VPC_NATIVE"

  network    = "projects/testing-api-1712477161338/global/networks/default"
  subnetwork = "projects/testing-api-1712477161338/regions/us-central1/subnetworks/default"

  deletion_protection = true
  enable_shielded_nodes = true

  ip_allocation_policy {
    cluster_ipv4_cidr_block       = "10.76.0.0/14"
    services_ipv4_cidr_block      = "34.118.224.0/20"
    cluster_secondary_range_name  = "gke-danhvuive-pods-8c444cf9"
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  logging_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "WORKLOADS",
    ]
  }

  monitoring_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "STORAGE",
      "POD",
      "DEPLOYMENT",
      "STATEFULSET",
      "DAEMONSET",
      "HPA",
      "JOBSET",
      "CADVISOR",
      "KUBELET",
      "DCGM",
    ]
    managed_prometheus {
      enabled = true
    }
  }

  addons_config {
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
  }

  release_channel {
    channel = "REGULAR"
  }
}