"use client";

import { useEffect } from "react";
import { useCanvas } from "@/context/context";

const GRID_SIZE = 20;
const GRID_LINE_COLOR = "rgba(128,128,128,0.08)";

export function useGridSnap() {
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
}
