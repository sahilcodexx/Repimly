"use client";
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Project } from "@/utils/types";
import { use, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";


const CanvasEditor = ({ project }: { project: Project }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    canvasEditor,
    setCanvasEditor,
    activeTool,
    onToolChange,
    saveState,
  } = useCanvas();



  const calculateViewportScale = () => {
    if (!containerRef.current || !project) return 1;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const scaleX = containerWidth / project.width;
    const scaleY = containerHeight / project.height;
    return Math.min(scaleX, scaleY, 1);
  };

  useEffect(() => {
    const initilizeCanvas = async () => {
      setIsLoading(true);

      const viewportscale = calculateViewportScale();

      const canvas = new Canvas(canvasRef.current!, {
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
      if (project.canvasState) {
        try {
          await canvas.loadFromJSON(project.canvasState);
        } catch (error) {
          console.error("Error loading canvas state:", error);
        }
      }

      canvas.backgroundColor = "#ffffff";

      canvas.setDimensions(
        {
          width: project.width * viewportscale,
          height: project.height * viewportscale,
        },
        { backstoreOnly: false },
      );

      canvas.setZoom(viewportscale);

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

            let scaleX, scaleY;

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
      canvas.calcOffset();
      canvas.requestRenderAll();
      setCanvasEditor(canvas);
      saveState();

      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 500);

      setIsLoading(false);
    };
    initilizeCanvas();

    return () => {
      if (canvasEditor) {
        canvasEditor.dispose();
      }
      setCanvasEditor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  useEffect(() => {
    if (!canvasEditor) return;

    const handleCanvasChange = () => {
      saveState();
    };

    canvasEditor.on("object:modified", handleCanvasChange);
    canvasEditor.on("object:added",handleCanvasChange)
    canvasEditor.on("object:removed", handleCanvasChange);

    return () => {
      canvasEditor.off("object:modified", handleCanvasChange);
      canvasEditor.off("object:added", handleCanvasChange);
      canvasEditor.off("object:removed", handleCanvasChange);
    };
  }, [canvasEditor, saveState]);

  useEffect(() => {
    const handleResize = () => {
      if (!canvasEditor || !project) return;

      const newScale = calculateViewportScale();
      canvasEditor.setDimensions(
        {
          width: project.width * newScale,
          height: project.height * newScale,
        },
        { backstoreOnly: false },
      );
      canvasEditor.setZoom(newScale);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasEditor, project]);

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
    }
  }, [canvasEditor, onToolChange]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted/30"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, currentColor 25%, transparent 25%),
            linear-gradient(-45deg, currentColor 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, currentColor 75%),
            linear-gradient(-45deg, transparent 75%, currentColor 75%)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
            <p className="text-sm text-muted-foreground">Loading Canvas</p>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-border bg-white p-1 shadow-sm">
        <canvas id="canvas" ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasEditor;
