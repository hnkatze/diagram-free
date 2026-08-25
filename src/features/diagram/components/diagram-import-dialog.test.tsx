// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DIAGRAM_TEMPLATES } from "../domain/diagram-templates";
import { DiagramImportDialog } from "./diagram-import-dialog";

// vitest.config.mts does not set `test.globals: true`, so @testing-library/react's
// implicit afterEach auto-cleanup never registers; do it explicitly per test.
afterEach(cleanup);

function renderDialog() {
  const handlers = {
    onOpenChange: vi.fn(),
    onImport: vi.fn(),
  };
  render(<DiagramImportDialog open {...handlers} />);
  return handlers;
}

describe("DiagramImportDialog Load example dropdown", () => {
  it("lists every template under its group label", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /load example/i }));

    expect(await screen.findByText("Load a template")).toBeInTheDocument();
    for (const template of DIAGRAM_TEMPLATES) {
      expect(
        await screen.findByRole("menuitem", { name: new RegExp(template.name, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("fills the textarea with the JSON of the picked template, not always the first one", async () => {
    const user = userEvent.setup();
    renderDialog();
    const target = DIAGRAM_TEMPLATES[1];
    if (!target) {
      throw new Error("Expected at least two diagram templates to exist");
    }

    await user.click(screen.getByRole("button", { name: /load example/i }));
    const menuItem = await screen.findByRole("menuitem", { name: new RegExp(target.name, "i") });
    await user.click(menuItem);

    const textarea = screen.getByRole("textbox", { name: /diagram json/i });
    expect(textarea).toHaveValue(JSON.stringify(target.source, null, 2));
  });
});
