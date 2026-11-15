import { useState, type CSSProperties } from "react";
import { Check, Play, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OcarinaShape } from "@/components/ocarina-shape";
import { Slider } from "@/components/ui/slider";
import { GLOW_PRESETS, saveGlowPreset, saveCustomGlow, customGlowTokens, type CustomGlow, type GlowPreset } from "@/lib/glow-presets";

export function GlowSettings({ saved, custom, onSave }: { saved: GlowPreset; custom: CustomGlow; onSave: (preset: GlowPreset, custom: CustomGlow) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [preview, setPreview] = useState(0);
  const [error, setError] = useState(false);
  const [customDraft, setCustomDraft] = useState(custom);
  const updateCustom = (patch: Partial<CustomGlow>) => { setCustomDraft(value => ({ ...value, ...patch })); setDraft("custom"); setError(false); setPreview(value => value + 1); };
  const controls = [
    { key: "spread", label: "Spread", min: 0, max: 80, step: 1, unit: "px" },
    { key: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%" },
    { key: "fadeIn", label: "Fade in", min: 0.05, max: 2, step: 0.01, unit: "s" },
    { key: "fadeOut", label: "Fade out", min: 0.1, max: 5, step: 0.01, unit: "s" },
  ] as const;
  return (
    <Dialog open={open} onOpenChange={next => { setOpen(next); if (next) { setDraft(saved); setCustomDraft(custom); setPreview(0); setError(false); } }}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="glow-settings-trigger" aria-label="Glow settings" title="Glow settings"><Settings2 /></Button></DialogTrigger>
      <DialogContent className="glow-settings" aria-describedby={undefined}>
        <DialogTitle className="font-serif text-gold">Ocarina glow</DialogTitle>
        <div className="ocarina-display glow-preview" data-glow={draft} data-preview={preview > 0} style={draft === "custom" ? customGlowTokens(customDraft) as CSSProperties : undefined}>
          <OcarinaShape key={`${draft}-${preview}`} />
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Glow presets">
          {GLOW_PRESETS.map(preset => <Button key={preset.id} variant="ghost" className="glow-preset" data-glow={preset.id} aria-pressed={draft === preset.id} onClick={() => { setDraft(preset.id); setPreview(value => value + 1); setError(false); }}>
            <span className="glow-swatch" aria-hidden="true" /><span>{preset.name}</span>{draft === preset.id && <Check className="ml-auto size-4" />}
          </Button>)}
          <Button variant="ghost" className="glow-preset col-span-2" data-glow="custom" style={customGlowTokens(customDraft) as CSSProperties} aria-pressed={draft === "custom"} onClick={() => { setDraft("custom"); setPreview(value => value + 1); }}><span className="glow-swatch" aria-hidden="true" />Custom{draft === "custom" && <Check className="ml-auto size-4" />}</Button>
        </div>
        <fieldset className="glow-custom-controls">
          <legend className="mb-2 text-sm text-gold">Custom glow</legend>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="glow-color">Color</label>
            <input id="glow-color" type="color" aria-label="Glow color" value={customDraft.color} onChange={event => updateCustom({ color: event.target.value })} className="glow-color-input" />
          </div>
          {controls.map(control => <div key={control.key} className="glow-control">
            <div className="flex justify-between gap-3 text-sm"><span id={`glow-${control.key}`}>{control.label}</span><output>{customDraft[control.key]}{control.unit}</output></div>
            <Slider aria-labelledby={`glow-${control.key}`} min={control.min} max={control.max} step={control.step} value={[customDraft[control.key]]} onValueChange={values => { const value = values[0]; if (value !== undefined) updateCustom({ [control.key]: value }); }} />
          </div>)}
        </fieldset>
        <div className="flex justify-between gap-3">
          <Button variant="ghost" disabled={draft === "off"} onClick={() => setPreview(value => value + 1)}><Play className="size-4" />Preview</Button>
          <Button variant="ghost" className="glow-save" onClick={() => { if ((draft !== "custom" || saveCustomGlow(customDraft)) && saveGlowPreset(draft)) { onSave(draft, draft === "custom" ? customDraft : custom); setOpen(false); } else setError(true); }}><Save className="size-4" />Save preset</Button>
        </div>
        {error && <p role="alert" className="text-sm text-muted-foreground">Your browser couldn’t save this choice. Please allow cookies and try again.</p>}
      </DialogContent>
    </Dialog>
  );
}