/**
 * What Manu does, one item per line, each with the place it can be checked
 * (WEB-158). Drawn from the `resume` project's `cv.yml` and confirmed by Manu
 * on 2026-10-17; rendered on the home by `components/HomeSkills.astro`.
 *
 * Each item has one `href`: a site path (`/lab/`, localised at render time), an
 * anchor on the home (`#story`), or a public artifact. The link text names the
 * artifact, so a reader knows before clicking whether the proof is a runbook or
 * a 2017 thesis. A figure must already be in `data/experience.ts`, and a proof
 * must be public (`tests/skills.test.mjs`).
 */

import type { Lang } from '../i18n/ui';

/** One item in one language: the skill, and what its link opens. */
export interface SkillCopy {
  label: string;
  proof: string;
}

export interface Skill {
  href: string;
  en: SkillCopy;
  es: SkillCopy;
}

const kubelab = 'https://github.com/mlorentedev/kubelab/blob/master/docs';

export const skills: Skill[] = [
  {
    href: '/lab/',
    en: { label: 'Kubernetes and GitOps platforms (K3s, Argo CD, Helm)', proof: 'the Lab' },
    es: { label: 'Plataformas Kubernetes y GitOps (K3s, Argo CD, Helm)', proof: 'el Lab' },
  },
  {
    href: `${kubelab}/adr/adr-069-terraform-remote-state-on-r2.md`,
    en: { label: 'Infrastructure as code (Terraform, Ansible)', proof: 'ADR' },
    es: { label: 'Infraestructura como código (Terraform, Ansible)', proof: 'ADR' },
  },
  {
    href: `${kubelab}/adr/adr-056-build-once-monorepo-apps.md`,
    en: { label: 'CI/CD that ships exactly the build it tested', proof: 'ADR' },
    es: { label: 'CI/CD que lleva a producción exactamente lo que probó', proof: 'ADR' },
  },
  {
    href: `${kubelab}/runbooks/acme-alerting.md`,
    en: { label: 'Observability, with alerts proven by causing the failure (Grafana, Loki)', proof: 'runbook' },
    es: { label: 'Observabilidad, con alertas probadas provocando el fallo (Grafana, Loki)', proof: 'runbook' },
  },
  {
    href: `${kubelab}/runbooks/offsite-backup-restore.md`,
    en: { label: 'Backups with restore drills, secrets encrypted with SOPS', proof: 'runbook' },
    es: { label: 'Backups con simulacros de restauración, secretos cifrados con SOPS', proof: 'runbook' },
  },
  {
    href: '#story',
    en: { label: 'AWS in production, with the infrastructure bill cut by 80%', proof: 'in the story' },
    es: { label: 'AWS en producción, con la factura de infraestructura un 80% más baja', proof: 'en la historia' },
  },
  {
    href: '/ai/',
    en: { label: 'A harness for AI agents: written rules, cross-model review, gated merges', proof: 'how it works' },
    es: { label: 'Un harness para agentes de IA: reglas escritas, review entre modelos, merges con puerta', proof: 'cómo funciona' },
  },
  {
    href: 'https://pypi.org/project/hive-vault/',
    en: { label: 'Open-source MCP servers', proof: 'PyPI' },
    es: { label: 'Servidores MCP de código abierto', proof: 'PyPI' },
  },
  {
    href: 'https://github.com/mlorentedev/pollex/blob/master/docs/benchmarks/jetson-nano-baseline.md',
    en: { label: 'Self-hosted LLM inference on edge hardware (llama.cpp, Jetson)', proof: 'benchmark' },
    es: { label: 'Inferencia LLM self-hosted en hardware edge (llama.cpp, Jetson)', proof: 'benchmark' },
  },
  {
    href: 'https://github.com/mlorentedev/vicon-fpga-face-detection',
    en: { label: 'Embedded firmware: C, FPGA and VHDL, FreeRTOS', proof: 'MSc thesis, FPGA' },
    es: { label: 'Firmware embebido: C, FPGA y VHDL, FreeRTOS', proof: 'TFM, FPGA' },
  },
  {
    href: 'https://github.com/mlorentedev/emva1288-sensor-characterization',
    en: { label: 'Camera and sensor integration, SDKs, EMVA 1288, test automation', proof: 'BSc thesis, EMVA 1288' },
    es: { label: 'Integración de cámaras y sensores, SDKs, EMVA 1288, automatización de test', proof: 'TFG, EMVA 1288' },
  },
];

/** The items flattened to one language, in order. */
export function skillsFor(lang: Lang): (SkillCopy & { href: string })[] {
  return skills.map(({ href, ...copy }) => ({ href, ...copy[lang] }));
}
