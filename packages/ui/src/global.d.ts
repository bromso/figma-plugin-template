/// <reference types="bun" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "bun:test" {
  // biome-ignore lint/suspicious/noEmptyInterface: module augmentation, not an alias
  interface Matchers<T> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  // biome-ignore lint/suspicious/noEmptyInterface: module augmentation, not an alias
  interface AsymmetricMatchers extends TestingLibraryMatchers<unknown, unknown> {}
}
