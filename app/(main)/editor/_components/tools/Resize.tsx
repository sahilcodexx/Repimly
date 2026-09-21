"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Expand, Lock, Unlock } from "lucide-react";
import { useCanvas } from "@/context/context";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Project } from "@/utils/types";
import { cn } from "@/lib/utils";

interface AspectRatio {
  name: string;
  ratio: [number, number];
  label: string;
}

const ASPECT_RATIOS: AspectRatio[] = [
  { name: "Instagram Story", ratio: [9, 16], label: "9:16" },
  { name: "Instagram Post", ratio: [1, 1], label: "1:1" },
  { name: "Youtube Thumbnail", ratio: [16, 9], label: "16:9" },
  { name: "Portrait", ratio: [2, 3], label: "2:3" },
  { name: "Facebook Cover", ratio: [851, 315], label: "2.7:1" },
  { name: "Twitter Header", ratio: [3, 1], label: "3:1" },
];

export function ResizeContent({ project }: { project: Project }) {
  const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
  const [newWidth, setNewWidth] = useState(project?.width || 800);
  const [newHeight, setNewHeight] = useState(project?.height || 600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const {
    mutate: updateProject,
    data,
    isLoading,
  } = useConvexMutation(api.project.updateProject);

  useEffect(() => {
    if (!isLoading && data) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 500);
    }
  }, [data, isLoading]);

  const calculateAspectRatioDimensions = (ratio: [number, number]) => {
    if (!project) return { width: 0, height: 0 };

    const [ratioW, ratioH] = ratio;
    const originalArea = project.width * project.height;

    const aspectRatio = ratioW / ratioH;
    const newHeight = Math.sqrt(originalArea / aspectRatio);
    const newWidth = newHeight * aspectRatio;

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  };

  const handleWidthChange = (value: string) => {
    const width = parseInt(value) || 0;
    setNewWidth(width);

    if (lockAspectRatio && project) {
      const ratio = project.height / project.width;
      setNewHeight(Math.round(width * ratio));
    }
    setSelectedPreset(null);
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value) || 0;
    setNewHeight(height);

    if (lockAspectRatio && project) {
      const ratio = project.width / project.height;
      setNewWidth(Math.round(height * ratio));
    }
    setSelectedPreset(null);
  };

  const applyAspectRatio = (aspectRatio: {
    name: string;
    ratio: [number, number];
    label: string;
  }) => {
    const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio);
    setNewWidth(dimensions.width);
    setNewHeight(dimensions.height);
    setSelectedPreset(aspectRatio.name);
  };

  const handleApplyResize = async () => {
    if (
      !canvasEditor ||
      !project ||
      (newWidth === project.width && newHeight === project.height)
    ) {
      return;
    }

    setProcessingMessage("Resizing canvas...");

    try {
      const canvasState = canvasEditor.toJSON();
      canvasState.width = newWidth;
      canvasState.height = newHeight;

      await updateProject({
        projectId: project._id,
        width: newWidth,
        height: newHeight,
        canvasState: canvasState,
      });
    } catch (error) {
      console.error("Error resizing canvas:", error);
      alert("Failed to resize canvas. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  };

  if (!canvasEditor || !project) {
    return (
      <p className="text-xs text-muted-foreground">Canvas not ready</p>
    );
  }

  const hasChanges = newWidth !== project.width || newHeight !== project.height;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-muted/40 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Current
        </p>
        <p className="mt-0.5 text-[13px] tabular-nums text-foreground">
          {project.width} × {project.height}
          <span className="ml-1 text-[11px] text-muted-foreground">px</span>
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Dimensions
          </p>
          <button
            type="button"
            onClick={() => setLockAspectRatio(!lockAspectRatio)}
            aria-label={lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
            className={cn(
              "flex size-6 items-center justify-center rounded transition-colors duration-100 ease-out active:scale-[0.97]",
              lockAspectRatio
                ? "text-[#0d99ff]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {lockAspectRatio ? (
              <Lock className="size-3" />
            ) : (
              <Unlock className="size-3" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">W</label>
            <Input
              type="number"
              value={newWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              min="100"
              max="5000"
              className="h-8 text-[13px] tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">H</label>
            <Input
              type="number"
              value={newHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              min="100"
              max="5000"
              className="h-8 text-[13px] tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Presets
        </p>
        <div className="flex flex-col gap-0.5">
          {ASPECT_RATIOS.map((aspectRatio) => {
            const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio);
            const isSelected = selectedPreset === aspectRatio.name;
            return (
              <button
                key={aspectRatio.name}
                type="button"
                onClick={() => applyAspectRatio(aspectRatio)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors duration-100 ease-out active:scale-[0.99]",
                  isSelected
                    ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="text-[13px] font-medium">{aspectRatio.name}</span>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    isSelected ? "text-[#0d99ff]/70" : "text-muted-foreground",
                  )}
                >
                  {aspectRatio.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {hasChanges && (
        <p className="text-[11px] text-muted-foreground">
          New size:{" "}
          <span className="tabular-nums text-foreground">
            {newWidth} × {newHeight}
          </span>
        </p>
      )}

      <Button
        onClick={handleApplyResize}
        disabled={!hasChanges || !!processingMessage}
        className="h-8 w-full gap-1.5 rounded-md bg-[#0d99ff] text-xs font-medium text-white shadow-none hover:bg-[#0d99ff]/90"
      >
        <Expand className="size-3.5" />
        Apply Resize
      </Button>
    </div>
  );
}
