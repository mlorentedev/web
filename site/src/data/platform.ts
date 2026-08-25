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
  cluster: ClusterInfo;
  metrics: PlatformMetrics;
  nodes: NodeTopology[];
  services: PlatformService[];
  diagrams: ArchitectureDiagram[];
}

export const platform: PlatformManifest = platformData as PlatformManifest;
