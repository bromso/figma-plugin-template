import { afterEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useFigmaTheme } from "./use-figma-theme";

const html = () => document.documentElement;

afterEach(() => {
  html().classList.remove("figma-dark", "figma-light", "dark");
});

describe("useFigmaTheme", () => {
  it("is light when no theme class is set", () => {
    const { result } = renderHook(() => useFigmaTheme());
    expect(result.current).toBe("light");
  });

  it("is dark when <html> already has figma-dark", () => {
    html().classList.add("figma-dark");
    const { result } = renderHook(() => useFigmaTheme());
    expect(result.current).toBe("dark");
  });

  it("treats the .dark class (Storybook, tests) as dark too", () => {
    html().classList.add("dark");
    const { result } = renderHook(() => useFigmaTheme());
    expect(result.current).toBe("dark");
  });

  it("follows class changes after mount", async () => {
    const { result } = renderHook(() => useFigmaTheme());
    expect(result.current).toBe("light");
    await act(async () => {
      html().classList.add("figma-dark");
      await Promise.resolve(); // let the MutationObserver callback run
    });
    expect(result.current).toBe("dark");
    await act(async () => {
      html().classList.remove("figma-dark");
      await Promise.resolve();
    });
    expect(result.current).toBe("light");
  });

  it("stops observing after unmount", async () => {
    const { result, unmount } = renderHook(() => useFigmaTheme());
    unmount();
    await act(async () => {
      html().classList.add("figma-dark");
      await Promise.resolve();
    });
    expect(result.current).toBe("light");
  });
});
