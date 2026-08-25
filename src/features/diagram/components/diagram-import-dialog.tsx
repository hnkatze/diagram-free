"use client";

import { useCallback, useId, useState, type ChangeEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { parseDiagram } from "../application/parse-diagram";
import type { DiagramSource } from "../domain/diagram-source";
import { DIAGRAM_TEMPLATES, type DiagramTemplate } from "../domain/diagram-templates";

type DiagramImportDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onImport: (source: DiagramSource) => void;
};

export function DiagramImportDialog({ open, onOpenChange, onImport }: DiagramImportDialogProps) {
  const [pastedText, setPastedText] = useState("");
  const [errors, setErrors] = useState<readonly string[]>([]);
  const textareaId = useId();
  const fileInputId = useId();

  const submitRaw = useCallback(
    (raw: string) => {
      const result = parseDiagram(raw);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors([]);
      onImport(result.value);
      onOpenChange(false);
    },
    [onImport, onOpenChange],
  );

  const handlePasteSubmit = useCallback(() => {
    submitRaw(pastedText);
  }, [pastedText, submitRaw]);

  const handleLoadTemplate = useCallback((template: DiagramTemplate) => {
    setPastedText(JSON.stringify(template.source, null, 2));
    setErrors([]);
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        submitRaw(text);
      };
      reader.onerror = () => {
        setErrors(["Could not read the selected file."]);
      };
      reader.readAsText(file);
    },
    [submitRaw],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import diagram</DialogTitle>
          <DialogDescription>
            Paste JSON or upload a file describing the nodes and edges to display.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Could not import diagram</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="paste">
            <TabsList>
              <TabsTrigger value="paste">Paste</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={textareaId}>Diagram JSON</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button type="button" variant="ghost" size="sm">
                        Load example
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Load a template</DropdownMenuLabel>
                      {DIAGRAM_TEMPLATES.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={() => handleLoadTemplate(template)}
                        >
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id={textareaId}
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                rows={10}
                placeholder='{"nodes": [...], "edges": [...]}'
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handlePasteSubmit}>
                  Import
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex flex-col gap-3">
              <Label htmlFor={fileInputId}>Diagram JSON file</Label>
              <Input
                id={fileInputId}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
              />
            </TabsContent>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
