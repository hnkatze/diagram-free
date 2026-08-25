// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DIAGRAM_TEMPLATES } from "../domain/diagram-templates";
import { DiagramToolbar } from "./diagram-toolbar";

// vitest.config.mts does not set `test.globals: true`, so @testing-library/react's
// implicit afterEach auto-cleanup never registers; do it explicitly per test.
afterEach(cleanup);

function renderToolbar(options: { readonly isEmpty?: boolean; readonly exportError?: string | null } = {}) {
  const handlers = {
    onImport: vi.fn(),
    onSelectTemplate: vi.fn(),
    onAutoLayout: vi.fn(),
    onFitView: vi.fn(),
    onCopyPrompt: vi.fn(),
    onExportPng: vi.fn(),
  };
  render(
    <DiagramToolbar
      {...handlers}
      isCopied={false}
      isEmpty={options.isEmpty ?? false}
      exportError={options.exportError ?? null}
    />,
  );
  return handlers;
}

describe("DiagramToolbar Templates dropdown", () => {
  it("opens and lists every template under its group label (regression: Base UI requires DropdownMenuLabel inside DropdownMenuGroup)", async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.click(screen.getByRole("button", { name: /templates/i }));

    expect(await screen.findByText("Start from a template")).toBeInTheDocument();
    for (const template of DIAGRAM_TEMPLATES) {
      expect(
        await screen.findByRole("menuitem", { name: new RegExp(template.name, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("calls onSelectTemplate with the clicked template", async () => {
    const user = userEvent.setup();
    const { onSelectTemplate } = renderToolbar();
    const target = DIAGRAM_TEMPLATES[0];
    if (!target) {
      throw new Error("Expected at least one diagram template to exist");
    }

    await user.click(screen.getByRole("button", { name: /templates/i }));
    const menuItem = await screen.findByRole("menuitem", { name: new RegExp(target.name, "i") });
    await user.click(menuItem);

    expect(onSelectTemplate).toHaveBeenCalledWith(target);
  });
});

describe("DiagramToolbar Export as PNG button", () => {
  it("is disabled when the canvas is empty", () => {
    renderToolbar({ isEmpty: true });

    expect(screen.getByRole("button", { name: /export as png/i })).toBeDisabled();
  });

  it("is enabled and calls onExportPng when the canvas has nodes", async () => {
    const user = userEvent.setup();
    const { onExportPng } = renderToolbar({ isEmpty: false });

    const button = screen.getByRole("button", { name: /export as png/i });
    expect(button).toBeEnabled();

    await user.click(button);

    expect(onExportPng).toHaveBeenCalledTimes(1);
  });

  it("announces an export error via role=alert", () => {
    renderToolbar({ exportError: "Could not export the diagram as an image. Please try again." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not export the diagram as an image. Please try again.",
    );
  });
});
