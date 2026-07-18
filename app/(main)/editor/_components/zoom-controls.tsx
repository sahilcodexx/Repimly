"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Grid3x3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCanvas } from "@/context/context";
import { Project } from "@/utils/types";

const ZOOM_MIN = 10;
const ZOOM_MAX = 500;

export function ZoomControls({ project, containerRef }: { project: Project; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { canvasEditor, showGrid, setShowGrid } = useCanvas();
  const [zoom, setZoom] = useState(100);
  const isUpdatingRef = useRef(false);

  const getViewportScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const container = containerRef.current;
    const cw = container.clientWidth - 40;
    const ch = container.clientHeight - 40;
    return Math.min(cw / project.width, ch / project.height, 1);
  }, [containerRef, project]);

  const applyZoom = useCallback((percent: number) => {
    if (!canvasEditor) return;
    const value = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, percent)) / 100;
    canvasEditor.setDimensions(
      { width: project.width * value, height: project.height * value },
      { backstoreOnly: false },
    );
    canvasEditor.setZoom(value);
    canvasEditor.calcOffset();
    canvasEditor.requestRenderAll();
    setZoom(Math.round(percent));
  }, [canvasEditor, project]);

  const syncZoom = useCallback(() => {
    if (!canvasEditor || isUpdatingRef.current) return;
    const current = canvasEditor.getZoom();
    setZoom(Math.round(current * 100));
  }, [canvasEditor]);

  useEffect(() => {
    if (!canvasEditor) return;
    syncZoom();

    const handleMouseWheel = (e: any) => {
      const delta = e.e.deltaY;
      const newZoom = zoom + (delta > 0 ? -10 : 10);
      applyZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom)));
    };

    canvasEditor.on("mouse:wheel", handleMouseWheel);
    return () => {
      canvasEditor.off("mouse:wheel", handleMouseWheel);
    };
  }, [canvasEditor, syncZoom, applyZoom, zoom]);

  const handleSliderChange = (value: number[]) => {
    isUpdatingRef.current = true;
    applyZoom(value[0]);
    setTimeout(() => { isUpdatingRef.current = false; }, 50);
  };

  const handleFitToScreen = () => {
    const scale = getViewportScale();
    applyZoom(Math.round(scale * 100));
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-30" style={{ transform: "translateX(calc(-50% + 160px))" }}>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-sm backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => applyZoom(zoom - 10)}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>

        <Slider
          value={[zoom]}
          onValueChange={handleSliderChange}
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={1}
          className="w-24"
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => applyZoom(zoom + 10)}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>

        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
          {zoom}%
        </span>

        <span className="h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showGrid ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showGrid ? "Hide grid" : "Show grid"}
          </TooltipContent>
        </Tooltip>

        <span className="h-4 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={handleFitToScreen}
        >
          <Maximize className="h-3.5 w-3.5" />
          Fit
        </Button>
      </div>
    </div>
  );
}
