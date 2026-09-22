"use client";

import React, { useState, useEffect } from "react";
import { useCanvas } from "@/context/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ban, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Light Gray", value: "#f1f5f9" },
  { label: "Soft Cream", value: "#fafaf9" },
  { label: "Warm Beige", value: "#fef3c7" },
  { label: "Soft Blue", value: "#e0f2fe" },
  { label: "Soft Mint", value: "#dcfce7" },
  { label: "Soft Rose", value: "#ffe4e6" },
  { label: "Lavender", value: "#f3e8ff" },
  { label: "Dark Slate", value: "#0f172a" },
  { label: "Black", value: "#000000" },
];

export function CanvasColorControls() {
  const { canvasEditor, saveState } = useCanvas();
  const [currentColor, setCurrentColor] = useState<string>("#ffffff");
  const [isTransparent, setIsTransparent] = useState<boolean>(false);

  useEffect(() => {
    if (!canvasEditor) return;
    const bg = canvasEditor.backgroundColor;
    if (!bg || bg === "transparent") {
      setIsTransparent(true);
      setCurrentColor("#ffffff");
    } else if (typeof bg === "string") {
      setIsTransparent(false);
      setCurrentColor(bg);
    }
  }, [canvasEditor]);

  const updateCanvasColor = (color: string, transparent = false) => {
    if (!canvasEditor) return;

    if (transparent) {
      setIsTransparent(true);
      canvasEditor.backgroundColor = "";
    } else {
      setIsTransparent(false);
      setCurrentColor(color);
      canvasEditor.backgroundColor = color;
    }

    canvasEditor.requestRenderAll();
    saveState();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Canvas Color
        </label>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {isTransparent ? "Transparent" : currentColor.toUpperCase()}
        </span>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-6 gap-1.5">
        {/* Transparent Button */}
        <button
          type="button"
          onClick={() => updateCanvasColor(currentColor, true)}
          title="Transparent"
          className={cn(
            "group relative flex size-7 cursor-pointer items-center justify-center rounded-lg border transition-transform active:scale-90",
            isTransparent
              ? "border-primary ring-2 ring-primary/40"
              : "border-border hover:border-foreground/30",
          )}
          style={{
            backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: "6px 6px",
            backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
          }}
        >
          {isTransparent && <Ban className="size-3.5 text-primary" />}
        </button>

        {/* Color Presets */}
        {PRESET_COLORS.map((preset) => {
          const isSelected =
            !isTransparent &&
            currentColor.toLowerCase() === preset.value.toLowerCase();
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => updateCanvasColor(preset.value, false)}
              title={preset.label}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-lg border transition-transform active:scale-90",
                isSelected
                  ? "border-primary ring-2 ring-primary/40 shadow-xs"
                  : "border-border/60 hover:scale-105",
              )}
              style={{ backgroundColor: preset.value }}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "size-3.5",
                    preset.value === "#000000" || preset.value === "#0f172a"
                      ? "text-white"
                      : "text-neutral-900",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border shadow-xs">
          <input
            type="color"
            value={isTransparent ? "#ffffff" : currentColor}
            onChange={(e) => updateCanvasColor(e.target.value, false)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label="Pick custom canvas color"
          />
          <div
            className="size-full"
            style={{
              backgroundColor: isTransparent ? "transparent" : currentColor,
              backgroundImage: isTransparent
                ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`
                : undefined,
              backgroundSize: "6px 6px",
            }}
          />
        </div>
        <Input
          value={isTransparent ? "transparent" : currentColor}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "transparent") {
              updateCanvasColor(currentColor, true);
            } else {
              updateCanvasColor(val, false);
            }
          }}
          placeholder="#ffffff"
          className="h-8 flex-1 text-xs font-mono tabular-nums"
        />
        {isTransparent ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateCanvasColor("#ffffff", false)}
            className="h-8 px-2 text-xs"
          >
            Reset
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateCanvasColor("#ffffff", false)}
            disabled={currentColor.toLowerCase() === "#ffffff"}
            className="h-8 px-2 text-xs"
          >
            White
          </Button>
        )}
      </div>
    </div>
  );
}
