# Reviewing the v2 acceptance corpus

This repository includes a local comparison tool for reviewing the v2 acceptance inputs against
the current v3 formatter. The v2 reference output was produced through Pint, which v3 does not
support, so differences are evidence to inspect rather than test failures by themselves.

## Generate the report

Fetch the v2 branch if `origin/v2` is not available locally, then run:

```bash
node scripts/v2-corpus/generate.mjs
```

The command builds the current plugin, extracts every v2 acceptance test directly from the Git
ref, formats each input up to four times, and writes a reusable report to
`.tmp/v2-corpus-review/`. That directory is ignored by Git.

For a quick pilot or a targeted rerun, pass `name=value` options after `--`:

```bash
node scripts/v2-corpus/generate.mjs limit=50
node scripts/v2-corpus/generate.mjs case=builder
node scripts/v2-corpus/generate.mjs profiles=default,php-off
node scripts/v2-corpus/generate.mjs profiles=all concurrency=4
```

Available profiles are `default`, `php-off`, `tabs`, `strict`, and `ignore`. The default profile
uses v3's published PHP-safe behavior with `@prettier/plugin-php` loaded. Use
`node scripts/v2-corpus/generate.mjs --help` for all options.

Each run recreates the report directory and emits:

- extracted v2 inputs under `inputs/`;
- Pint-influenced v2 references under `v2-reference/`;
- v3 outputs under `v3/<profile>/`;
- a machine-readable `manifest.json`;
- report data and the static browser UI.

Exact input matches already present under `tests/fixtures/validation/` are marked as duplicates.
The report also flags formatter errors, failure to converge by pass four, core delimiter-count
changes, extreme output growth, trailing whitespace, unusual indentation growth, and unusual line
growth. These checks prioritize review; they do not decide whether formatting is aesthetically
correct.

## Review in the browser

Start the local server:

```bash
node scripts/v2-corpus/serve.mjs
```

Open the printed URL, normally <http://127.0.0.1:4173>. The browser starts with cases ordered by
review priority. You can:

- compare v2 output with v3 output, original input with v3, or input with v2;
- filter hard failures, warnings, existing fixture duplicates, and manual classifications;
- show only changed lines;
- use `j` and `k` to move between cases when focus is not in a form control;
- classify a case as reasonable, a possible bug, an expected deviation, or a duplicate;
- keep notes and export or import the review ledger as JSON.

Review state is stored in the browser for the report's v2 and v3 revisions. Export the review JSON
before clearing browser data or sharing findings. Confirmed bugs should be minimized into focused,
committed regression tests rather than turning the complete generated output into snapshots.
