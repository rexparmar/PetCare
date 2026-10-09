import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState, LoadingState } from "../components/ui/States";

describe("async states", () => {
  it("renders accessible loading feedback", () => {
    render(<LoadingState label="Loading pet records…" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading pet records…",
    );
  });

  it("renders a useful error message", () => {
    render(<ErrorState message="Dashboard service unavailable" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("Dashboard service unavailable"),
    ).toBeInTheDocument();
  });
});
