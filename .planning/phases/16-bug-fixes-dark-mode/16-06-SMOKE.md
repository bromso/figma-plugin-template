# BUG-06 smoke test — path with spaces

Verifies that `bun run build` succeeds when the current working directory contains a space character. The fix is the custom postcss-url callback in `apps/design-plugin/vite.config.ui.ts` that uses `pathToFileURL` from `node:url`.

## Recipe

```bash
# From the repo root
REPO="$(pwd)"
SPACE_DIR="/tmp/bug-06 smoke"
mkdir -p "/tmp"
ln -sfn "$REPO" "$SPACE_DIR"
cd "$SPACE_DIR"
bun run build
BUILD_EXIT=$?
cd "$REPO"
rm "$SPACE_DIR"
test "$BUILD_EXIT" -eq 0 && echo "PASS: BUG-06 smoke test" || echo "FAIL: BUG-06 smoke test (exit $BUILD_EXIT)"
```

## Expected result

`PASS: BUG-06 smoke test`. The build output under `apps/design-plugin/dist/index.html` should exist after the run. Any font or image CSS assets should appear as `data:font/woff2;base64,...` or similar inlined tokens.

## Recorded run

Date: 2026-04-10
Result: PASS
Build output path: apps/design-plugin/dist/index.html
Symlink used: `/tmp/bug-06 smoke` → worktree root
Notes:
- Ran with `bun run build --force` to defeat Turborepo cache and actually exercise the postcss-url pipeline under the space-containing CWD.
- Both `@repo/design-plugin:build` and `@repo/figma-plugin:build` completed with exit 0.
- The custom `inlineAssetAsDataUri` callback in `apps/design-plugin/vite.config.ui.ts` fed every CSS `url()` asset through `pathToFileURL` + `fs.readFileSync` without decoding errors.
