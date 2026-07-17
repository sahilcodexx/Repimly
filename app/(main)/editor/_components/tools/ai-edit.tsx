"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  Info,
  Sparkles,
  User,
  Mountain,
  CheckCircle,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import fabric, { FabricImage } from "fabric";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Project } from "@/utils/types";

const RETOUCH_PRESETS = [
  {
    key: "ai_retouch",
    label: "AI Retouch",
    description: "Improve image quality with AI",
    icon: Sparkles,
    transform: "e-retouch",
    recommended: true,
  },
  {
    key: "ai_upscale",
    label: "AI Upscale",
    description: "Increase resolution to 16MP",
    icon: User,
    transform: "e-upscale",
    recommended: false,
  },
  {
    key: "enhance_sharpen",
    label: "Enhance & Sharpen",
    description: "AI retouch + contrast + sharpening",
    icon: Mountain,
    transform: "e-retouch,e-contrast,e-sharpen",
    recommended: false,
  },
  {
    key: "premium_quality",
    label: "Premium Quality",
    description: "AI retouch + upscale + enhancements",
    icon: Camera,
    transform: "e-retouch,e-upscale,e-contrast,e-sharpen",
    recommended: false,
  },
];

export function AIEdit({ project }: { project: Project }) {
  const { canvasEditor, setProcessingMessage } = useCanvas();
  const [selectedPreset, setSelectedPreset] = useState("ai_retouch");
  const { mutate: updateProject } = useConvexMutation(
    api.project.updateProject,
  );

  const getMainImage = (): fabric.Image | null =>
    (canvasEditor
      ?.getObjects()
      .find((obj: fabric.Object) => obj.type === "image") as fabric.Image) ||
    null;

  const buildRetouchUrl = (imageUrl: string, presetKey: string) => {
    const preset = RETOUCH_PRESETS.find((p) => p.key === presetKey);
    if (!imageUrl || !preset) return imageUrl;

    const [baseUrl, existingQuery] = imageUrl.split("?");

    if (existingQuery) {
      const params = new URLSearchParams(existingQuery);
      const existingTr = params.get("tr");

      if (existingTr) {
        return `${baseUrl}?tr=${existingTr},${preset.transform}`;
      }
    }

    return `${baseUrl}?tr=${preset.transform}`;
  };

  const applyRetouch = async () => {
    const mainImage = getMainImage();
    const selectedPresetData = RETOUCH_PRESETS.find(
      (p) => p.key === selectedPreset,
    );

    if (!mainImage || !project || !selectedPresetData) return;

    setProcessingMessage(`Enhancing image with ${selectedPresetData.label}...`);

    try {
      const currentImageUrl =
        mainImage.getSrc() || (mainImage as any)._element?.src;
      if (!currentImageUrl) {
        throw new Error("Could not get image source URL.");
      }
      const retouchedUrl = buildRetouchUrl(currentImageUrl, selectedPreset);

      const retouchedImage = await FabricImage.fromURL(retouchedUrl, {
        crossOrigin: "anonymous",
      });

      const imageProps = {
        left: mainImage.left,
        top: mainImage.top,
        originX: mainImage.originX,
        originY: mainImage.originY,
        angle: mainImage.angle,
        scaleX: mainImage.scaleX,
        scaleY: mainImage.scaleY,
        selectable: true,
        evented: true,
      };

      canvasEditor.remove(mainImage);
      retouchedImage.set(imageProps);
      canvasEditor.add(retouchedImage);
      retouchedImage.setCoords();
      canvasEditor.setActiveObject(retouchedImage);
      canvasEditor.requestRenderAll();

      await updateProject({
        projectId: project._id,
        currentImageUrl: retouchedUrl,
        canvasState: canvasEditor.toJSON(),
        activeTransformation: selectedPresetData.transform,
      });
    } catch (error) {
      console.error("Error retouching image:", error);
      alert("Failed to retouch image. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  };

  if (!canvasEditor) {
    return <div className="p-4 text-sm text-muted-foreground">Canvas not ready</div>;
  }

  const mainImage = getMainImage();
  if (!mainImage) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h3 className="mb-1 font-medium text-destructive">No Image Found</h3>
            <p className="text-sm text-destructive/80">
              Please add an image to the canvas first to use AI retouching.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveTransformations =
    project?.activeTransformation?.includes("e-retouch");
  const selectedPresetData = RETOUCH_PRESETS.find(
    (p) => p.key === selectedPreset,
  );

  return (
    <div className="space-y-5">
      {hasActiveTransformations && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            <div>
              <h3 className="mb-1 font-medium text-green-400">
                Image Enhanced
              </h3>
              <p className="text-sm text-green-300/80">
                AI enhancements have been applied to this image
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Choose Enhancement Style</h3>
        <div className="grid grid-cols-2 gap-3">
          {RETOUCH_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.key;

            return (
              <div
                key={preset.key}
                className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
                onClick={() => setSelectedPreset(preset.key)}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className={`mb-2 h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">{preset.label}</h4>
                    {preset.recommended && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                        ★
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </div>

                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button onClick={applyRetouch} className="w-full" variant="default">
        <Wand2 className="mr-2 h-4 w-4" />
        Apply {selectedPresetData?.label}
      </Button>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <Info className="h-4 w-4 text-muted-foreground" />
          How AI Retouch Works
        </h4>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• <strong className="text-foreground">AI Retouch:</strong> AI analyzes and applies optimal improvements</p>
          <p>• <strong className="text-foreground">Smart Processing:</strong> Preserves details while enhancing quality</p>
          <p>• <strong className="text-foreground">Multiple Styles:</strong> Choose enhancement that fits your image</p>
          <p>• <strong className="text-foreground">Instant Results:</strong> See improvements in seconds</p>
        </div>
      </div>
    </div>
  );
}
