"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Crop,
  CheckCheck,
  X,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  Maximize,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import fabric, { FabricImage, Rect } from "fabric";

interface OriginalImageProps {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  selectable?: boolean;
  evented?: boolean;
}

const ASPECT_RATIOS = [
  { label: "Freeform", value: null, icon: Maximize },
  { label: "Square", value: 1, icon: Square, ratio: "1:1" },
  {
    label: "Widescreen",
    value: 16 / 9,
    icon: RectangleHorizontal,
    ratio: "16:9",
  },
  { label: "Portrait", value: 4 / 5, icon: RectangleVertical, ratio: "4:5" },
  { label: "Story", value: 9 / 16, icon: Smartphone, ratio: "9:16" },
];

export function CropContent() {
  const { canvasEditor, activeTool } = useCanvas();

  const [selectedImage, setSelectedImage] = useState<FabricImage | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [originalProps, setOriginalProps] = useState<OriginalImageProps | null>(
    null,
  );

  const getActiveImage = (): FabricImage | null => {
    if (!canvasEditor) return null;

    const activeObject = canvasEditor.getActiveObject();
    if (activeObject && activeObject.type === "image") {
      return activeObject as FabricImage;
    }

    const objects = canvasEditor.getObjects();
    return (
      (objects.find(
        (obj: fabric.Object) => obj.type === "image",
      ) as FabricImage) || null
    );
  };

  const removeAllCropRectangles = () => {
    if (!canvasEditor) return;

    const objects = canvasEditor.getObjects();
    const rectsToRemove = objects.filter(
      (obj: fabric.Object) => obj.type === "rect",
    );

    rectsToRemove.forEach((rect: any) => {
      canvasEditor.remove(rect);
    });

    canvasEditor.requestRenderAll();
  };

  useEffect(() => {
    if (activeTool === "crop" && canvasEditor) {
      const image = getActiveImage();
      if (image && !isCropMode) {
        initializeCropMode(image);
      }
    } else if (activeTool !== "crop" && isCropMode) {
      exitCropMode();
    }
  }, [activeTool, canvasEditor, isCropMode]);

  useEffect(() => {
    return () => {
      if (isCropMode) {
        exitCropMode();
      }
    };
  }, [isCropMode]);

  const initializeCropMode = (image: FabricImage) => {
    if (!image || isCropMode) return;

    removeAllCropRectangles();

    const original: OriginalImageProps = {
      left: image.left,
      top: image.top,
      width: image.width,
      height: image.height,
      scaleX: image.scaleX,
      scaleY: image.scaleY,
      angle: image.angle || 0,
      selectable: image.selectable,
      evented: image.evented,
    };

    setOriginalProps(original);
    setSelectedImage(image);
    setIsCropMode(true);

    image.set({
      selectable: false,
      evented: false,
    });

    if (canvasEditor) {
      createCropRectangle(image);
      canvasEditor.requestRenderAll();
    }
  };

  const createCropRectangle = (image: FabricImage) => {
    if (!canvasEditor) return;
    const bounds = image.getBoundingRect();

    const cropRectangle = new Rect({
      left: bounds.left + bounds.width * 0.1,
      top: bounds.top + bounds.height * 0.1,
      width: bounds.width * 0.8,
      height: bounds.height * 0.8,
      fill: "transparent",
      stroke: "#00bcd4",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      name: "cropRect",
      cornerColor: "#00bcd4",
      cornerSize: 12,
      transparentCorners: false,
      cornerStyle: "circle",
      borderColor: "#00bcd4",
      borderScaleFactor: 1,
    });

    cropRectangle.on("scaling", (e: any) => {
      const rect = e.target as Rect;
      if (!rect) return;

      if (selectedRatio && selectedRatio !== null) {
        const currentRatio =
          ((rect.width ?? 0) * (rect.scaleX ?? 1)) /
          ((rect.height ?? 0) * (rect.scaleY ?? 1));
        if (Math.abs(currentRatio - selectedRatio) > 0.01) {
          const newHeight =
            ((rect.width ?? 0) * (rect.scaleX ?? 1)) /
            selectedRatio /
            (rect.scaleY ?? 1);
          rect.set("height", newHeight);
        }
      }

      if (canvasEditor) {
        canvasEditor.requestRenderAll();
      }
    });

    canvasEditor.add(cropRectangle);
    canvasEditor.setActiveObject(cropRectangle);
    setCropRect(cropRectangle);
  };

  const exitCropMode = () => {
    if (!isCropMode) return;

    removeAllCropRectangles();

    setCropRect(null);

    if (selectedImage && originalProps) {
      selectedImage.set({
        selectable: originalProps.selectable,
        evented: originalProps.evented,
        left: originalProps.left,
        top: originalProps.top,
        scaleX: originalProps.scaleX,
        scaleY: originalProps.scaleY,
        angle: originalProps.angle,
      });

      if (canvasEditor) {
        canvasEditor.setActiveObject(selectedImage);
      }
    }

    setIsCropMode(false);
    setSelectedImage(null);
    setOriginalProps(null);
    setSelectedRatio(null);

    if (canvasEditor) {
      canvasEditor.requestRenderAll();
    }
  };

  const applyAspectRatio = (ratio: number | null) => {
    setSelectedRatio(ratio);

    if (!cropRect || ratio === null) return;
    if (!canvasEditor) return;

    const currentWidth = (cropRect.width ?? 0) * (cropRect.scaleX ?? 1);
    const newHeight = currentWidth / ratio;

    cropRect.set({
      height: newHeight / (cropRect.scaleY ?? 1),
      scaleY: cropRect.scaleX,
    });

    canvasEditor.requestRenderAll();
  };

  const applyCrop = async () => {
    if (!selectedImage || !cropRect || !canvasEditor) return;

    try {
      const cropBounds = cropRect.getBoundingRect();
      const imageBounds = selectedImage.getBoundingRect();

      const cropX = Math.max(0, cropBounds.left - imageBounds.left);
      const cropY = Math.max(0, cropBounds.top - imageBounds.top);
      const cropWidth = Math.min(cropBounds.width, imageBounds.width - cropX);
      const cropHeight = Math.min(
        cropBounds.height,
        imageBounds.height - cropY,
      );

      const imageScaleX = selectedImage.scaleX || 1;
      const imageScaleY = selectedImage.scaleY || 1;

      const actualCropX = cropX / imageScaleX;
      const actualCropY = cropY / imageScaleY;
      const actualCropWidth = cropWidth / imageScaleX;
      const actualCropHeight = cropHeight / imageScaleY;

      if (!selectedImage._element) {
        throw new Error("Image element not found");
      }

      const croppedImage = new FabricImage(selectedImage._element, {
        left: cropBounds.left + cropBounds.width / 2,
        top: cropBounds.top + cropBounds.height / 2,
        originX: "center",
        originY: "center",
        selectable: true,
        evented: true,
        cropX: actualCropX,
        cropY: actualCropY,
        width: actualCropWidth,
        height: actualCropHeight,
        scaleX: imageScaleX,
        scaleY: imageScaleY,
      });

      canvasEditor.remove(selectedImage);
      canvasEditor.add(croppedImage);
      canvasEditor.setActiveObject(croppedImage);
      canvasEditor.requestRenderAll();

      exitCropMode();
    } catch (error) {
      console.error("Error applying crop:", error);
      alert("Failed to apply crop. Please try again.");
      exitCropMode();
    }
  };

  const cancelCrop = () => {
    exitCropMode();
  };

  if (!canvasEditor) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  const activeImage = getActiveImage();
  if (!activeImage && !isCropMode) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Select an image to crop</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isCropMode && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground">Crop Mode Active</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Adjust the blue rectangle to set crop area
          </p>
        </div>
      )}

      {!isCropMode && activeImage && (
        <Button
          onClick={() => initializeCropMode(activeImage)}
          className="w-full"
          variant="default"
        >
          <Crop className="mr-2 h-4 w-4" />
          Start Cropping
        </Button>
      )}

      {isCropMode && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">Crop Aspect Ratios</h3>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ratio) => {
              const IconComponent = ratio.icon;
              return (
                <button
                  key={ratio.label}
                  onClick={() => applyAspectRatio(ratio.value)}
                  className={`cursor-pointer rounded-lg border p-3 text-center transition-colors ${
                    selectedRatio === ratio.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted/50"
                  }`}
                >
                  <IconComponent className="mx-auto mb-2 h-6 w-6" />
                  <div className="text-xs">{ratio.label}</div>
                  {ratio.ratio && (
                    <div className="text-xs text-muted-foreground">{ratio.ratio}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isCropMode && (
        <div className="space-y-3 border-t border-border pt-4">
          <Button onClick={applyCrop} className="w-full" variant="default">
            <CheckCheck className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>

          <Button onClick={cancelCrop} variant="outline" className="w-full">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">How to crop:</strong>
          <br />
          1. Click "Start Cropping"
          <br />
          2. Drag the blue rectangle to select crop area
          <br />
          3. Choose aspect ratio (optional)
          <br />
          4. Click "Apply Crop" to finalize
        </p>
      </div>
    </div>
  );
}
