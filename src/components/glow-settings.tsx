import { useState } from "react";
import { Check, Play, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OcarinaShape } from "@/components/ocarina-shape";
import { GLOW_PRESETS, saveGlowPreset, type GlowPreset } from "@/lib/glow-presets";

export function GlowSettings({ saved, onSave }: { saved: GlowPreset; onSave: (preset: GlowPreset) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [preview, setPreview] = useState(0);
  const [error, setError] = useState(false);
  return (
    <Dialog open={open} onOpenChange={next => { setOpen(next); if (next) { setDraft(saved); setPreview(0); setError(false); } }}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="glow-settings-trigger" aria-label="Glow settings" title="Glow settings"><Settings2 /></Button></DialogTrigger>
      <DialogContent className="glow-settings" aria-describedby={undefined}>
        <DialogTitle className="font-serif text-gold">Ocarina glow</DialogTitle>
        <div className="ocarina-display glow-preview" data-glow={draft} data-preview={preview > 0}>
          <OcarinaShape key={`${draft}-${preview}`} />
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Glow presets">
          {GLOW_PRESETS.map(preset => <Button key={preset.id} variant="ghost" className="glow-preset" data-glow={preset.id} aria-pressed={draft === preset.id} onClick={() => { setDraft(preset.id); setPreview(value => value + 1); setError(false); }}>
            <span className="glow-swatch" aria-hidden="true" /><span>{preset.name}</span>{draft === preset.id && <Check className="ml-auto size-4" />}
          </Button>)}
        </div>
        <div className="flex justify-between gap-3">
          <Button variant="ghost" disabled={draft === "off"} onClick={() => setPreview(value => value + 1)}><Play className="size-4" />Preview</Button>
          <Button variant="ghost" className="glow-save" onClick={() => { if (saveGlowPreset(draft)) { onSave(draft); setOpen(false); } else setError(true); }}><Save className="size-4" />Save preset</Button>
        </div>
        {error && <p role="alert" className="text-sm text-muted-foreground">Your browser couldn’t save this choice. Please allow cookies and try again.</p>}
      </DialogContent>
    </Dialog>
  );
}