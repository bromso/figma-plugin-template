import { describe, expect, it } from "vitest";
import { classes } from "../utils/classes.util";

describe("classes", () => {
  it("joins class names", () => {
    expect(classes("foo", "bar")).toBe("foo bar");
  });

  it("filters falsy values", () => {
    expect(classes("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("returns empty string for no args", () => {
    expect(classes()).toBe("");
  });
});
