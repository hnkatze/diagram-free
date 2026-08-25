// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

// vitest.config.mts does not set `test.globals: true`, so @testing-library/react's
// implicit afterEach auto-cleanup never registers; do it explicitly per test.
afterEach(cleanup);

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}));

afterEach(() => {
  setTheme.mockClear();
});

describe("ThemeToggle", () => {
  it("renders an icon-only trigger with an accessible name", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("opens and lists Light, Dark, and System options", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));

    expect(await screen.findByText("Theme")).toBeInTheDocument();
    for (const label of ["Light", "Dark", "System"]) {
      expect(await screen.findByRole("menuitemradio", { name: label })).toBeInTheDocument();
    }
  });

  it("calls next-themes' setTheme when selecting an option", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Dark" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
