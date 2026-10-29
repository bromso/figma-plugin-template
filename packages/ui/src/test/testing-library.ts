// Preload 2 of 2. Runs after happydom.ts (order is set in bunfig.toml).

import { afterEach, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

// Vitest unmounted rendered trees between tests automatically; bun test does not.
afterEach(() => {
  cleanup();
});
