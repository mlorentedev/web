import platformData from './platform.json';

export interface ClusterInfo {
  name: string;
  version: string;
  gitops: string;
  uptime: string;
  /** Machines in the fleet, Kubernetes or not. */
  activeNodes: number;
  /** Independent single-node K3s clusters: production, staging, Argo CD hub. */
  kubernetesClusters: number;
  /** Machines that actually run Kubernetes — three of the eight. */
  kubernetesNodes: number;
  /** Workloads across all three clusters, excluding kube-system. */
  totalServices: number;
}

export interface PlatformMetrics {
  inferenceLatency: string;
  contextReduction: string;
  reconciliationTime: string;
  edgeArchitecture: string;
  uptimeScore: string;
  gitopsSyncLoop: string;
}

export interface NodeTopology {
  id: string;
  name: string;
  tier?: 'cloud' | 'homelab';
  role: string;
  roleEs: string;
  summary?: string;
  summaryEs?: string;
  environment: 'Production' | 'Staging' | 'Edge AI' | 'Infrastructure';
  /** What actually schedules work here. Five of the eight run no Kubernetes. */
  runtime: 'k3s' | 'docker' | 'systemd' | 'standby';
  runtimeRole: string;
  provider: string;
  arch: string;
  cpu: string;
  ram: string;
  storage: string;
  os: string;
  location: string;
  status: 'healthy' | 'warning' | 'offline' | 'standby';
}

export interface PlatformService {
  slug: string;
  name: string;
  category: 'AI & Inference' | 'Core Gateway' | 'GitOps & Delivery' | 'Observability' | 'Storage & Data';
  categoryEs: string;
  description: string;
  descriptionEs: string;
  /** Public services only — internal endpoints are not shipped to the client. */
  url?: string;
  healthEndpoint?: string;
  node: string;
  env: 'common' | 'prod' | 'staging' | 'Production' | 'Staging' | 'Both' | 'Edge';
  tech: string[];
  isPublic: boolean;
  status: 'operational' | 'degraded' | 'maintenance';
}

export interface ArchitectureDiagram {
  id: string;
  title: string;
  titleEs: string;
  category: string;
  categoryEs: string;
  description: string;
  descriptionEs: string;
  mermaid: string;
}

export interface PlatformManifest {
  /**
   * When these figures were last reconciled against the real platform, and the
   * commit that recorded them.
   *
   * There is no producer yet (#162) — the manifest is written by hand — so the
   * page cannot claim the numbers are live. What it can do is print how old
   * they are and let the reader judge, which is the difference between a
   * dashboard and a screenshot of one. Both fields are `snake_case` against the
   * rest of this file's `camelCase` because they are the producer's contract,
   * not the page's: #162 emits them, and the spec names them.
   *
   * `generated_at` is an ISO 8601 timestamp; `source_commit` a full git object
   * name. Both are asserted by `tests/lab-data.test.mjs`.
   */
  generated_at: string;
  source_commit: string;
  cluster: ClusterInfo;
  metrics: PlatformMetrics;
  nodes: NodeTopology[];
  services: PlatformService[];
  diagrams: ArchitectureDiagram[];
}

export const platform: PlatformManifest = platformData as PlatformManifest;
