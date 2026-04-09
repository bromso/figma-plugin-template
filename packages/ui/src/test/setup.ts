import "@testing-library/jest-dom";
import { vi } from "vitest";

// figma-plugin-ds/index.js uses ESM syntax without "type":"module", causing
// Node CJS resolution to fail when react-figma-ui does require("figma-plugin-ds").
// Mock it globally so the disclosure/selectMenu init calls are no-ops in tests.
vi.mock("figma-plugin-ds", () => ({
  disclosure: { init: vi.fn(), destroy: vi.fn() },
  selectMenu: { init: vi.fn(), destroy: vi.fn() },
}));
