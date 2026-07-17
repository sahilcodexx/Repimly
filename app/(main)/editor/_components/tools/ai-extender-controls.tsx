"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { useCanvas } from "@/context/context";
import fabric, { FabricImage } from "fabric";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Project } from "@/utils/types";

type Direction = "top" | "bottom" | "left" | "right";

const DIRECTIONS: { key: Direction; label: string; icon: React.ElementType }[] =
  [
    { key: "top", label: "Top", icon: ArrowUp },
    { key: "bottom", label: "Bottom", icon: ArrowDown },
    { key: "left", label: "Left", icon: ArrowLeft },
    { key: "right", label: "Right", icon: ArrowRight },
  ];

const FOCUS_MAP: Record<Direction, string> = {
  left: "fo-right",
  right: "fo-left",
  top: "fo-bottom",
  bottom: "fo-top",
};

export function AIExtenderControls({ project }: { project: Project }) {
  const { canvasEditor, setProcessingMessage } = useCanvas();
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(
    null,
  );
  const [extensionAmount, setExtensionAmount] = useState(200);
  const { mutate: updateProject } = useConvexMutation(
    api.project.updateProject,
  );

  const getMainImage = (): fabric.Image | null =>
    (canvasEditor
      ?.getObjects()
      .find((obj: fabric.Object) => obj.type === "image") as fabric.Image) ||
    null;

  const getImageSrc = (image: fabric.Image | null): string =>
    image?.getSrc() ?? (image as any)?._element?.src ?? "";

  const hasBackgroundRemoval = () => {
    const imageSrc = getImageSrc(getMainImage());
    return (
      imageSrc?.includes("e-bgremove") ||
      imageSrc?.includes("e-removedotbg") ||
      imageSrc?.includes("e-changebg")
    );
  };

  const calculateDimensions = () => {
    const image = getMainImage();
    if (!image || !selectedDirection) return { width: 0, height: 0 };

    const currentWidth = (image.width || 0) * (image.scaleX || 1);
    const currentHeight = (image.height || 0) * (image.scaleY || 1);

    const isHorizontal = ["left", "right"].includes(selectedDirection);
    const isVertical = ["top", "bottom"].includes(selectedDirection);

    return {
      width: Math.round(currentWidth + (isHorizontal ? extensionAmount : 0)),
      height: Math.round(currentHeight + (isVertical ? extensionAmount : 0)),
    };
  };

  const buildExtensionUrl = (imageUrl: string) => {
    if (!imageUrl || !selectedDirection) return imageUrl;

    const baseUrl = imageUrl.split("?")[0];
    const { width, height } = calculateDimensions();

    const transformations = [
      "bg-genfill",
      `w-${width}`,
      `h-${height}`,
      "cm-pad_resize",
    ];

    const focus = FOCUS_MAP[selectedDirection];
    if (focus) transformations.push(focus);

    return `${baseUrl}?tr=${transformations.join(",")}`;
  };

  const selectDirection = (direction: Direction) => {
    setSelectedDirection((prev) => (prev === direction ? null : direction));
  };

  const applyExtension = async () => {
    const mainImage = getMainImage();
    if (!mainImage || !selectedDirection) return;

    setProcessingMessage("Extending image with AI...");

    try {
      const currentImageUrl = getImageSrc(mainImage);
      const extendedUrl = buildExtensionUrl(currentImageUrl);

      const extendedImage = await FabricImage.fromURL(extendedUrl, {
        crossOrigin: "anonymous",
      });

      const scale = Math.min(
        project.width / (extendedImage.width || 1),
        project.height / (extendedImage.height || 1),
        1,
      );

      extendedImage.set({
        left: project.width / 2,
        top: project.height / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
      });

      if (mainImage) {
        canvasEditor.remove(mainImage);
      }
      canvasEditor.add(extendedImage);
      canvasEditor.setActiveObject(extendedImage);
      canvasEditor.requestRenderAll();

      await updateProject({
        projectId: project._id,
        currentImageUrl: extendedUrl,
        canvasState: canvasEditor.toJSON(),
      });

      setSelectedDirection(null);
    } catch (error) {
      console.error("Error applying extension:", error);
      alert("Failed to extend image. Please try again.");
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
      <div className="p-4 text-sm text-muted-foreground">Please add an image first</div>
    );
  }

  if (hasBackgroundRemoval()) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
        <h3 className="mb-2 font-medium text-destructive">
          Extension Not Available
        </h3>
        <p className="text-sm text-destructive/80">
          AI Extension cannot be used on images with removed backgrounds. Use
          extension first, then remove background.
        </p>
      </div>
    );
  }

  const { width: newWidth, height: newHeight } = calculateDimensions();
  const currentImage = getMainImage();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">Select Extension Direction</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Choose one direction to extend your image
        </p>
        <div className="grid grid-cols-2 gap-3">
          {DIRECTIONS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => selectDirection(key)}
              variant={selectedDirection === key ? "default" : "outline"}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-foreground">Extension Amount</label>
          <span className="text-xs tabular-nums text-muted-foreground">{extensionAmount}px</span>
        </div>
        <Slider
          value={[extensionAmount]}
          onValueChange={([value]) => setExtensionAmount(value)}
          min={50}
          max={500}
          step={25}
          className="w-full"
          disabled={!selectedDirection}
        />
      </div>

      {selectedDirection && currentImage && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <h4 className="mb-2 text-sm font-medium text-foreground">
            Extension Preview
          </h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>
              Current:{" "}
              {Math.round(
                (currentImage.width || 0) * (currentImage.scaleX || 1),
              )}{" "}
              ×{" "}
              {Math.round(
                (currentImage.height || 0) * (currentImage.scaleY || 1),
              )}
              px
            </div>
            <div>
              Extended: {newWidth} × {newHeight}px
            </div>
            <div>
              Canvas: {project.width} × {project.height}px (unchanged)
            </div>
            <div>
              Direction:{" "}
              {DIRECTIONS.find((d) => d.key === selectedDirection)?.label}
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={applyExtension}
        disabled={!selectedDirection}
        className="w-full"
        variant="default"
      >
        <Wand2 className="mr-2 h-4 w-4" />
        Apply AI Extension
      </Button>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">How it works:</strong> Select one direction → Set amount →
          Apply extension. AI will intelligently fill the new area in that
          direction.
        </p>
      </div>
    </div>
  );
}
