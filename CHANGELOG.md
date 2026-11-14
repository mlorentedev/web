# Changelog

## 1.17.0 (2026-11-14)

## What's Changed
* chore(deps-dev): bump dompurify from 3.4.16 to 3.4.17 in /site by @dependabot[bot] in https://github.com/mlorentedev/web/pull/495
* chore(deps): bump the actions group with 4 updates by @dependabot[bot] in https://github.com/mlorentedev/web/pull/494
* chore(deps): bump fast-uri from 3.1.8 to 3.1.9 in /site by @dependabot[bot] in https://github.com/mlorentedev/web/pull/496
* chore(deps): bump the npm group across 1 directory with 4 updates by @dependabot[bot] in https://github.com/mlorentedev/web/pull/493
* fix(a11y): give every page one leading h1 and an unbroken heading outline by @mlorentedev in https://github.com/mlorentedev/web/pull/497
* fix(a11y): draw one visible focus indicator on every keyboard stop by @mlorentedev in https://github.com/mlorentedev/web/pull/500
* fix(i18n): serve a Spanish 404 from markup instead of swapping strings in the browser by @mlorentedev in https://github.com/mlorentedev/web/pull/502
* fix(footer): link the privacy policy and the feed from every page by @mlorentedev in https://github.com/mlorentedev/web/pull/503
* fix(header): lay out the avatar instead of floating it over the nav by @mlorentedev in https://github.com/mlorentedev/web/pull/504
* fix(ci): resolve the latest Node 22 instead of the runner's cached one by @mlorentedev in https://github.com/mlorentedev/web/pull/508
* fix(subscribe): restore the button label after a failed submit by @mlorentedev in https://github.com/mlorentedev/web/pull/506
* fix(seo): give every page one URL, with its links, nginx and the sitemap agreeing by @mlorentedev in https://github.com/mlorentedev/web/pull/505
* test(visual-diff): stop animations before reading computed styles by @mlorentedev in https://github.com/mlorentedev/web/pull/511
* fix(subscribe): keep the address out of the URL when the script has not run by @mlorentedev in https://github.com/mlorentedev/web/pull/512
* chore(deps): make the audit and the version in package.json mean what they say by @mlorentedev in https://github.com/mlorentedev/web/pull/513
* fix(a11y): announce the current page in the header nav by @mlorentedev in https://github.com/mlorentedev/web/pull/514
* feat(contact): one way in, and a fixed-price session after a yes by @mlorentedev in https://github.com/mlorentedev/web/pull/510
* fix(diagrams): pin archify to v2.16.0 by @mlorentedev in https://github.com/mlorentedev/web/pull/515
* feat(contact): drop the paid session and keep one way to write by @mlorentedev in https://github.com/mlorentedev/web/pull/518
* feat(home): rewrite the home around the career timeline and skill layers by @mlorentedev in https://github.com/mlorentedev/web/pull/509
* perf(fonts): subset the Roboto faces from a script by @mlorentedev in https://github.com/mlorentedev/web/pull/519
* fix(fonts): declare the weights in use and preload the headline's face by @mlorentedev in https://github.com/mlorentedev/web/pull/520
* test(diagrams): report a missing install command as a failure by @mlorentedev in https://github.com/mlorentedev/web/pull/521
* test(a11y): cover the AI link in the current-page test by @mlorentedev in https://github.com/mlorentedev/web/pull/522
* feat(home): name the employer in the timeline and leave the current role open by @mlorentedev in https://github.com/mlorentedev/web/pull/523
* fix(llms): describe the site as it is and drop the paid session by @mlorentedev in https://github.com/mlorentedev/web/pull/524
* fix(projects): drop the unpublished Hive figure and point pdf-modifier at live pages by @mlorentedev in https://github.com/mlorentedev/web/pull/525
* fix(notes): show the English notes on the Spanish home and keep the empty /es/notes out of search by @mlorentedev in https://github.com/mlorentedev/web/pull/526
* perf(nginx): compress HTML and text assets by @mlorentedev in https://github.com/mlorentedev/web/pull/527
* chore(es): remove the course and newsletter pages and redirect them to the Spanish home by @mlorentedev in https://github.com/mlorentedev/web/pull/528
* feat(home): draw the timeline as a line and state the current role by @mlorentedev in https://github.com/mlorentedev/web/pull/530
* fix(contact): drop the address repeated under the button by @mlorentedev in https://github.com/mlorentedev/web/pull/531
* feat(home): draw the career on the DevOps loop under the hero by @mlorentedev in https://github.com/mlorentedev/web/pull/537
* feat(home): label each skills layer with a path-style key by @mlorentedev in https://github.com/mlorentedev/web/pull/538
* feat(home): mark the ongoing role with a HEAD ref by @mlorentedev in https://github.com/mlorentedev/web/pull/539
* fix(home): name the hardware layer embedded systems by @mlorentedev in https://github.com/mlorentedev/web/pull/540
* feat(footer): show the build that served the page as a sync chip by @mlorentedev in https://github.com/mlorentedev/web/pull/541
* fix(footer): ship the build chip's deployed variant within the site's rules by @mlorentedev in https://github.com/mlorentedev/web/pull/542
* feat(home): open on the full-stack path and the way in, then the parallel track by @mlorentedev in https://github.com/mlorentedev/web/pull/543
* chore(deps): bump the npm group in /site with 3 updates by @dependabot[bot] in https://github.com/mlorentedev/web/pull/550
* chore(pre-commit): run each hook once per commit by @mlorentedev in https://github.com/mlorentedev/web/pull/545
* fix(a11y): audit every built page with axe, and fix what it finds by @mlorentedev in https://github.com/mlorentedev/web/pull/544
* docs(adr): map every ADR cited here to the repository it lives in by @mlorentedev in https://github.com/mlorentedev/web/pull/547
* fix(home): keep the phone loop labels at size and name the bio region by @mlorentedev in https://github.com/mlorentedev/web/pull/548
* feat(seo): describe notes, projects and tag pages in JSON-LD by @mlorentedev in https://github.com/mlorentedev/web/pull/552
* chore(docker): send only site/ to the build, drop dead ARGs and pin base images by @mlorentedev in https://github.com/mlorentedev/web/pull/553
* ci: deploy bitácora workflows (OPS-002) by @mlorentedev in https://github.com/mlorentedev/web/pull/562
* chore(deps): bump nginx from 1.27-alpine to 1.31-alpine in the docker group by @dependabot[bot] in https://github.com/mlorentedev/web/pull/563
* fix(privacy): serve the GitHub chart from the site instead of a third party by @mlorentedev in https://github.com/mlorentedev/web/pull/566
* feat(home): tell each skill layer as a short story and fold the GitHub chart into it by @mlorentedev in https://github.com/mlorentedev/web/pull/549
* feat(home): tell each role in the timeline in Manu's words by @mlorentedev in https://github.com/mlorentedev/web/pull/561
* fix(privacy): name only what the site uses, the same in both locales by @mlorentedev in https://github.com/mlorentedev/web/pull/568
* test(a11y): check the contrast of text drawn inside SVGs by @mlorentedev in https://github.com/mlorentedev/web/pull/560
* fix(nginx): send one Cache-Control per response, immutable only on hashed names by @mlorentedev in https://github.com/mlorentedev/web/pull/564
* fix(diagrams): paint type labels with a text shade at AA, not the line shade by @mlorentedev in https://github.com/mlorentedev/web/pull/565
* fix(a11y): bring nav links, language switch and tag chips to 24 px on their own box by @mlorentedev in https://github.com/mlorentedev/web/pull/569
* fix(a11y): set descriptive copy at text-sm, keep text-xs for metadata by @mlorentedev in https://github.com/mlorentedev/web/pull/570
* feat(projects): add the Spanish intro for /es/projects by @mlorentedev in https://github.com/mlorentedev/web/pull/574
* fix(ci): drop the hand-kept lesson count that two green PRs merged wrong by @mlorentedev in https://github.com/mlorentedev/web/pull/575
* feat(nav): put the nav behind a menu below sm, with no client script by @mlorentedev in https://github.com/mlorentedev/web/pull/578
* fix(nav): link /projects from the header in both locales and fail the build on orphan pages by @mlorentedev in https://github.com/mlorentedev/web/pull/579
* test(site): hold every page's HTML to a raw and a gzipped byte budget by @mlorentedev in https://github.com/mlorentedev/web/pull/582
* refactor(i18n): give each page built in both locales one body, in a shared component by @mlorentedev in https://github.com/mlorentedev/web/pull/584
* fix(a11y): set diagram captions at 14 px, and check every text block for 12 px sentences by @mlorentedev in https://github.com/mlorentedev/web/pull/583
* fix(notes): print a note without the site chrome, with legible code by @mlorentedev in https://github.com/mlorentedev/web/pull/596
* test(site): assert the no-client-JS invariant on every page by @mlorentedev in https://github.com/mlorentedev/web/pull/580
* feat(contact): list the work I take on and keep the door mail to a subject by @mlorentedev in https://github.com/mlorentedev/web/pull/598
* ci: deploy bitácora workflows (OPS-002) by @mlorentedev in https://github.com/mlorentedev/web/pull/605
* test(no-js): refuse a data: document only where it loads as one by @mlorentedev in https://github.com/mlorentedev/web/pull/604
* fix(seo): give tag pages their own names, titles and descriptions, and keep thin ones out of the index by @mlorentedev in https://github.com/mlorentedev/web/pull/601
* fix(ui): draw every call-to-action with one Button component by @mlorentedev in https://github.com/mlorentedev/web/pull/600
* fix(a11y): open every link in the same tab by @mlorentedev in https://github.com/mlorentedev/web/pull/599
* perf(fonts): preload Medium and check every preload against the faces the first screen paints by @mlorentedev in https://github.com/mlorentedev/web/pull/581
* feat(notes): ship a note on its date, and let it say when it was written by @mlorentedev in https://github.com/mlorentedev/web/pull/602
* feat(projects): show five projects, Hive first, with year and install line by @mlorentedev in https://github.com/mlorentedev/web/pull/603
* fix(github-chart): tell the empty chart apart from upstream, and fail CI only when upstream was refused by @mlorentedev in https://github.com/mlorentedev/web/pull/608
* fix(lessons): stop check-lessons reporting a listed lesson as missing when grep -q closes the pipe early by @mlorentedev in https://github.com/mlorentedev/web/pull/610
* docs(notes): draft the staging load-test note by @mlorentedev in https://github.com/mlorentedev/web/pull/611
* fix(notes,lab): show the notes title and say which figures the lab footer dates by @mlorentedev in https://github.com/mlorentedev/web/pull/597
* feat(projects): show each card's state, start year and install line by @mlorentedev in https://github.com/mlorentedev/web/pull/614
* fix(nginx): serve gzip precompressed at build, not per request by @mlorentedev in https://github.com/mlorentedev/web/pull/616
* ci(test): give the Test job 20 minutes; the browser's apt fetch alone took 8 by @mlorentedev in https://github.com/mlorentedev/web/pull/617
* feat(notes): declare when each note was last modified, in its meta, its BlogPosting and the sitemap by @mlorentedev in https://github.com/mlorentedev/web/pull/618
* feat(notes): give each note its own social card, in og:image, twitter:image and its BlogPosting by @mlorentedev in https://github.com/mlorentedev/web/pull/612
* feat(notes): show each note's reading time, and a table of contents on long notes by @mlorentedev in https://github.com/mlorentedev/web/pull/621
* fix(ci): run the repo hygiene checks as a job of the PR gate by @mlorentedev in https://github.com/mlorentedev/web/pull/622
* ci(test): cache Chromium by Playwright version and give each install step its own budget by @mlorentedev in https://github.com/mlorentedev/web/pull/619
* fix(ci): scan pull-request image builds with Trivy, and date the non-blocking exception by @mlorentedev in https://github.com/mlorentedev/web/pull/623
* feat(notes): show the series and an archive by year on the notes index by @mlorentedev in https://github.com/mlorentedev/web/pull/624
* feat(lab): link each Lab section to the notes behind it by @mlorentedev in https://github.com/mlorentedev/web/pull/625
* fix(lab): keep the English notes link when a section is only partly translated by @mlorentedev in https://github.com/mlorentedev/web/pull/628
* fix(notes): say "1 note" for a series with one note in the locale by @mlorentedev in https://github.com/mlorentedev/web/pull/627
* feat(ai): quote the review-triage skill as a fifth artifact card by @mlorentedev in https://github.com/mlorentedev/web/pull/626
* fix(docker): pin nginx 1.31-alpine to the digest without the brotli CRITICAL by @mlorentedev in https://github.com/mlorentedev/web/pull/629
* feat(lab): add a curated changelog section, empty until its rows are written by @mlorentedev in https://github.com/mlorentedev/web/pull/631
* feat(lab): show web's platform contract, kubelab.yaml, as the build read it by @mlorentedev in https://github.com/mlorentedev/web/pull/630
* fix(ci): block an image build on a fixable CRITICAL finding by @mlorentedev in https://github.com/mlorentedev/web/pull/632
* fix(ci): run PR-Agent from the fleet's reusable workflow instead of a local port by @mlorentedev in https://github.com/mlorentedev/web/pull/633
* fix(ci): find a diagram on any note, not only the first, and check the search in every PR by @mlorentedev in https://github.com/mlorentedev/web/pull/634
* chore(deps): bump node from `4b150b4` to `5ec23b7` in the docker group by @dependabot[bot] in https://github.com/mlorentedev/web/pull/636
* chore(deps): bump the npm group in /site with 7 updates by @dependabot[bot] in https://github.com/mlorentedev/web/pull/637
* chore(deps): bump the actions group across 1 directory with 2 updates by @dependabot[bot] in https://github.com/mlorentedev/web/pull/639
* chore(deps): bump fast-xml-parser from 5.11.0 to 5.12.0 in /site by @dependabot[bot] in https://github.com/mlorentedev/web/pull/638
* feat(notes): link each note to the notes written alongside it, and fail the build on a dead link by @mlorentedev in https://github.com/mlorentedev/web/pull/640
* feat(ai): draw the dotfiles harness tree as git lists it at a pinned commit by @mlorentedev in https://github.com/mlorentedev/web/pull/641
* refactor(theme): name the palette roles at every call site, and fail on a raw ramp by @mlorentedev in https://github.com/mlorentedev/web/pull/642
* chore(deps): move dependency updates from Dependabot to Renovate by @mlorentedev in https://github.com/mlorentedev/web/pull/643
* feat(ai): publish the Hive token figure in the /ai proof, linked to its method by @mlorentedev in https://github.com/mlorentedev/web/pull/645
* chore(harness): replace retired mimo-v2.5 in the reviewer pool by @mlorentedev in https://github.com/mlorentedev/web/pull/647
* refactor(theme): declare the aliased ramps only under their role names by @mlorentedev in https://github.com/mlorentedev/web/pull/648
* feat(ai): count each merged PR's review findings from its triage comments by @mlorentedev in https://github.com/mlorentedev/web/pull/644
* feat(home): name what each layer built once, as a built/ line under its story by @mlorentedev in https://github.com/mlorentedev/web/pull/649
* feat(ai): show one real task's phases, from plan to merge, each between linked events by @mlorentedev in https://github.com/mlorentedev/web/pull/650
* chore(deps): pin the Renovate preset to v0.6.0 by @mlorentedev in https://github.com/mlorentedev/web/pull/651
* chore(ci): call the shared PR-Agent workflow from ci-workflows by @mlorentedev in https://github.com/mlorentedev/web/pull/652
* fix(review): register PR-Agent's incremental review heading by @mlorentedev in https://github.com/mlorentedev/web/pull/655
* ci(image): keep the build cache on a registry tag instead of the Actions cache by @mlorentedev in https://github.com/mlorentedev/web/pull/654
* chore(review): turn off PR-Agent's ticket-compliance table by @mlorentedev in https://github.com/mlorentedev/web/pull/653
* feat(lab): draw the gateway path behind the access badges by @mlorentedev in https://github.com/mlorentedev/web/pull/657
* fix(deps): override the two build-time packages Dependabot still flags by @mlorentedev in https://github.com/mlorentedev/web/pull/656
* ci: check lessons with the shared hygiene composite by @mlorentedev in https://github.com/mlorentedev/web/pull/661
* ci: meet the fleet CI standard checked by dotf lint fleet by @mlorentedev in https://github.com/mlorentedev/web/pull/660
* ci(pr-agent): move to shared v0.7.0 and share the comment group only for /review by @mlorentedev in https://github.com/mlorentedev/web/pull/663
* ci: flag an issue that takes an identifier another issue already has by @mlorentedev in https://github.com/mlorentedev/web/pull/662
* feat(theme): follow the system dark setting with the palette read backwards by role by @mlorentedev in https://github.com/mlorentedev/web/pull/658
* feat(type): set headings in Archivo and metadata in JetBrains Mono by @mlorentedev in https://github.com/mlorentedev/web/pull/664
* feat(lab): generate the changelog from kubelab's merged feature PRs by @mlorentedev in https://github.com/mlorentedev/web/pull/665
* fix(dark): match the dark theme-color to the page ground by @mlorentedev in https://github.com/mlorentedev/web/pull/666
* fix(release): take the release notes from GitHub so a Refs is not a close by @mlorentedev in https://github.com/mlorentedev/web/pull/667
* feat(lab): show the fleet counts and the monthly spend as stat tiles by @mlorentedev in https://github.com/mlorentedev/web/pull/670
* feat(lab): show the gateway path on the IDP architecture page by @mlorentedev in https://github.com/mlorentedev/web/pull/669
* revert(type): set the whole site in Roboto again by @mlorentedev in https://github.com/mlorentedev/web/pull/668
* fix(lab): list gitea as mesh-only now that its name resolves to the tailnet by @mlorentedev in https://github.com/mlorentedev/web/pull/671
* feat(lab): record what the weekly access check saw for each host by @mlorentedev in https://github.com/mlorentedev/web/pull/673


**Full Changelog**: https://github.com/mlorentedev/web/compare/v1.16.3...v1.17.0

## [1.16.3](https://github.com/mlorentedev/web/compare/v1.16.2...v1.16.3) (2026-10-23)


### Bug Fixes

* **diagrams:** check the ir-sha256 stamp in verify &lt;file&gt; too ([#492](https://github.com/mlorentedev/web/issues/492)) ([fd05ad2](https://github.com/mlorentedev/web/commit/fd05ad2504894832e21aebb7aa2704495fc5766e))
* **i18n:** remove the 184 translation keys nothing reads ([#490](https://github.com/mlorentedev/web/issues/490)) ([15dc22a](https://github.com/mlorentedev/web/commit/15dc22a56261f4911204751a6924d0c8e9a73776))
* **lab:** remove the platform diagrams data no page renders ([#488](https://github.com/mlorentedev/web/issues/488)) ([79b2561](https://github.com/mlorentedev/web/commit/79b2561b162310b2b47d7819a6668a5c7735d0ea))

## [1.16.2](https://github.com/mlorentedev/web/compare/v1.16.1...v1.16.2) (2026-10-22)


### Bug Fixes

* **ci:** fail the release gate when release-please's outputs cannot be read ([#484](https://github.com/mlorentedev/web/issues/484)) ([0c065ec](https://github.com/mlorentedev/web/commit/0c065ec41d598994cc9dfedf7d2906a0cc79964f))
* **docker:** install Chromium's libraries for the lockfile's Playwright ([#486](https://github.com/mlorentedev/web/issues/486)) ([ceaffd5](https://github.com/mlorentedev/web/commit/ceaffd5a885e9baa07cae469620622a8e1efae98))

## [1.16.1](https://github.com/mlorentedev/web/compare/v1.16.0...v1.16.1) (2026-10-21)


### Bug Fixes

* **test:** refuse to run the suite on Node older than 22.18 ([#480](https://github.com/mlorentedev/web/issues/480)) ([ac6ebea](https://github.com/mlorentedev/web/commit/ac6ebea3445f8fc20ea837d5ca5081d6f4160933))
* **version:** state the deployed commit in /version.json ([#477](https://github.com/mlorentedev/web/issues/477)) ([9d79e52](https://github.com/mlorentedev/web/commit/9d79e52aff18e0dfef5a7536b416c70b6183af1f))

## [1.16.0](https://github.com/mlorentedev/web/compare/v1.15.1...v1.16.0) (2026-10-18)


### Features

* **contact:** one door and an offer ladder with a single source for its figures ([#401](https://github.com/mlorentedev/web/issues/401)) ([02e65d7](https://github.com/mlorentedev/web/commit/02e65d7f7626bcbb044a0a261720921e013f1084))
* **copy:** open My path with a short bio, kept as editable markdown ([#396](https://github.com/mlorentedev/web/issues/396)) ([3e10f95](https://github.com/mlorentedev/web/commit/3e10f9502ae7ba8a05a779c07b584ef00145e6ad)), closes [#390](https://github.com/mlorentedev/web/issues/390)
* **copy:** say Engineer from Silicon to Cloud as the one label ([#392](https://github.com/mlorentedev/web/issues/392)) ([86b4faf](https://github.com/mlorentedev/web/commit/86b4faf8ffc2513fe3839e504c692972562fa4e3)), closes [#390](https://github.com/mlorentedev/web/issues/390)
* **home:** drop the five visual sections and make the bio the story block ([#416](https://github.com/mlorentedev/web/issues/416)) ([fa4ee79](https://github.com/mlorentedev/web/commit/fa4ee790ee6ba84c6f2b9c90005e808dc72678f6))
* **home:** list what Manu does, each item with its proof ([#461](https://github.com/mlorentedev/web/issues/461)) ([ca5b8e5](https://github.com/mlorentedev/web/commit/ca5b8e54c1a008c5a8f61f43a8d383b06db7583f))
* **home:** render the contact markdown on the home as its door block ([#419](https://github.com/mlorentedev/web/issues/419)) ([93bd8df](https://github.com/mlorentedev/web/commit/93bd8df536d33d3a95edc3e474ebdd046acad96f))
* **home:** tell the story in prose, with its proofs linked ([#418](https://github.com/mlorentedev/web/issues/418)) ([6a88239](https://github.com/mlorentedev/web/commit/6a88239606764aacd51c36beaa37c0e502d27062))
* **lab,ai:** open /lab and /ai with a dated, verifiable proof ([#469](https://github.com/mlorentedev/web/issues/469)) ([335c3be](https://github.com/mlorentedev/web/commit/335c3be41ed411201b521d742f3699c9c21ae90c))


### Bug Fixes

* **a11y:** keep the visible language code in the switcher's accessible name ([#460](https://github.com/mlorentedev/web/issues/460)) ([dcd8008](https://github.com/mlorentedev/web/commit/dcd8008a32ef6c45025d1d511575057554c3bf54))
* **ai:** quote each artifact card's file verbatim, pinned to a commit ([#411](https://github.com/mlorentedev/web/issues/411)) ([eddf911](https://github.com/mlorentedev/web/commit/eddf9113f715cca180687066422c9bba796ea755))
* **ci:** check the lessons index counter and row order ([#438](https://github.com/mlorentedev/web/issues/438)) ([ea190f5](https://github.com/mlorentedev/web/commit/ea190f5768e7ff3c4c309687b7d7c750e0571724))
* **ci:** move PR-Agent off the retired mimo-v2.5 model ([#444](https://github.com/mlorentedev/web/issues/444)) ([b4b4af7](https://github.com/mlorentedev/web/commit/b4b4af769f9c64b50b0bd1af86fb2ec2f02e4c52))
* **copy:** drop the banned register from the Lab and AI proof pages ([#409](https://github.com/mlorentedev/web/issues/409)) ([5c934e5](https://github.com/mlorentedev/web/commit/5c934e59a98a54353794aaba804b9035e95b736a))
* **copy:** give /lab a section name instead of a label of its own ([#404](https://github.com/mlorentedev/web/issues/404)) ([d110dd8](https://github.com/mlorentedev/web/commit/d110dd8231a2286ce52c33aa84ecaef4b169edb2))
* **copy:** land the bio's review fixes and hardware wording that missed [#396](https://github.com/mlorentedev/web/issues/396) ([#399](https://github.com/mlorentedev/web/issues/399)) ([26ae565](https://github.com/mlorentedev/web/commit/26ae56548b6c9683ce8546a8efc25d28127e701d))
* **diagrams:** name mermaid SVGs by their source, not a random id ([#395](https://github.com/mlorentedev/web/issues/395)) ([b0b09de](https://github.com/mlorentedev/web/commit/b0b09de1eeb5410163d34c15626914a8beab9731))
* **i18n:** the Spanish AI page carries no English text ([#414](https://github.com/mlorentedev/web/issues/414)) ([669cf96](https://github.com/mlorentedev/web/commit/669cf964ed51b814f92b4739606dd6f55d8837d7))
* **i18n:** the Spanish Lab pages carry no English text ([#415](https://github.com/mlorentedev/web/issues/415)) ([e45001f](https://github.com/mlorentedev/web/commit/e45001f1ff66645734de0222e45b03613cb664e2))
* **lab:** accept only a silent on-demand host, and mark Uptime Kuma behind Authelia ([#472](https://github.com/mlorentedev/web/issues/472)) ([5a622f2](https://github.com/mlorentedev/web/commit/5a622f2ad16591abd675bab5b2dbea428fed4606))
* **lab:** derive every machine and cluster count from platform.json ([#423](https://github.com/mlorentedev/web/issues/423)) ([120fc80](https://github.com/mlorentedev/web/commit/120fc80154160a430b4d060740c73b8e41957290))
* **lab:** make the Jetson and Pollex entries match what the node runs ([#466](https://github.com/mlorentedev/web/issues/466)) ([5bd865b](https://github.com/mlorentedev/web/commit/5bd865bdddbd084a349f28f012e70e8d52fe5fff))
* **lab:** point the IDP catalog at final URLs and its measured access ([#431](https://github.com/mlorentedev/web/issues/431)) ([7686d31](https://github.com/mlorentedev/web/commit/7686d318283db7f373e7de4a78ca6146b9b0d13f))
* **lab:** render each service's access from a measured table, re-checked weekly ([#426](https://github.com/mlorentedev/web/issues/426)) ([0c8b19a](https://github.com/mlorentedev/web/commit/0c8b19a03100a018676f7043672a3b742e6144c4))
* **lab:** render every measured figure from data with its method and date ([#425](https://github.com/mlorentedev/web/issues/425)) ([84db21d](https://github.com/mlorentedev/web/commit/84db21d0d407e53073cc4a0e5db3d76946007035))
* **lab:** retire the reachability console so the page ships no script ([#428](https://github.com/mlorentedev/web/issues/428)) ([751eecd](https://github.com/mlorentedev/web/commit/751eecd8e272dbe9cbe90cd32624aee0d4421643))
* **projects:** describe kasa-provisioner by what the repo does ([#464](https://github.com/mlorentedev/web/issues/464)) ([d3e00f4](https://github.com/mlorentedev/web/commit/d3e00f423f43e32566be772cdbe0123d4c6b5fae))
* **projects:** scope Pollex's latency to one user and name its cloud engine ([#471](https://github.com/mlorentedev/web/issues/471)) ([c0ba5db](https://github.com/mlorentedev/web/commit/c0ba5db54581853909ecb8e03c77cf60124d2f8b))
* **projects:** state Pollex's measured median latency instead of 3 s ([#463](https://github.com/mlorentedev/web/issues/463)) ([3cda421](https://github.com/mlorentedev/web/commit/3cda421aceef2b27fef68b94d716f7608661fea5))
* **projects:** the KubeLab card opens the Lab, in the reader's locale and tab ([#437](https://github.com/mlorentedev/web/issues/437)) ([4ed34f6](https://github.com/mlorentedev/web/commit/4ed34f697b6cc4d4bb53fedb462b05b429315451))

## [1.15.1](https://github.com/mlorentedev/web/compare/v1.15.0...v1.15.1) (2026-09-23)


### Bug Fixes

* **content:** tell the Teledyne platform and field work as one chain ([#385](https://github.com/mlorentedev/web/issues/385)) ([f37af0e](https://github.com/mlorentedev/web/commit/f37af0eaa74adec4e740ce570880e481cf11a321))
* **deps:** move to Astro 7 with every [@astrojs](https://github.com/astrojs) integration ([#380](https://github.com/mlorentedev/web/issues/380)) ([aef8f88](https://github.com/mlorentedev/web/commit/aef8f880a01e3b056793cdfd6881c285052aa8e9)), closes [#7](https://github.com/mlorentedev/web/issues/7)

## [1.15.0](https://github.com/mlorentedev/web/compare/v1.14.0...v1.15.0) (2026-09-07)


### Features

* **ai:** relocate autonomous fleet and automations from lab to dedicated ai chapter ([#324](https://github.com/mlorentedev/web/issues/324)) ([fbb9970](https://github.com/mlorentedev/web/commit/fbb99702fab92233f3113bfa6facf78c612ee7f5))
* **ai:** wire fail-closed harness note and refine worktree terminology ([#315](https://github.com/mlorentedev/web/issues/315)) ([0302cc8](https://github.com/mlorentedev/web/commit/0302cc84d5ae4d2675ed1a6391f1de61e9d06032))
* **lab:** add IDP GitOps delivery mesh diagram and architecture flow ([#322](https://github.com/mlorentedev/web/issues/322)) ([2e2d8e9](https://github.com/mlorentedev/web/commit/2e2d8e91b087fd880f8a4a06b40f6515067ecb8b))
* **lab:** add IDP request path architecture flow and dedicated subpage ([#321](https://github.com/mlorentedev/web/issues/321)) ([08c83e4](https://github.com/mlorentedev/web/commit/08c83e41f66845bfb471d38989e010247e94cb2b))
* **lab:** add IDP zero-trust secret management diagram and architecture flow ([#323](https://github.com/mlorentedev/web/issues/323)) ([557d693](https://github.com/mlorentedev/web/commit/557d693fc5bc9c42266838a383311de18e9f42fd))
* **lab:** declare KubeLab IDP catalog data contract and provenance test ([#318](https://github.com/mlorentedev/web/issues/318)) ([c49f2db](https://github.com/mlorentedev/web/commit/c49f2db8cd0d0ea5a53fe60950eb99b0e9d74456))
* **lab:** implement KubeLab IDP catalog page, teaser, and views ([#319](https://github.com/mlorentedev/web/issues/319)) ([bc11a81](https://github.com/mlorentedev/web/commit/bc11a818c2209a563af20daca021481a8c7c9b0a))
* **lab:** redesign services section into minimalist ep-table ([#325](https://github.com/mlorentedev/web/issues/325)) ([e62fcef](https://github.com/mlorentedev/web/commit/e62fcef00f75e40bbfc8d4f0c4d0f52120202178))
* **layout:** widen the section container so card grids use the screen ([#320](https://github.com/mlorentedev/web/issues/320)) ([2cb519c](https://github.com/mlorentedev/web/commit/2cb519cfe63e1d062f953c8f05b6f2619ad5bebd))
* **notes:** add contextual superseded notices for legacy topology notes ([#311](https://github.com/mlorentedev/web/issues/311)) ([945f863](https://github.com/mlorentedev/web/commit/945f863178a0472e8c6edfc0fc2c33d18faa62ed)), closes [#237](https://github.com/mlorentedev/web/issues/237)
* **notes:** publish fail-closed agent harnesses technical note ([#313](https://github.com/mlorentedev/web/issues/313)) ([a63284a](https://github.com/mlorentedev/web/commit/a63284afbc785d9af98eb94c8b8bb1feacdf5aaa))


### Bug Fixes

* **ci:** port the hardened PR-Agent guard from the dotfiles canon ([#337](https://github.com/mlorentedev/web/issues/337)) ([6aa8f71](https://github.com/mlorentedev/web/commit/6aa8f7179a1e34aa8534d6494a334c09f3b1c83b))
* **ci:** skip the guard after a credential failure and keep lines under 130 columns ([#338](https://github.com/mlorentedev/web/issues/338)) ([bc95720](https://github.com/mlorentedev/web/commit/bc95720233817fc0374d8be0ef163346be4df274))
* **deps:** clear the three transitive advisories a lockfile bump can reach ([#329](https://github.com/mlorentedev/web/issues/329)) ([fed1837](https://github.com/mlorentedev/web/commit/fed1837c073c184e539146d2f42f8ecb84cc08cb))
* **i18n:** resolve SubscribeForm strings and privacy link via i18n layer ([#316](https://github.com/mlorentedev/web/issues/316)) ([6dd2d13](https://github.com/mlorentedev/web/commit/6dd2d13d6eb77829598fc1295116b40fea283b4e))
* **nginx:** align origin security headers with the edge middleware ([#327](https://github.com/mlorentedev/web/issues/327)) ([e168ba7](https://github.com/mlorentedev/web/commit/e168ba72b2309a08601b3ada7940a840876f0ea6))
* **notes:** reshape mermaid diagrams to eliminate horizontal overflow ([#317](https://github.com/mlorentedev/web/issues/317)) ([be58426](https://github.com/mlorentedev/web/commit/be5842604816f02e03f0233ccd76e082f02338d8))
* **seo:** align canonical, omit broken hreflangs, add 404 noindex, and fix trailing slashes ([#336](https://github.com/mlorentedev/web/issues/336)) ([7a16e7d](https://github.com/mlorentedev/web/commit/7a16e7da431a4049e30fc452294cb8d567d3f568))

## [1.14.0](https://github.com/mlorentedev/web/compare/v1.13.0...v1.14.0) (2026-09-04)


### Features

* **editorial:** restore commit chart, bridge lab to ai, and polish typography ([#301](https://github.com/mlorentedev/web/issues/301)) ([05de760](https://github.com/mlorentedev/web/commit/05de760150b6e31b5d4f8d00d2e9ea57b59a277d))
* **positioning:** sharpen systems engineer identity, contact framing, and llm metadata ([#305](https://github.com/mlorentedev/web/issues/305)) ([c9ffec1](https://github.com/mlorentedev/web/commit/c9ffec1ff4f832d24418d4359d6f65ac0b8a3b98))
* **site:** state which release built the page ([#307](https://github.com/mlorentedev/web/issues/307)) ([efd83c5](https://github.com/mlorentedev/web/commit/efd83c5a6910fc25f311f153b5a7cb20b10638f4))


### Bug Fixes

* **responsive:** eliminate viewport overflows and purge ghost consulting key ([#309](https://github.com/mlorentedev/web/issues/309)) ([ada3bfe](https://github.com/mlorentedev/web/commit/ada3bfe74cca98b4dbfccfcff303ac8e32a3f19e)), closes [#233](https://github.com/mlorentedev/web/issues/233) [#140](https://github.com/mlorentedev/web/issues/140) [#281](https://github.com/mlorentedev/web/issues/281)

## [1.13.0](https://github.com/mlorentedev/web/compare/v1.12.0...v1.13.0) (2026-09-04)


### Features

* **ci:** dispatch prod promotion to kubelab on published release ([#298](https://github.com/mlorentedev/web/issues/298)) ([44462cd](https://github.com/mlorentedev/web/commit/44462cd1c6bf80664ce6869d7b3353a483797a46))
* **home:** streamline landing page into cohesive proof of work ([#300](https://github.com/mlorentedev/web/issues/300)) ([69c0d4c](https://github.com/mlorentedev/web/commit/69c0d4c33e365bf049eb99669d6c2ce58f371bc0))

## [1.12.0](https://github.com/mlorentedev/web/compare/v1.11.0...v1.12.0) (2026-09-03)


### Features

* **ai:** scaffold dedicated AI harness section and pages ([#291](https://github.com/mlorentedev/web/issues/291)) ([ffae4ea](https://github.com/mlorentedev/web/commit/ffae4eaea7e8f6521f8b1b779f1838a3ded9c252))
* **ci:** refuse a release PR that would close an issue still open ([#289](https://github.com/mlorentedev/web/issues/289)) ([aad0080](https://github.com/mlorentedev/web/commit/aad00802108aeeb9c54ccd2bae8ccaa3272a7279))
* **lab:** add the delivery-path diagram and both diagrams' bilingual prose ([#257](https://github.com/mlorentedev/web/issues/257)) ([0b07576](https://github.com/mlorentedev/web/commit/0b07576461cd55ce8369d44d110ce969b7f94481)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **lab:** close WEB-080 — the axe and weight checks, and what axe found ([#271](https://github.com/mlorentedev/web/issues/271)) ([410699d](https://github.com/mlorentedev/web/commit/410699dda5c4cf0599a20f3916acdb387b43c17b)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **lab:** cut over to the rebuilt page and delete IdpPage.astro ([#267](https://github.com/mlorentedev/web/issues/267)) ([c60d96f](https://github.com/mlorentedev/web/commit/c60d96f2105715da1bd1549a7101c8fd67c62525)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **lab:** give the platform manifest a provenance and the Lab an audit ([#255](https://github.com/mlorentedev/web/issues/255)) ([238bc41](https://github.com/mlorentedev/web/commit/238bc4124ea834cd148bf5deb5fcdc83c431b1bb)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **lab:** migrate AI & Automations from the platform manifest ([#266](https://github.com/mlorentedev/web/issues/266)) ([975e569](https://github.com/mlorentedev/web/commit/975e569614fcbc24bab93e34a29423cf4083b266)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **lab:** rebuild Services and Infra from the manifest, static ([#262](https://github.com/mlorentedev/web/issues/262)) ([752db33](https://github.com/mlorentedev/web/commit/752db3328e7dab16dd31a8b38479fa6ff75789d0)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **lab:** render diagrams from a typed source, and prove it in CI ([#251](https://github.com/mlorentedev/web/issues/251)) ([4b36950](https://github.com/mlorentedev/web/commit/4b36950e5ac47da34b5bbf850b5c5002d2963697)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **notes:** give every note a way out ([#246](https://github.com/mlorentedev/web/issues/246)) ([1a76340](https://github.com/mlorentedev/web/commit/1a763405b5916e5c4b9b763b4fea4219d4bfb4d5)), closes [#235](https://github.com/mlorentedev/web/issues/235)
* **notes:** publish an RSS feed so the next note can be found ([#183](https://github.com/mlorentedev/web/issues/183)) ([a1466c5](https://github.com/mlorentedev/web/commit/a1466c5d527c170ec0b78da5fde4569e44e68f80))


### Bug Fixes

* **a11y:** give rendered diagrams an accessible name ([#248](https://github.com/mlorentedev/web/issues/248)) ([9f29f1c](https://github.com/mlorentedev/web/commit/9f29f1cce8efd4e6aa3f9e7cf213b6ebdcbe7420)), closes [#244](https://github.com/mlorentedev/web/issues/244)
* **consent:** make the cookie choice survivable and reversible ([#185](https://github.com/mlorentedev/web/issues/185)) ([1b41c39](https://github.com/mlorentedev/web/commit/1b41c397fddc12f8d84e803767c27ea9475c0cbb)), closes [#106](https://github.com/mlorentedev/web/issues/106) [#107](https://github.com/mlorentedev/web/issues/107)
* **lab:** apply the review — translate status, and assert access per row ([#263](https://github.com/mlorentedev/web/issues/263)) ([3932c49](https://github.com/mlorentedev/web/commit/3932c49db596e77a6afb7364743564d7eb6b9128)), closes [#181](https://github.com/mlorentedev/web/issues/181)
* **newsletter:** enforce the consent checkbox and send what it says ([#186](https://github.com/mlorentedev/web/issues/186)) ([23d2e00](https://github.com/mlorentedev/web/commit/23d2e003b35bef6f1a77b2788dea41b4f393100b)), closes [#105](https://github.com/mlorentedev/web/issues/105)
* **notes:** stop rendered diagrams overflowing the prose column ([#245](https://github.com/mlorentedev/web/issues/245)) ([6de3ac9](https://github.com/mlorentedev/web/commit/6de3ac920dd35a86f533284e89839037f9538109))
* **tests:** stop the dist server being walked out of, and persist the review ([#279](https://github.com/mlorentedev/web/issues/279)) ([b24890a](https://github.com/mlorentedev/web/commit/b24890a5dc2afa1dbb0c585f4cec0957bbf2c582)), closes [#181](https://github.com/mlorentedev/web/issues/181)

## [1.11.0](https://github.com/mlorentedev/web/compare/v1.10.1...v1.11.0) (2026-08-25)


### Features

* **cockpit:** add live platform telemetry strip and dedicated cockpit page ([#158](https://github.com/mlorentedev/web/issues/158)) ([8179d0a](https://github.com/mlorentedev/web/commit/8179d0abbef5f5b291c0e7fc52eff4b9d2976f45))
* **notes:** render the mermaid diagrams instead of shipping their source ([#176](https://github.com/mlorentedev/web/issues/176)) ([fcbe8c9](https://github.com/mlorentedev/web/commit/fcbe8c993a1946f9e73f1b8a5f3e3d1ea54641ca))


### Bug Fixes

* **ci:** build the static site natively so release promotion stops timing out ([#163](https://github.com/mlorentedev/web/issues/163)) ([6dc1a00](https://github.com/mlorentedev/web/commit/6dc1a0063488cc6945ccccd379a1ccd21f69bb30))
* **cockpit:** describe what the machines are for, not what they once were ([#179](https://github.com/mlorentedev/web/issues/179)) ([df583db](https://github.com/mlorentedev/web/commit/df583dbf8ff4ea7507353ccfe52dbf7f5e61251a))
* **cockpit:** publish the platform that exists ([#174](https://github.com/mlorentedev/web/issues/174)) ([45b2d6a](https://github.com/mlorentedev/web/commit/45b2d6ac4e049858af952a4d2f13bfd778b295af))
* **header:** keep the nav inside a 320px viewport with four items ([#167](https://github.com/mlorentedev/web/issues/167)) ([283e7a0](https://github.com/mlorentedev/web/commit/283e7a0f8664d85662812cf486757065a82aed74))
* **layout:** stop the page scrolling sideways, and let the header size itself ([#178](https://github.com/mlorentedev/web/issues/178)) ([f0b1e86](https://github.com/mlorentedev/web/commit/f0b1e8650cad79005caf7b36926fc7b391e29825))

## [1.10.1](https://github.com/mlorentedev/web/compare/v1.10.0...v1.10.1) (2026-08-21)


### Bug Fixes

* **a11y:** meet AA contrast, honour reduced motion, declare the colour scheme ([#149](https://github.com/mlorentedev/web/issues/149)) ([cbe61f4](https://github.com/mlorentedev/web/commit/cbe61f4d635798882e360ac67365ede06b6ec192)), closes [#115](https://github.com/mlorentedev/web/issues/115) [#145](https://github.com/mlorentedev/web/issues/145)
* **i18n:** render note dates in UTC so they stop showing a day early ([#148](https://github.com/mlorentedev/web/issues/148)) ([feb2dad](https://github.com/mlorentedev/web/commit/feb2daddc12a88a74418476f68efdaf1b7c9bc95)), closes [#122](https://github.com/mlorentedev/web/issues/122)
* **i18n:** stop English strings leaking onto Spanish pages ([#150](https://github.com/mlorentedev/web/issues/150)) ([cf53fe5](https://github.com/mlorentedev/web/commit/cf53fe53d9e89d9dc6e1a6bcefc2387f3171ab9e)), closes [#111](https://github.com/mlorentedev/web/issues/111)
* **layout:** derive the header offset from one token instead of per page ([#152](https://github.com/mlorentedev/web/issues/152)) ([ce9b944](https://github.com/mlorentedev/web/commit/ce9b9447331d96076e567e07c7edc9035506ac7d)), closes [#119](https://github.com/mlorentedev/web/issues/119)

## [1.10.0](https://github.com/mlorentedev/web/compare/v1.9.0...v1.10.0) (2026-07-10)


### Features

* GitHub OSS telemetry proof surface — baked metrics (WEB-019) ([#78](https://github.com/mlorentedev/web/issues/78)) ([a78a6a4](https://github.com/mlorentedev/web/commit/a78a6a461849b7231fa860f00288b13bdfce6efe)), closes [#46](https://github.com/mlorentedev/web/issues/46)
* live client-side hydration for the proof surface (WEB-019) ([#80](https://github.com/mlorentedev/web/issues/80)) ([e943f13](https://github.com/mlorentedev/web/commit/e943f13ff6fce5203ddccb7d28e79fb1d63ddf52)), closes [#46](https://github.com/mlorentedev/web/issues/46)

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
