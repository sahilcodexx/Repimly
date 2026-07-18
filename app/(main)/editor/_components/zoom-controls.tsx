"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Maximize, Grid3x3, Minus, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvas } from "@/context/context";
import { Project } from "@/utils/types";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 10;
const ZOOM_MAX = 500;

export function ZoomControls({
  project,
  containerRef,
}: {
  project: Project;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { canvasEditor, showGrid, setShowGrid } = useCanvas();
  const [zoom, setZoom] = useState(100);
  const isUpdatingRef = useRef(false);

  const getViewportScale = useCallback(() => {
    if (!containerRef.current) return 0.5;
    const container = containerRef.current;
    const cw = container.clientWidth - 48;
    const ch = container.clientHeight - 48;
    if (cw <= 0 || ch <= 0) return 0.5;
    return Math.max(Math.min(cw / project.width, ch / project.height, 1), 0.05);
  }, [containerRef, project]);

  const applyZoom = useCallback(
    (percent: number) => {
      if (!canvasEditor) return;
      const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, percent));
      const value = clamped / 100;
      canvasEditor.setDimensions(
        { width: project.width * value, height: project.height * value },
        { backstoreOnly: false },
      );
      canvasEditor.setZoom(value);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();
      setZoom(Math.round(clamped));
    },
    [canvasEditor, project],
  );

  const syncZoom = useCallback(() => {
    if (!canvasEditor || isUpdatingRef.current) return;
    const current = canvasEditor.getZoom();
    if (!Number.isFinite(current) || current <= 0) return;
    setZoom(Math.round(current * 100));
  }, [canvasEditor]);

  useEffect(() => {
    if (!canvasEditor) return;
    syncZoom();

    const handleMouseWheel = (opt: any) => {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      e.stopPropagation();
      const current = canvasEditor.getZoom() * 100;
      const next = current + (e.deltaY > 0 ? -10 : 10);
      applyZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next)));
    };

    canvasEditor.on("mouse:wheel", handleMouseWheel);
    return () => {
      canvasEditor.off("mouse:wheel", handleMouseWheel);
    };
  }, [canvasEditor, syncZoom, applyZoom]);

  useEffect(() => {
    if (!canvasEditor) return;
    const id = setInterval(syncZoom, 200);
    return () => clearInterval(id);
  }, [canvasEditor, syncZoom]);

  const handleFitToScreen = () => {
    const scale = getViewportScale();
    applyZoom(Math.round(scale * 100));
  };

  return (
    <div className="absolute bottom-3 right-3 z-30">
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-1 shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => applyZoom(zoom - 10)}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:opacity-30"
            >
              <Minus className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>

        <button
          type="button"
          onClick={handleFitToScreen}
          className="min-w-[48px] rounded-md px-1.5 py-1 text-center text-[11px] tabular-nums text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97]"
        >
          {zoom}%
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => applyZoom(zoom + 10)}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:opacity-30"
            >
              <Plus className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>

        <div className="mx-0.5 h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              aria-label={showGrid ? "Hide grid" : "Show grid"}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors duration-100 ease-out active:scale-[0.97]",
                showGrid
                  ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Grid3x3 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{showGrid ? "Hide grid" : "Show grid"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleFitToScreen}
              aria-label="Fit to screen"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97]"
            >
              <Maximize className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Fit to screen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
