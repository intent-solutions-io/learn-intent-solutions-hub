# Learn Intent Solutions

The learning hub for the Intent Solutions cohort. Deploys to **learn.intentsolutions.io**.

Exam tracks, practice tests with readiness gates, and the front door of the funnel: video → learn → certify → bench → paid client work through Intent Solutions.

## Credit

**Built and maintained by Max Sheahan.** GitHub preserves every commit's author, so authorship stays with the builder. This repo lives in the company org so it can ship under the `intentsolutions.io` name; that does not move the credit, it gives the work a public stage.

## How work ships here

- **Max is the maintainer.** Build freely on branches, open pull requests.
- **Jeremy is the merge gate.** Anything that ships under the company name is previewed and approved before it goes live. Same rule the whole estate holds itself to.
- **`main` deploys automatically** to learn.intentsolutions.io on the Contabo VPS (Caddy), via the standard per-repo deploy workflow. Wiring is added when the hub source lands.

## Status

Scaffold. The cohort hub source arrives as Max's import PR (branch under his own git identity, authorship preserved). Deploy wiring (DNS + Caddy + `deploy.yml`) follows per `intent-os/ops/deploy`.
