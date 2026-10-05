# Content and asset sources

Sources were checked on October 1, 2026. Profile content is maintained in `src/data/profile.ts`.

## Personal and research information

The owner-supplied `CV.docx` is the source for education, research appointments, personal contributions, honors, community work, email, and the New Engineering Exhibition award. The website selects material relevant to an academic profile; the original CV remains the comprehensive record. Telephone details are not duplicated in homepage content.

Paper titles, author order, contribution markers, publication status, and resource links follow the current author-maintained project pages:

- [DIWA](https://apromisedland.github.io/diwa-paper-page/): ICLR 2027 submission, under review. Its public page names Yirong Qiang and Lianlei Shan without contribution markers. The repository README still describes an anonymous submission; the current public page and supplied CV already identify its authors. The data field `year: 2027` represents the submission venue year, not an assertion of publication or acceptance.
- [VLCoT](https://apromisedland.github.io/vlcot-paper-page/): accepted at ICML 2026. [Structured paper metadata](https://github.com/apromisedland/vlcot-paper-page/blob/main/assets/data/paper.json) records author confirmation on September 27, 2026. The page's exact `* Co-authors` wording is retained; it is not expanded into an equal-contribution claim.
- [Tame3D](https://apromisedland.github.io/tame3d-paper-page/): ICLR 2025 **Workshop on Foundation Models in the Wild**, not the main conference. The current page and [citation](https://apromisedland.github.io/tame3d-paper-page/assets/citation.bib) spell the final author's name **Yilun Chen**; the CV's shorter `Lun Chen` spelling is not copied. Equal-contribution and corresponding-author markers follow the public page.
- [OmniIntents](https://apromisedland.github.io/omniintents-paper-page/): published at CHI 2025, with the publication status updated following the owner's correction. The [citation](https://apromisedland.github.io/omniintents-paper-page/assets/omniintents.bib) is provisional; no DOI, page numbers, or final proceedings metadata are invented. Author order and contribution markers follow the current public page.

The [Trustworthy Agent Simulation repository](https://github.com/apromisedland/trustworthy-agent-simulation) is the source for its current software description and AgentScope/Mesa technology tags. Its screenshot depicts an offline baseline run. It is not evidence of LLM behavior or validated real-world policy effects. Personal contribution and the exhibition award come from the CV; the award is not claimed for a separately dated software release.

Research summaries describe methods and goals. They do not assert that the linked research implementations reproduce the papers' reported measurements.

The current public CV is the owner's supplied `public/cv/CV_YirongQiang.pdf`, used without modifying its bytes. It contains two readable pages, no telephone fields or detected mobile phone numbers, and no embedded attachments. All website CV links use this filename. Root-level Word and PDF source documents remain private and ignored by Git. The optional `scripts/build_cv.py` generates a candidate from the earlier private source into `tmp/cv/`; it does not overwrite the owner's current public PDF.

## Included images

The four research figures are original paper materials supplied through the owner's project pages. They retain their original authors' and other applicable rights. Their public availability does not grant a new license. The project screenshot retains its source repository's applicable rights. No blanket website code license should be interpreted as relicensing these assets.

| Local file | Original source | Treatment and dimensions |
| --- | --- | --- |
| `public/images/diwa-architecture.webp` | [DIWA architecture.jpg](https://raw.githubusercontent.com/apromisedland/diwa-paper-page/main/assets/architecture.jpg) | Original 3300 × 2460 JPEG resized without cropping to 1400 × 1044 and encoded as WebP, quality 90; 101,348 bytes. |
| `public/images/vlcot-architecture.svg` | [VLCoT architecture.svg](https://raw.githubusercontent.com/apromisedland/vlcot-paper-page/main/assets/figures/vlcot_architecture.svg) | Unmodified SVG; viewBox 864 × 529.2; 47,024 bytes. |
| `public/images/omniintents-architecture.webp` | [OmniIntents architecture.webp](https://raw.githubusercontent.com/apromisedland/omniintents-paper-page/main/assets/figures/architecture.webp) | Unmodified WebP; 2600 × 934; 178,340 bytes. |
| `public/images/tame3d-framework.webp` | [Tame3D framework.webp](https://raw.githubusercontent.com/apromisedland/tame3d-paper-page/main/assets/framework.webp) | Unmodified WebP; 1608 × 754; 89,062 bytes. |
| `public/images/agent-simulation-dashboard.png` | [Trustworthy Agent Simulation dashboard.png](https://raw.githubusercontent.com/apromisedland/trustworthy-agent-simulation/main/docs/assets/dashboard.png) | Unmodified screenshot of an offline baseline run; 704 × 871; 34,827 bytes. |

These five images total 450,601 bytes. Paper figures should be displayed in their original proportions with all labels preserved. The dashboard is a portrait image and should not be cropped into a landscape figure.

| Local image | SHA-256 |
| --- | --- |
| `diwa-architecture.webp` | `ea538a52d7563c6f284b41e8036e97d579b208acfe7c3b6ddabd745691342d02` |
| `vlcot-architecture.svg` | `e07f55d5c377a47b1f2d04e388aac24447717f32dfba4ec197774a7eb01c9aed` |
| `omniintents-architecture.webp` | `1c27e0adaa735e7954f42317c08d08a0133eecc35450e428218a7994ca727fa5` |
| `tame3d-framework.webp` | `abf89a1c2f4795d45beeeaa6c294ae4f8793a982f222d1adc080e8fa53d98545` |
| `agent-simulation-dashboard.png` | `895ef5262e5bb122be7e52a6127d89f020f3633381b8be068e4d224525338919` |

The original DIWA JPEG SHA-256 is `4124a19a7985006d02a4d61ba3fa1f519e7def4a67f1e4a8dbc3bb1cc73fc082`. All other local image hashes also match their source bytes.

Original rights notices: [DIWA](https://github.com/apromisedland/diwa-paper-page/blob/main/THIRD_PARTY_NOTICES.md), [VLCoT](https://github.com/apromisedland/vlcot-paper-page/blob/main/THIRD_PARTY_NOTICES.md), [OmniIntents](https://github.com/apromisedland/omniintents-paper-page/blob/main/THIRD_PARTY_NOTICES.md), [Tame3D](https://github.com/apromisedland/tame3d-paper-page/blob/main/THIRD_PARTY_NOTICES.md), and [Trustworthy Agent Simulation](https://github.com/apromisedland/trustworthy-agent-simulation/blob/main/NOTICE).

## Fonts

The site uses self-hosted variable font files from [`@fontsource-variable/newsreader`](https://www.npmjs.com/package/@fontsource-variable/newsreader) and [`@fontsource-variable/manrope`](https://www.npmjs.com/package/@fontsource-variable/manrope). Both packages declare **OFL-1.1**, the SIL Open Font License, in the npm metadata verified during implementation (version 5.3.0). Their copyright and license notices accompany the site under `public/fonts/licenses/`. Font software retains its original license.

Font projects and package information: [Newsreader](https://fontsource.org/fonts/newsreader) and [Manrope](https://fontsource.org/fonts/manrope).

The original paper images are independent of the font licenses. Research-code licenses also do not extend to the paper materials: VLCoT and OmniIntents code declare MIT; Tame3D and Trustworthy Agent Simulation code declare Apache-2.0.

## Original social preview

`public/images/social-preview.png` is a 1200 × 630 original composition for this homepage, generated by `scripts/build_social.mjs`. It combines the profile's verified name and role with the original conceptual vector illustration from `src/components/ResearchScene.astro`. The robotic arm, reasoning path, and cubes are schematic artwork, not a photograph or a model recording. No paper figure or external stock image is included.

The warm-white background (`#f7f6f0`), slate-blue accents (`#45627d`), charcoal text (`#2a2e35`), and amber illustration details follow the homepage palette. The neutral three-node mark represents perception, reasoning, and action; it contains no personal initials. Georgia and Arial are rasterized through the local SVG renderer; no operating-system font files are redistributed. Regeneration uses the project's Sharp package or a verified existing installation supplied through the `SHARP_MODULE` environment variable, without automatically installing dependencies.
