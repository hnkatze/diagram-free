import { ClipboardCopy, Download, FileUp, LayoutGrid, LayoutTemplate, Maximize } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

import { DIAGRAM_TEMPLATES, type DiagramTemplate } from "../domain/diagram-templates";

type DiagramToolbarProps = {
  readonly onImport: () => void;
  readonly onSelectTemplate: (template: DiagramTemplate) => void;
  readonly onAutoLayout: () => void;
  readonly onFitView: () => void;
  readonly onCopyPrompt: () => void;
  readonly onExportPng: () => void;
  readonly isCopied: boolean;
  readonly isEmpty: boolean;
  readonly exportError: string | null;
};

export function DiagramToolbar({
  onImport,
  onSelectTemplate,
  onAutoLayout,
  onFitView,
  onCopyPrompt,
  onExportPng,
  isCopied,
  isEmpty,
  exportError,
}: DiagramToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-2">
      <div className="flex items-center gap-2 overflow-x-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="outline" size="sm">
                <LayoutTemplate aria-hidden="true" />
                Templates
              </Button>
            }
          />
          <DropdownMenuContent className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Start from a template</DropdownMenuLabel>
              {DIAGRAM_TEMPLATES.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className="flex-col items-start gap-0.5"
                >
                  <span>{template.name}</span>
                  <span className="text-xs text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground/70">
                    {template.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" size="sm" onClick={onImport}>
          <FileUp aria-hidden="true" />
          Import JSON
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onAutoLayout} disabled={isEmpty}>
          <LayoutGrid aria-hidden="true" />
          Auto layout
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onFitView} disabled={isEmpty}>
          <Maximize aria-hidden="true" />
          Fit view
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCopyPrompt}>
          <ClipboardCopy aria-hidden="true" />
          Copy as prompt
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onExportPng} disabled={isEmpty}>
          <Download aria-hidden="true" />
          Export as PNG
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span role="alert" className="text-sm text-destructive">
          {exportError ?? ""}
        </span>
        <span role="status" aria-live="polite" className="min-w-16 text-sm text-foreground">
          {isCopied ? "Copied" : ""}
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
}
