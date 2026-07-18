"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  GripVertical,
  Layers,
} from "lucide-react";
import fabric from "fabric";
import { cn } from "@/lib/utils";

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
        label:
          (obj as any).name ||
          (obj.type === "i-text"
            ? (obj as any).text || "Text"
            : obj.type.charAt(0).toUpperCase() + obj.type.slice(1)),
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

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex || !canvasEditor) return;

    const objects = canvasEditor.getObjects();
    const obj = objects[dragIndex];
    if (obj) {
      canvasEditor.moveTo(obj, dropIndex);
      canvasEditor.requestRenderAll();
      refreshLayers();
    }
    setDragIndex(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="size-3.5" />;
      case "i-text":
      case "textbox":
        return <Type className="size-3.5" />;
      default:
        return <Square className="size-3.5" />;
    }
  };

  if (!canvasEditor) {
    return <p className="text-xs text-muted-foreground">Canvas not ready</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {layers.length} layer{layers.length !== 1 ? "s" : ""}
      </p>

      {layers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Layers className="size-7 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No layers yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {layers.map((layer) => {
            const id = getObjectId(layer.object);
            const isSelected = selectedId === id;
            const idx = canvasEditor.getObjects().indexOf(layer.object);
            const isDragging = dragIndex === idx;

            return (
              <div
                key={id}
                draggable={!layer.locked}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => selectLayer(layer)}
                className={cn(
                  "group flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 transition-colors duration-100 ease-out",
                  isSelected
                    ? "bg-[#0d99ff]/10"
                    : "hover:bg-muted",
                  layer.locked && "opacity-50",
                  isDragging && "opacity-40",
                )}
              >
                <div className="cursor-grab text-muted-foreground/30 group-hover:text-muted-foreground">
                  <GripVertical className="size-3" />
                </div>

                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground",
                    isSelected ? "text-[#0d99ff]" : "",
                  )}
                >
                  {getTypeIcon(layer.type)}
                </div>

                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-[12px] font-medium",
                    isSelected ? "text-[#0d99ff]" : "text-foreground",
                  )}
                >
                  {layer.label}
                </p>

                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => toggleVisibility(e, layer)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? (
                      <Eye className="size-3" />
                    ) : (
                      <EyeOff className="size-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleLock(e, layer)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {layer.locked ? (
                      <Lock className="size-3" />
                    ) : (
                      <Unlock className="size-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteLayer(e, layer)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Delete layer"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
