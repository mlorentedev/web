# Changelog

## [1.9.0](https://github.com/mlorentedev/web/compare/v1.8.0...v1.9.0) (2026-07-09)


### Features

* ES landing parity via shared section components (WEB-012) ([#75](https://github.com/mlorentedev/web/issues/75)) ([c73d950](https://github.com/mlorentedev/web/commit/c73d9506fe21404631cd6c9561503eba1613627e))

## [1.8.0](https://github.com/mlorentedev/web/compare/v1.7.0...v1.8.0) (2026-07-09)


### Features

* experience timeline on the landing (WEB-012) ([#74](https://github.com/mlorentedev/web/issues/74)) ([e5b9299](https://github.com/mlorentedev/web/commit/e5b9299d587a9856685b42ced24c5ffce102e14c))
* quantified-credibility band on the landing (WEB-012) ([#72](https://github.com/mlorentedev/web/issues/72)) ([78a6044](https://github.com/mlorentedev/web/commit/78a6044c7a878c3b474f02e9b14ec7c888d2a6bd))

## [1.7.0](https://github.com/mlorentedev/web/compare/v1.6.0...v1.7.0) (2026-07-09)


### Features

* rich project cards with metric + bilingual data (WEB-026) ([#69](https://github.com/mlorentedev/web/issues/69)) ([fb7be6d](https://github.com/mlorentedev/web/commit/fb7be6d43e01c1bc3c783956fe64c0b37e2d3adc))

## [1.6.0](https://github.com/mlorentedev/web/compare/v1.5.0...v1.6.0) (2026-06-28)


### Features

* add build-time feature-flag infrastructure (WEB-027) ([#63](https://github.com/mlorentedev/web/issues/63)) ([be6d4f6](https://github.com/mlorentedev/web/commit/be6d4f637a940086e1304b879083d27a8da1d7a5))


### Bug Fixes

* replace dead Calendly contact CTA with a mailto link ([#65](https://github.com/mlorentedev/web/issues/65)) ([e523783](https://github.com/mlorentedev/web/commit/e52378376addab02afa66ca8dd7481fc85ee5e6b)), closes [#43](https://github.com/mlorentedev/web/issues/43)

## [1.5.0](https://github.com/mlorentedev/web/compare/v1.4.0...v1.5.0) (2026-06-28)


### Features

* reposition hero and design pass on the landing (WEB-011) ([#61](https://github.com/mlorentedev/web/issues/61)) ([ae17d2c](https://github.com/mlorentedev/web/commit/ae17d2c8e7a71c434d5648567ae9cf1d4a60fa0a))

## [1.4.0](https://github.com/mlorentedev/web/compare/v1.3.0...v1.4.0) (2026-06-26)


### Features

* GDPR cookie-consent banner gating GA4 (WEB-024) ([#57](https://github.com/mlorentedev/web/issues/57)) ([0b48208](https://github.com/mlorentedev/web/commit/0b48208f914a44ecb5de976ffc2a219f7f405391))

## [1.3.0](https://github.com/mlorentedev/web/compare/v1.2.0...v1.3.0) (2026-06-26)


### Features

* same-origin /api and own brand build-config (ADR-054) ([#53](https://github.com/mlorentedev/web/issues/53)) ([17923f5](https://github.com/mlorentedev/web/commit/17923f5069a3a4051f89675f174ef90262aff548))

## [1.2.0](https://github.com/mlorentedev/web/compare/v1.1.2...v1.2.0) (2026-06-26)


### Miscellaneous Chores

* cut the first standalone semver release ([#21](https://github.com/mlorentedev/web/issues/21)) ([accca6a](https://github.com/mlorentedev/web/commit/accca6ab3f75829e11ba4a2fb1f62a6e1d08d830))

## [1.1.2](https://github.com/mlorentedev/kubelab/compare/web-v1.1.1...web-v1.1.2) (2026-06-18)


### Miscellaneous

* **web:** retire dead astro-site + platform-vs-consumer boundary (ADR-048) ([#698](https://github.com/mlorentedev/kubelab/issues/698)) ([6ae3fe4](https://github.com/mlorentedev/kubelab/commit/6ae3fe4447116d852757db1c538d1bee1fe818bb))

## [1.1.1](https://github.com/mlorentedev/kubelab/compare/web-v1.1.0...web-v1.1.1) (2026-06-15)


### Bug Fixes

* **deps:** override fast-uri to ^3.1.2 (security GHSA-v39h-62p7-jpjc), stay on Astro 5 ([#617](https://github.com/mlorentedev/kubelab/issues/617)) ([a33f049](https://github.com/mlorentedev/kubelab/commit/a33f0497dd11e742e849d07cd9ab93bd5a9f3c8d))

## [1.1.0](https://github.com/mlorentedev/kubelab/compare/web-v1.0.1...web-v1.1.0) (2026-06-14)


### Features

* **web:** reposition mlorente.dev hero to "Platform engineering for AI workloads" ([#613](https://github.com/mlorentedev/kubelab/issues/613)) ([624638b](https://github.com/mlorentedev/kubelab/commit/624638bc816518dd95cda75345b69c12de79d80c))

## [1.0.1](https://github.com/mlorentedev/kubelab/compare/web-v1.0.0...web-v1.0.1) (2026-03-27)


### Bug Fixes

* **infra:** separate generated K8s overlays + fix web nginx PID (NET-002) ([#136](https://github.com/mlorentedev/kubelab/issues/136)) ([512abc3](https://github.com/mlorentedev/kubelab/commit/512abc3f0aa171fad45fefb457cef45a3c884448))

## 1.0.0 (2026-03-16)


### Features

* **infra:** ADR-020 Phase 3, errors service, SSOT audit, trunk-based CI, release-please ([a55de2c](https://github.com/mlorentedev/kubelab/commit/a55de2c3ee2c01d75f94aa54d2e1056d088c3966))
* **infra:** Helm H1 — umbrella chart, unified deploy, CI hardening ([#93](https://github.com/mlorentedev/kubelab/issues/93)) ([8f5199d](https://github.com/mlorentedev/kubelab/commit/8f5199d9831f329b4ef8264b35a47812713e72b2))
* **infra:** Helm H1, CI release-please, test cleanup ([#94](https://github.com/mlorentedev/kubelab/issues/94)) ([8ae43d0](https://github.com/mlorentedev/kubelab/commit/8ae43d0bc44aed18ab68c7513008d3eeb95160a5))

## Changelog
