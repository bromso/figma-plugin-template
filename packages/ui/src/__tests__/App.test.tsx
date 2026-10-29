import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import App from "../app";

describe("App (component sampler)", () => {
  it("renders the panel sections", () => {
    render(<App />);
    expect(screen.getByText("Layer")).toBeInTheDocument();
    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders the primary action", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders the tab bar", () => {
    render(<App />);
    expect(screen.getByRole("tab", { name: "Design" })).toBeInTheDocument();
  });
});
