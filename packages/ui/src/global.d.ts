/// <reference types="bun" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import type { AsymmetricMatcher, expect } from "bun:test";

type StringMatcher = ReturnType<typeof expect.stringContaining>;

declare module "bun:test" {
  interface Matchers<T> extends TestingLibraryMatchers<StringMatcher, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers<StringMatcher, AsymmetricMatcher> {}
}
