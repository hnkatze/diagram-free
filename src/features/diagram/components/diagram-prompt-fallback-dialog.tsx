"use client";

import { useId } from "react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DiagramPromptFallbackDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly prompt: string;
};

/** Shown only when the automatic clipboard copy failed; the textarea is read-only so the prompt can only be selected, not edited. */
export function DiagramPromptFallbackDialog({
  open,
  onOpenChange,
  prompt,
}: DiagramPromptFallbackDialogProps) {
  const textareaId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Copy manually</DialogTitle>
          <DialogDescription>
            Your browser blocked the automatic copy. Select the text below and copy it yourself.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-3">
            <Label htmlFor={textareaId}>Prompt</Label>
            <Textarea id={textareaId} value={prompt} readOnly rows={14} />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
