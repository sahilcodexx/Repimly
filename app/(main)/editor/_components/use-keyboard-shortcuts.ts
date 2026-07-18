"use client";

import { useEffect } from "react";
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Project } from "@/utils/types";

const ZOOM_STEP = 10;

export function useKeyboardShortcuts(project: Project | null) {
  const { canvasEditor, undo, redo, onToolChange, saveState } = useCanvas();
  const { mutate: updateProject } = useConvexMutation(api.project.updateProject);

  useEffect(() => {
    if (!canvasEditor || !project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isEditingText =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isEditingText && e.key !== "Escape") return;

      const activeObject = canvasEditor.getActiveObject();

      switch (e.key) {
        case "z":
        case "Z":
          if (!isMod) return;
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;

        case "y":
        case "Y":
          if (!isMod) return;
          e.preventDefault();
          redo();
          break;

        case "s":
        case "S":
          if (!isMod) return;
          e.preventDefault();
          updateProject({
            projectId: project._id,
            canvasState: canvasEditor.toJSON(),
          });
          break;

        case "Delete":
        case "Backspace":
          if (!activeObject) return;
          e.preventDefault();
          canvasEditor.remove(activeObject);
          canvasEditor.discardActiveObject();
          canvasEditor.requestRenderAll();
          saveState();
          break;

        case "Escape":
          canvasEditor.discardActiveObject();
          canvasEditor.requestRenderAll();
          break;

        case "=":
        case "+":
          if (!isMod) return;
          e.preventDefault();
          {
            const current = canvasEditor.getZoom();
            const newZoom = Math.min(current + ZOOM_STEP / 100, 5);
            canvasEditor.setZoom(newZoom);
            canvasEditor.setDimensions(
              { width: project.width * newZoom, height: project.height * newZoom },
              { backstoreOnly: false },
            );
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
          }
          break;

        case "-":
          if (!isMod) return;
          e.preventDefault();
          {
            const current = canvasEditor.getZoom();
            const newZoom = Math.max(current - ZOOM_STEP / 100, 0.1);
            canvasEditor.setZoom(newZoom);
            canvasEditor.setDimensions(
              { width: project.width * newZoom, height: project.height * newZoom },
              { backstoreOnly: false },
            );
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
          }
          break;

        case "0":
          if (!isMod) return;
          e.preventDefault();
          {
            const container = canvasEditor.getElement().parentElement;
            if (container) {
              const cw = container.clientWidth - 40;
              const ch = container.clientHeight - 40;
              const scale = Math.min(cw / project.width, ch / project.height, 1);
              canvasEditor.setZoom(scale);
              canvasEditor.setDimensions(
                { width: project.width * scale, height: project.height * scale },
                { backstoreOnly: false },
              );
              canvasEditor.calcOffset();
              canvasEditor.requestRenderAll();
            }
          }
          break;

        case "v":
        case "V":
          if (isMod) return;
          onToolChange("resize");
          break;

        case "t":
        case "T":
          if (isMod) return;
          onToolChange("text");
          break;

        case "a":
        case "A":
          if (!isMod) return;
          e.preventDefault();
          onToolChange("adjust");
          break;

        case "c":
        case "C":
          if (isMod) return;
          onToolChange("crop");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvasEditor, project, undo, redo, onToolChange, saveState, updateProject]);
}
