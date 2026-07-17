"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Expand, Lock, Unlock, Monitor } from "lucide-react";
import { useCanvas } from "@/context/context";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Project } from "@/utils/types";

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

  const calculateViewportScale = () => {
    if (!canvasEditor) return 1;
    const container = canvasEditor.getElement().parentNode;
    if (!container) return 1;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const scaleX = containerWidth / newWidth;
    const scaleY = containerHeight / newHeight;
    return Math.min(scaleX, scaleY, 1);
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
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  const hasChanges = newWidth !== project.width || newHeight !== project.height;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <h4 className="mb-1 text-xs font-medium text-muted-foreground">Current Size</h4>
        <p className="text-sm text-foreground">
          {project.width} × {project.height} pixels
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Custom Size</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLockAspectRatio(!lockAspectRatio)}
            className="h-7 w-7 p-0 text-muted-foreground"
          >
            {lockAspectRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Width</label>
            <Input
              type="number"
              value={newWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              min="100"
              max="5000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Height</label>
            <Input
              type="number"
              value={newHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              min="100"
              max="5000"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {lockAspectRatio ? "Aspect ratio locked" : "Free resize"}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Aspect Ratios</h3>
        <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto">
          {ASPECT_RATIOS.map((aspectRatio) => {
            const dimensions = calculateAspectRatioDimensions(
              aspectRatio.ratio,
            );
            return (
              <Button
                key={aspectRatio.name}
                variant={
                  selectedPreset === aspectRatio.name ? "default" : "outline"
                }
                size="sm"
                onClick={() => applyAspectRatio(aspectRatio)}
                className="h-auto justify-between py-2"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{aspectRatio.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {dimensions.width} × {dimensions.height} ({aspectRatio.label})
                  </div>
                </div>
                <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            );
          })}
        </div>
      </div>

      {hasChanges && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">New Size Preview</h4>
          <p className="text-xs text-foreground">
            {newWidth} × {newHeight} pixels
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {newWidth > project.width || newHeight > project.height
              ? "Canvas will be expanded"
              : "Canvas will be cropped"}
          </p>
        </div>
      )}

      <Button
        onClick={handleApplyResize}
        disabled={!hasChanges || !!processingMessage}
        className="w-full gap-2"
      >
        <Expand className="h-4 w-4" />
        Apply Resize
      </Button>
    </div>
  );
}
