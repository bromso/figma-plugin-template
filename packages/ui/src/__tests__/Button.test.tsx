import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../components/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    render(<Button className="custom">OK</Button>);
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });
});
