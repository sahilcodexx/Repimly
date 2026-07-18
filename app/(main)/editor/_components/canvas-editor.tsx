"use client";
import { useCanvas } from "@/context/context";
import { Project } from "@/utils/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, FabricImage } from "fabric";
import { useGridSnap } from "./grid-overlay";
import { Skeleton } from "@/components/ui/skeleton";

const MIN_SCALE = 0.05;

const CanvasEditor = ({ project }: { project: Project }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const initDoneRef = useRef(false);

  const {
    canvasEditor,
    setCanvasEditor,
    activeTool,
    onToolChange,
    saveState,
    showGrid,
  } = useCanvas();

  useGridSnap();

  const calculateViewportScale = useCallback(() => {
    if (!containerRef.current || !project) return 1;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 48;
    const containerHeight = container.clientHeight - 48;

    if (containerWidth <= 0 || containerHeight <= 0) return null;

    const scaleX = containerWidth / project.width;
    const scaleY = containerHeight / project.height;
    return Math.max(Math.min(scaleX, scaleY, 1), MIN_SCALE);
  }, [project]);

  const applyScale = useCallback(
    (canvas: Canvas, scale: number) => {
      canvas.setDimensions(
        {
          width: project.width * scale,
          height: project.height * scale,
        },
        { backstoreOnly: false },
      );
      canvas.setZoom(scale);
      canvas.calcOffset();
      canvas.requestRenderAll();
    },
    [project],
  );

  useEffect(() => {
    let disposed = false;
    initDoneRef.current = false;

    const initializeCanvas = async () => {
      if (!canvasRef.current || disposed) return;
      setIsLoading(true);

      const canvas = new Canvas(canvasRef.current, {
        width: project.width,
        height: project.height,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
        selection: true,
        hoverCursor: "move",
        moveCursor: "move",
        defaultCursor: "default",
        allowTouchScrolling: false,
        renderOnAddRemove: true,
        skipTargetFind: false,
      });

      fabricRef.current = canvas;

      if (project.canvasState) {
        try {
          await canvas.loadFromJSON(project.canvasState);
        } catch (error) {
          console.error("Error loading canvas state:", error);
        }
      }

      canvas.backgroundColor = "#ffffff";

      if (
        (project.currentImageUrl || project.originalImageUrl) &&
        canvas.getObjects().length === 0
      ) {
        try {
          const imageUrl = project.currentImageUrl || project.originalImageUrl;
          if (imageUrl) {
            const fabricImage = await FabricImage.fromURL(imageUrl, {
              crossOrigin: "anonymous",
            });
            const imageAspectRatio = fabricImage.width / fabricImage.height;
            const canvasAspectRatio = project.width / project.height;

            let scaleX: number;
            let scaleY: number;

            if (imageAspectRatio > canvasAspectRatio) {
              scaleX = project.width / fabricImage.width;
              scaleY = scaleX;
            } else {
              scaleY = project.height / fabricImage.height;
              scaleX = scaleY;
            }
            fabricImage.set({
              left: project.width / 2,
              top: project.height / 2,
              originX: "center",
              originY: "center",
              scaleX,
              scaleY,
              selectable: true,
              evented: true,
            });
            canvas.add(fabricImage);
          }
        } catch (error) {
          console.error("Error loading project image:", error);
        }
      }

      if (disposed) {
        canvas.dispose();
        return;
      }

      const scale = calculateViewportScale() ?? 0.5;
      applyScale(canvas, scale);

      import("fabric").then(({ Object: FabricObjectClass }) => {
        FabricObjectClass.prototype.set({
          transparentCorners: false,
          cornerColor: "#ffffff",
          cornerStrokeColor: "#0d99ff",
          cornerSize: 8,
          cornerStyle: "rect",
          borderColor: "#0d99ff",
          borderScaleFactor: 1,
          padding: 0,
          borderOpacityWhenMoving: 1,
        });
      });

      setCanvasEditor(canvas);
      initDoneRef.current = true;
      saveState();
      setIsLoading(false);

      requestAnimationFrame(() => {
        if (disposed || !fabricRef.current) return;
        const nextScale = calculateViewportScale();
        if (nextScale) applyScale(fabricRef.current, nextScale);
      });
    };

    initializeCanvas();

    return () => {
      disposed = true;
      initDoneRef.current = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      setCanvasEditor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const canvas = fabricRef.current;
      if (!canvas || !initDoneRef.current) return;
      const scale = calculateViewportScale();
      if (scale) applyScale(canvas, scale);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [calculateViewportScale, applyScale]);

  useEffect(() => {
    if (!canvasEditor) return;

    const handleCanvasChange = () => {
      saveState();
    };

    canvasEditor.on("object:modified", handleCanvasChange);
    canvasEditor.on("object:added", handleCanvasChange);
    canvasEditor.on("object:removed", handleCanvasChange);

    return () => {
      canvasEditor.off("object:modified", handleCanvasChange);
      canvasEditor.off("object:added", handleCanvasChange);
      canvasEditor.off("object:removed", handleCanvasChange);
    };
  }, [canvasEditor, saveState]);

  useEffect(() => {
    if (!canvasEditor) return;

    switch (activeTool) {
      case "crop":
        canvasEditor.defaultCursor = "default";
        canvasEditor.hoverCursor = "crosshair";
        break;
      default:
        canvasEditor.defaultCursor = "default";
        canvasEditor.hoverCursor = "move";
        break;
    }
  }, [canvasEditor, activeTool]);

  useEffect(() => {
    if (!canvasEditor || !onToolChange) return;

    const handleSelection = (e: any) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && selectedObject.type === "i-text") {
        onToolChange("text");
      }
    };
    canvasEditor.on("selection:created", handleSelection);
    canvasEditor.on("selection:updated", handleSelection);
    return () => {
      canvasEditor.off("selection:created", handleSelection);
      canvasEditor.off("selection:updated", handleSelection);
    };
  }, [canvasEditor, onToolChange]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#e5e5e5] dark:bg-[#1e1e1e]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #a3a3a3 0.6px, transparent 0.6px)`,
          backgroundSize: "16px 16px",
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      )}
      <div
        className="relative bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.4)]"
        style={
          showGrid
            ? {
                backgroundImage: `
            linear-gradient(rgba(13,153,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13,153,255,0.12) 1px, transparent 1px)
          `,
                backgroundSize: "20px 20px",
              }
            : undefined
        }
      >
        <canvas id="canvas" ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasEditor;
