"use client";

import React, { useEffect } from "react";
import { useCanvas } from "@/context/context";

const GRID_SIZE = 20;
const GRID_LINE_COLOR = "rgba(128,128,128,0.08)";

export function GridOverlay() {
  const { canvasEditor, showGrid } = useCanvas();

  useEffect(() => {
    if (!canvasEditor) return;

    const snapToGrid = (e: any) => {
      if (!showGrid) return;
      const obj = e.target;
      if (!obj) return;

      const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

      const left = snap(obj.left);
      const top = snap(obj.top);

      if (left !== obj.left || top !== obj.top) {
        obj.set({ left, top });
        canvasEditor.requestRenderAll();
      }
    };

    canvasEditor.on("object:moving", snapToGrid);
    return () => {
      canvasEditor.off("object:moving", snapToGrid);
    };
  }, [canvasEditor, showGrid]);

  if (!showGrid) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        backgroundImage: `
          linear-gradient(${GRID_LINE_COLOR} 1px, transparent 1px),
          linear-gradient(90deg, ${GRID_LINE_COLOR} 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    />
  );
}
