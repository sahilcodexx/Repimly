"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/context";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Image as ImageIcon,
  Type,
  Square,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";
import fabric from "fabric";

interface LayerItem {
  object: fabric.Object;
  type: string;
  visible: boolean;
  locked: boolean;
  label: string;
}

export function LayerPanel() {
  const { canvasEditor } = useCanvas();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getObjectId = (obj: fabric.Object): string => {
    if (!(obj as any)._layerId) {
      (obj as any)._layerId = `lyr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    return (obj as any)._layerId;
  };

  const refreshLayers = useCallback(() => {
    if (!canvasEditor) {
      setLayers([]);
      setSelectedId(null);
      return;
    }

    const objects = canvasEditor.getObjects().slice().reverse();

    const items: LayerItem[] = objects.map((obj: fabric.Object) => {
      getObjectId(obj);
      return {
        object: obj,
        type: obj.type,
        visible: obj.visible !== false,
        locked: obj.selectable === false || obj.evented === false,
        label: (obj as any).name || (obj.type === "i-text" ? (obj as any).text || "Text" : obj.type.charAt(0).toUpperCase() + obj.type.slice(1)),
      };
    });

    setLayers(items);

    const active = canvasEditor.getActiveObject();
    setSelectedId(active ? getObjectId(active) : null);
  }, [canvasEditor]);

  useEffect(() => {
    if (!canvasEditor) return;
    refreshLayers();

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ];

    events.forEach((event) => canvasEditor.on(event, refreshLayers));

    return () => {
      events.forEach((event) => canvasEditor.off(event, refreshLayers));
    };
  }, [canvasEditor, refreshLayers]);

  const selectLayer = (layer: LayerItem) => {
    if (!canvasEditor || layer.locked) return;
    canvasEditor.discardActiveObject();
    canvasEditor.setActiveObject(layer.object);
    canvasEditor.requestRenderAll();
  };

  const toggleVisibility = (e: React.MouseEvent, layer: LayerItem) => {
    e.stopPropagation();
    if (!canvasEditor) return;
    layer.object.set("visible", !layer.visible);
    canvasEditor.requestRenderAll();
    refreshLayers();
  };

  const toggleLock = (e: React.MouseEvent, layer: LayerItem) => {
    e.stopPropagation();
    if (!canvasEditor) return;
    const isLocked = !layer.object.selectable && !layer.object.evented;
    layer.object.set({ selectable: isLocked, evented: isLocked });
    canvasEditor.requestRenderAll();
    refreshLayers();
  };

  const deleteLayer = (e: React.MouseEvent, layer: LayerItem) => {
    e.stopPropagation();
    if (!canvasEditor) return;
    canvasEditor.remove(layer.object);
    canvasEditor.discardActiveObject();
    canvasEditor.requestRenderAll();
    refreshLayers();
  };

  const reorderLayer = (e: React.MouseEvent, layer: LayerItem, direction: "up" | "down") => {
    e.stopPropagation();
    if (!canvasEditor) return;
    const objects = canvasEditor.getObjects();
    const idx = objects.indexOf(layer.object);
    const target = direction === "up" ? idx + 1 : idx - 1;
    if (target < 0 || target >= objects.length) return;
    canvasEditor.moveTo(layer.object, target);
    canvasEditor.requestRenderAll();
    refreshLayers();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-3.5 w-3.5" />;
      case "i-text":
      case "textbox": return <Type className="h-3.5 w-3.5" />;
      default: return <Square className="h-3.5 w-3.5" />;
    }
  };

  if (!canvasEditor) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div>
          <h3 className="mb-1 text-sm font-medium text-foreground">Layers</h3>
          <p className="text-xs text-muted-foreground">
            {layers.length} object{layers.length !== 1 ? "s" : ""} on canvas
          </p>
        </div>

        {layers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Layers className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">No layers yet</p>
            <p className="text-xs text-muted-foreground/60">
              Add images or text to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {layers.map((layer) => {
              const id = getObjectId(layer.object);
              const isSelected = selectedId === id;
              const idx = canvasEditor.getObjects().indexOf(layer.object);

              return (
                <div
                  key={id}
                  onClick={() => selectLayer(layer)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50"
                  } ${layer.locked ? "opacity-50" : ""}`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {getTypeIcon(layer.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {layer.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {idx + 1} &middot; {layer.type === "i-text" ? "Text" : layer.type}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={(e) => reorderLayer(e, layer, "up")}
                      disabled={idx === canvasEditor.getObjects().length - 1}
                      className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-20"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => reorderLayer(e, layer, "down")}
                      disabled={idx === 0}
                      className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-20"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={(e) => toggleVisibility(e, layer)}
                      className="rounded p-1 text-muted-foreground/60 hover:text-foreground"
                      title={layer.visible ? "Hide" : "Show"}
                    >
                      {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={(e) => toggleLock(e, layer)}
                      className="rounded p-1 text-muted-foreground/60 hover:text-foreground"
                      title={layer.locked ? "Unlock" : "Lock"}
                    >
                      {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={(e) => deleteLayer(e, layer)}
                      className="rounded p-1 text-muted-foreground/60 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
