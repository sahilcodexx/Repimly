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
  Image as ImageIcon,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import fabric, { FabricImage, Rect } from "fabric";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  { label: "Freeform", value: null, icon: Maximize, ratio: "Custom" },
  { label: "Square", value: 1, icon: Square, ratio: "1:1" },
  { label: "Widescreen", value: 16 / 9, icon: RectangleHorizontal, ratio: "16:9" },
  { label: "Portrait", value: 4 / 5, icon: RectangleVertical, ratio: "4:5" },
  { label: "Story", value: 9 / 16, icon: Smartphone, ratio: "9:16" },
  { label: "Classic", value: 2 / 3, icon: RectangleVertical, ratio: "2:3" },
];

export function CropContent() {
  const { canvasEditor, activeTool, saveState } = useCanvas();

  const getActiveImage = (): FabricImage | null => {
    if (!canvasEditor) return null;

    const activeObject = canvasEditor.getActiveObject();
    if (
      activeObject &&
      (activeObject.type === "image" ||
        activeObject.type === "Image" ||
        activeObject instanceof FabricImage)
    ) {
      return activeObject as FabricImage;
    }

    const objects = canvasEditor.getObjects();
    return (
      (objects.find(
        (obj: fabric.Object) =>
          obj.type === "image" ||
          obj.type === "Image" ||
          obj instanceof FabricImage,
      ) as FabricImage) || null
    );
  };

  const [selectedImage, setSelectedImage] = useState<FabricImage | null>(() => getActiveImage());
  const [isCropMode, setIsCropMode] = useState<boolean>(() => {
    if (activeTool !== "crop" || !canvasEditor) return false;
    return !!getActiveImage();
  });
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [originalProps, setOriginalProps] = useState<OriginalImageProps | null>(null);

  const removeAllCropRectangles = () => {
    if (!canvasEditor) return;

    const objects = canvasEditor.getObjects();
    const rectsToRemove = objects.filter(
      (obj: fabric.Object) => (obj as any).name === "cropRect",
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
      stroke: "#0d99ff",
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      selectable: true,
      evented: true,
      name: "cropRect",
      cornerColor: "#0d99ff",
      cornerStrokeColor: "#ffffff",
      cornerSize: 8,
      transparentCorners: false,
      cornerStyle: "circle",
      borderColor: "#0d99ff",
      borderScaleFactor: 1.5,
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
      const cropHeight = Math.min(cropBounds.height, imageBounds.height - cropY);

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
      saveState();

      exitCropMode();
      toast.success("Image cropped successfully");
    } catch (error) {
      console.error("Error applying crop:", error);
      toast.error("Failed to crop image. Please try again.");
      exitCropMode();
    }
  };

  const cancelCrop = () => {
    exitCropMode();
  };

  if (!canvasEditor) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  const activeImage = getActiveImage();

  if (!activeImage && !isCropMode) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ImageIcon className="size-4" />
        </div>
        <p className="text-xs font-medium text-foreground">No image selected</p>
        <p className="text-[11px] text-muted-foreground">
          Click an image on the canvas to start cropping.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header status */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Crop Tool
        </p>
        {isCropMode ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0d99ff]">
            <span className="size-1.5 rounded-full bg-[#0d99ff] animate-pulse" />
            Active
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Ready</span>
        )}
      </div>

      {/* Start Button if not in crop mode */}
      {!isCropMode && activeImage && (
        <Button
          type="button"
          onClick={() => initializeCropMode(activeImage)}
          className="h-8 w-full gap-1.5 rounded-md bg-[#0d99ff] text-xs font-medium text-white shadow-none hover:bg-[#0d99ff]/90 cursor-pointer"
        >
          <Crop className="size-3.5" />
          Enter Crop Mode
        </Button>
      )}

      {/* Crop Controls when active */}
      {isCropMode && (
        <>
          {/* Aspect Ratios Section */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Aspect Ratio
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {ASPECT_RATIOS.map((ratio) => {
                const IconComponent = ratio.icon;
                const isSelected = selectedRatio === ratio.value;
                return (
                  <button
                    key={ratio.label}
                    type="button"
                    onClick={() => applyAspectRatio(ratio.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-all cursor-pointer select-none active:scale-95",
                      isSelected
                        ? "border-[#0d99ff] bg-[#0d99ff]/10 text-[#0d99ff] shadow-xs ring-1 ring-[#0d99ff]/30"
                        : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <IconComponent className="size-3.5" />
                    <span className="text-[11px] font-medium leading-none">
                      {ratio.label}
                    </span>
                    <span className="text-[9px] opacity-70 tabular-nums">
                      {ratio.ratio}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              onClick={applyCrop}
              className="h-8 gap-1.5 rounded-md bg-[#0d99ff] text-xs font-medium text-white shadow-none hover:bg-[#0d99ff]/90 cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancelCrop}
              className="h-8 gap-1.5 rounded-md border-border text-xs font-medium hover:bg-muted cursor-pointer"
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Drag the blue bounding box on canvas to position your crop.
          </p>
        </>
      )}
    </div>
  );
}
