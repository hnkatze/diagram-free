// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

// vitest.config.mts does not set `test.globals: true`, so @testing-library/react's
// implicit afterEach auto-cleanup never registers; do it explicitly per test.
afterEach(cleanup);

describe("Dialog scroll region", () => {
  it("keeps DialogHeader and DialogFooter out of the scrolling DialogBody", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pinned title</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p>Scrolling content</p>
          </DialogBody>
          <DialogFooter>
            <span>Pinned footer</span>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    const title = screen.getByRole("heading", { name: /pinned title/i });
    const bodyText = screen.getByText("Scrolling content");
    const footerText = screen.getByText("Pinned footer");

    const scrollRegion = document.querySelector('[data-slot="dialog-body"]');
    expect(scrollRegion).not.toBeNull();
    // Containment alone would still pass if the scroll class were dropped.
    expect(scrollRegion).toHaveClass("overflow-y-auto", "min-h-0", "flex-1");
    expect(scrollRegion).toContainElement(bodyText);
    expect(scrollRegion).not.toContainElement(title);
    expect(scrollRegion).not.toContainElement(footerText);
  });
});
