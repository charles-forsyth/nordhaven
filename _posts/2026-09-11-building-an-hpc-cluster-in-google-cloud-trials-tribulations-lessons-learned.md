---
title: "Building an HPC Cluster in Google Cloud: The Trials, Tribulations, and Hard-Won Lessons"
date: 2026-09-11
layout: post
categories:
  - High Performance Computing
  - Cloud Architecture
  - Research Computing
tags:
  - Google Cloud
  - Slurm
  - HPC
  - FinOps
  - GPU Infrastructure
  - Cluster Toolkit
---

## From On-Prem Monoliths to Elastic Cloud Supercomputing

When researchers think of High-Performance Computing (HPC), they typically picture an on-premise datacenter: row upon row of liquid-cooled racks humming at 100% capacity, fixed queue wait times, and amortized hardware depreciating over five years.

At the **University of California, Riverside (Research Computing)**, our mission is to dramatically shrink the *"Time to Science."* To complement our campus HPCC and regional consortium resources, we set out to build the **Ursa Major HPC Cluster (`ucr-ursa-major-hpc-cluster`)** in Google Cloud using the **Google Cloud Cluster Toolkit (`gcluster`)** and **Slurm v6**.

The goal was ambitious: provide an elastic, on-demand supercomputing environment capable of scaling from zero to hundreds of CPU cores and multi-node NVIDIA L4 GPU arrays, running heavy production workloads across Computational Fluid Dynamics (OpenFOAM), Molecular Dynamics (GROMACS), bioinformatics genomics pipelines, and distributed machine learning training—all while strictly enforcing FinOps governance to prevent runaway cloud costs.

Building it, however, was an odyssey of infrastructure edge cases, cloud capacity realities, and architectural pivots. Here are the trials, tribulations, and hard-won lessons from the trenches.

---

## Tribulation 1: Quota on Paper ≠ Hardware in the Rack

The single most frustrating misconception in cloud engineering is believing that an approved GCP quota means resources are actually available when you request them.

### The `us-west1-b` Stockout Crisis
During our initial deployments, our blueprints targeted `us-west1-b`. We had verified our project quotas, validated our billing accounts, and confirmed IAM permissions. On paper, everything was green.

Yet, when we queued multi-node GPU batches requiring modern **C3** compute instances paired with **NVIDIA L4 GPUs**, the Slurm dynamic node provisioner failed with a cold API error:

```text
ERROR: (gcloud.compute.instances.create) The zone 'projects/ucr-ursa-major-hpc-cluster/zones/us-west1-b'
does not have enough resources available to fulfill the request. ('ZONE_RESOURCE_POOL_EXHAUSTED')
```

Because of regional demand spikes and AI capacity constraints, `us-west1-b` was in a perpetual state of GPU stockout. The cluster was caught in a provisioning loop: Slurm would detect queued jobs, request compute nodes from Compute Engine, hit the resource pool exhaustion wall, mark the nodes as down, and stall the research pipeline.

### The Architectural Pivot: Multi-Region Mobility
This forced our first major lesson: **your Infrastructure as Code (IaC) blueprints must treat regions and zones as transient variables, not permanent fixtures.**

We refactored our deployment templates to decouple regional networking and storage dependencies, executing a rapid, structured migration of the entire cluster deployment to **`us-central1-a`**. By moving our deployment locus, we immediately bypassed the West Coast GPU resource exhaustion and unlocked consistent, immediate provisioning of L4 GPU instances.

---

## Tribulation 2: The Storage Bottleneck & POSIX Fidelity

Scientific workloads are notorious I/O abusers. Unlike modern web applications that gracefully communicate over HTTP APIs or cloud object stores (GCS), HPC scientific codes (like GROMACS, LAMMPS, and BLAST) expect rigid, local POSIX filesystem semantics—millions of small file reads, atomic file locking (`fcntl`/`flock`), and high-throughput scratch space.

### Why Object Storage (GCS) Fails as Scratch
Attempting to use FUSE-mounted object storage (like Cloud Storage FUSE) for active simulation scratch space is a recipe for catastrophic performance degradation. High metadata latency and lack of full POSIX locking will choke molecular dynamics simulations and crash MPI ranks within minutes.

### The Solution: Multi-Tier Google Cloud Filestore NFS
To solve the I/O bottleneck without introducing astronomical costs, we architected a multi-tier **Google Cloud Filestore NFS** blueprint (`ucr-ursa-major-hpc-v1.yaml`):

1. **`/home` (Filestore Basic SSD):** Persistent user home directories, dotfiles, virtual environments, and bash profiles.
2. **`/apps` (Filestore Enterprise / Regional):** Centrally compiled Spack modules, GCC/Clang toolchains, OpenMPI, and scientific application binaries accessible across all nodes.
3. **`/scratch` (High-Throughput Local NVMe / Fast Filestore):** Transient high-IOPS storage designed for active job runs that automatically purges old checkpoints.

Decoupling storage into dedicated Filestore shares ensured that when compute nodes scaled down to zero during idle periods, all compiled software stacks, research data, and configurations remained 100% persistent and ready for instant remounting.

---

## Tribulation 3: Slurm v6 Dynamic Autoscaling & FinOps Containment

In an on-premise datacenter, an idle node simply burns idle electricity. In Google Cloud, a lingering cluster of multi-GPU compute nodes left running over a weekend will vaporize an entire annual research grant.

### Tuning the Elastic Controller
Integrating Slurm v6 with Google Cloud's node manager required meticulous tuning of the suspend and resume scripts:

```yaml
# Slurm Elastic Autoscaling Parameters
SuspendTime: 300          # Aggressively terminate idle nodes after 5 minutes
ResumeTimeout: 600        # Allow up to 10 minutes for GCP VM allocation and boot
SuspendTimeout: 300       # Ensure clean node drainage before instance deletion
```

If `ResumeTimeout` is set too low, Google Cloud's VM provisioning and cloud-init routines may not finish mounting NFS shares before Slurm marks the node as `DOWN*`, causing subsequent jobs to fail. If `SuspendTime` is too generous, idle cloud spend accumulates rapidly. We dialled in a 5-minute idle threshold, backed by automated Cloud Run FinOps budgets that monitor GCP billing Pub/Sub streams in real time.

### Modular Deployment with Cluster Toolkit (`gcluster`)
Rather than deploying a monolithic Terraform template, we split our environment into three isolated, idempotent stages:

```text
ucr-slurm-cl-v11/
├── setup/                 # VPC networks, subnets, firewall rules, IAM roles
├── software_installation/ # Filestore NFS instances, base OS images, Spack/modules
└── cluster/               # Slurm controller, login nodes, compute partitions
```

This modular separation saved countless hours. When we needed to update cluster configuration or adjust Slurm partition limits, we only re-applied the `cluster` stage, leaving the underlying network fabric and multi-terabyte Filestore instances completely untouched.

---

## The Acid Test: Validating the Production Gauntlet

After completing the migration to `us-central1-a` and stabilizing the Filestore NFS infrastructure, we subjected the cluster to an exhaustive, multi-disciplinary validation gauntlet across five distinct Slurm partitions:

* **Job 9 (Distributed AI Training):** A 4-node distributed GPU training run across the `gpul4` partition, validating multi-node NCCL communication and GPU memory bandwidth.
* **Job 18 (Structural Biology):** A massive 5x scale protein folding simulation leveraging dual NVIDIA L4 GPUs running continuously under high thermal and memory load.
* **Jobs 19–22 (The Multi-Discipline Gauntlet):** Submitted simultaneously to stress-test concurrent I/O, MPI inter-process communication, and CPU scheduling:
  * **OpenFOAM:** High-resolution Computational Fluid Dynamics mesh calculations.
  * **GROMACS:** Full molecular dynamics trajectory integration testing POSIX file writes.
  * **Bioinformatics Genomics:** Multi-threaded sequence alignment across terabyte reference genomes.
  * **FEA Structural Mechanics:** Large-scale stiffness matrix inversion and stress analysis.

Every single job executed to completion, wrote its output matrices to `/scratch`, and cleanly drained. Minutes after the queue emptied, the compute nodes terminated automatically, returning our operational burn rate to near-zero.

---

## Top Lessons Learned for Cloud HPC Practitioners

1. **Design for Regional Portability from Day 1:** GPU shortages and datacenter constraints are real. If your deployment blueprint hardcodes a single zone, you are one capacity spike away from total outage. Parameterize your zone/region variables so you can redeploy your compute pool to another region in under 15 minutes.
2. **Never Skimp on POSIX Storage:** Do not try to force scientific codes into object storage. Invest in managed NFS (like Filestore) for `/home` and `/apps`, and use high-performance ephemeral NVMe or dedicated scratch tiers for running simulations.
3. **FinOps is an Architectural Component, Not an Accounting Report:** Build aggressive idle shutdown triggers directly into your Slurm configuration. Couple cluster operations with automated budget monitors and alert webhooks so that resource exhaustion trips a circuit breaker before it triggers an invoice disaster.
4. **Decouple Infrastructure Layers:** Separate networking, shared storage, and compute controllers into distinct Terraform groups using Google Cloud Cluster Toolkit. You should be able to destroy and recreate your compute cluster without risking a single byte of user data or hours of software compilation.

Building supercomputers in the public cloud is not about clicking buttons in a web console—it is about orchestrating infrastructure as code, respecting thermodynamic and financial constraints, and ruthlessly eliminating single points of failure.
