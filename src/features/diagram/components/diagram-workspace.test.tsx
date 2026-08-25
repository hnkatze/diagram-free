// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDiagramPrompt } from "../application/build-diagram-prompt";
import { DiagramWorkspace } from "./diagram-workspace";

// vitest.config.mts does not set `test.globals: true`, so @testing-library/react's
// implicit afterEach auto-cleanup never registers; do it explicitly per test.
afterEach(cleanup);

// jsdom has no ResizeObserver; @xyflow/react needs one to mount its canvas, unrelated to
// what this file tests.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

/** jsdom has no `navigator.clipboard`; each test installs the exact behavior it needs. */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("DiagramWorkspace copy as prompt", () => {
  it("copies the prompt to the clipboard and does not open a dialog when writeText succeeds", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<DiagramWorkspace />);

    await user.click(screen.getByRole("button", { name: /copy as prompt/i }));

    const expectedPrompt = buildDiagramPrompt([], []);
    expect(expectedPrompt).toContain("Format rules:");
    expect(writeText).toHaveBeenCalledWith(expectedPrompt);
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the fallback dialog with the prompt text when writeText rejects", async () => {
    const user = userEvent.setup();
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<DiagramWorkspace />);

    await user.click(screen.getByRole("button", { name: /copy as prompt/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /prompt/i })).toHaveValue(buildDiagramPrompt([], []));
  });

  it("drops a second rapid click while the first copy is in flight, avoiding contradictory feedback", async () => {
    const writeText = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("denied")))
      .mockImplementationOnce(() => Promise.resolve(undefined));
    stubClipboard(writeText);
    render(<DiagramWorkspace />);

    const button = screen.getByRole("button", { name: /copy as prompt/i });
    // fireEvent (not userEvent) dispatches synchronously, so the second click lands
    // before the first call's writeText promise settles and the in-flight guard resets.
    fireEvent.click(button);
    fireEvent.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
