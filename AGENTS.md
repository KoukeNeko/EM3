# Repository Guidelines

## Commit And PR Guidance

Use Linux kernel/Git-style commit subjects with a concrete area, subsystem, component, directory, package, or file prefix:

```
area: imperative patch summary
sub/sys: imperative patch summary
```

The prefix should name the repository area primarily changed. Prefer specific prefixes such as a directory, package, file, subsystem, or component name.

Do not use generic Conventional Commit prefixes such as `fix:`, `feat:`, `chore:`, `docs:`, or `refactor:` unless they are actual repository areas in this repository. The prefix should describe where the change belongs, not what type of change it is.

Use an imperative verb in the summary after the colon, such as `fix`, `clarify`, `split`, `validate`, `rename`, `remove`, `add`, `update`, `document`, etc. Do not use past tense verbs like `fixed` or `added`.

When a patch spans multiple areas, choose the narrowest common area if one exists. If no clear common area exists, use the primary behavior changed rather than listing multiple unrelated prefixes.

The summary after the colon should briefly describe what the patch does, because it becomes the first line shown in the git changelog. Keep it short, imperative, and specific. Prefer subjects under 72 characters. Use lowercase for the first word after the colon unless it is a proper noun, and do not end the subject with a period.

Examples:

```
storybook: clarify build ownership
web/routes: split route-level chunks
ui/field: fix select menu positioning
server/auth: validate session cookie
githooks.txt: improve the intro section
```

Use a commit body when the reason for the change is not obvious from the diff. Explain why the change is needed, not just what changed.

PRs should describe the changed area, summarize the user-visible or developer-visible impact, list validation commands run, link related issues, and include screenshots for visible web UI changes.

If no validation was run, state that explicitly and explain why. Do not claim to have run commands that were not actually executed.

For UI changes that are not easily captured in a screenshot, describe the visual change and any manual checks performed.

## E3 Test Account And Agent Tools

EM3 talks to the real NYCU E3 (`https://e3p.nycu.edu.tw`, Moodle 4.5 mobile web service). A real student account is stored in `.env.local` as `E3_USERNAME` / `E3_PASSWORD`. The file is gitignored; never commit it, print it, or prefix the variables with `VITE_` (that would ship them in the bundle).

The account belongs to a real student, so all automated work must be read-only:

- Never submit, upload, save drafts, post, reply, delete, change preferences (including the E3 language switch and course-list filters), star or hide courses, mark anything read, or start quiz attempts.
- You may open a submission page or EM3's confirm dialog to inspect it, but never press the final submit.
- Prefer the web service API over clicking around the E3 web UI; when driving a browser, abort every non-GET request to E3.

Helpers:

- `python3 scripts/e3-ws.py <wsfunction> [key=value ...]` calls a web service function and prints JSON. It only allows read verbs (`get`, `search`, `list`, `check`, `can`, `data`). Array params use Moodle syntax, e.g. `'courseids[0]=25283'`.
- `NODE_PATH=$(npm root -g) node scripts/shot.mjs <outdir> <width>x<height> <hash-path>...` screenshots EM3 pages signed in as the test account, with state-changing E3 requests aborted. Run `pnpm dev` first. Uses the globally installed Playwright.

Research notes about how E3 is used live in `docs/research/`; design rationale is in `docs/design.md`.

## Deploy

`main` deploys to Cloudflare Workers (static assets) at `https://e3.emtech.cc` via the `deploy` job in `.github/workflows/ci.yml`, which needs the `CLOUDFLARE_API_TOKEN` repository secret. Manual deploy: `pnpm run deploy` (uses `wrangler.jsonc`).
