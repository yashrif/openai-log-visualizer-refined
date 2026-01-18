import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ModeToggle } from '@/components/mode-toggle';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your viewing experience.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme" className="text-right">
              Theme
            </Label>
            <div className="col-span-3">
              <ModeToggle />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-muted-foreground">Version</Label>
            <div className="col-span-3 text-sm text-foreground font-mono">
              v1.0.4
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-muted-foreground">Model</Label>
            <div className="col-span-3 text-sm text-foreground font-mono">
              gpt-4o-realtime-preview
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
