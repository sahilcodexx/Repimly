"use client";
import { CanvasContext } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { Loader2, Monitor } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { HashLoader } from "react-spinners";
import CanvasEditor from "../_components/canvas-editor";
import { Project } from "@/utils/types";
import EditorTopbar from "../_components/editor-topbar";
import { FabricImage } from "fabric";
import EditorSidebar from "../_components/editor-sidebar";

const Editor = () => {
  const { projectid } = useParams();
  const [canvasEditor, setCanvasEditor] = useState<any>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null,
  );
  const [activeTool, setActiveTool] = useState<string>("resize");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isRestoring = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const {
    data: project,
    isLoading,
    error,
  } = useConvexQuery(api.project.getProject, { projectId: projectid }) as {
    data: Project | null;
    isLoading: boolean;
    error: Error | null;
  };

  const { mutate: updateProject, isLoading: isSaving } = useConvexMutation(
    api.project.updateProject,
  );

  const saveState = useCallback(() => {
    if (canvasEditor && !isRestoring.current) {
      const newState = JSON.stringify(canvasEditor.toJSON());
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [canvasEditor, history, historyIndex]);

  const undo = () => {
    if (canUndo && canvasEditor) {
      isRestoring.current = true;
      const prevState = history[historyIndex - 1];
      canvasEditor.loadFromJSON(prevState, () => {
        canvasEditor.requestRenderAll();
        setHistoryIndex(historyIndex - 1);
        isRestoring.current = false;
      });
    }
  };

  const redo = () => {
    if (canRedo && canvasEditor) {
      isRestoring.current = true;
      const nextState = history[historyIndex + 1];
      canvasEditor.loadFromJSON(nextState, () => {
        canvasEditor.requestRenderAll();
        setHistoryIndex(historyIndex + 1);
        isRestoring.current = false;
      });
    }
  };

  useEffect(() => {
    if (!project) return;
    let saveTimeout: NodeJS.Timeout;

    const autoSave = () => {
      if (history.length > 0) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          const currentCanvasState = history[historyIndex];
          updateProject({
            projectId: project._id,
            canvasState: JSON.parse(currentCanvasState),
          });
        }, 2000);
      }
    };

    autoSave();

    return () => clearTimeout(saveTimeout);
  }, [history, historyIndex, project, updateProject]);

  const reset = async () => {
    if (canvasEditor && project?.originalImageUrl) {
      // Clear canvas and load original image
      canvasEditor.clear();
      const img = await FabricImage.fromURL(project.originalImageUrl, {
        crossOrigin: "anonymous",
      });

      if (!canvasEditor) return;
      const imageAspectRatio = img.width! / img.height!;
      const canvasAspectRatio = canvasEditor.width! / canvasEditor.height!;

      let scaleX, scaleY;
      if (imageAspectRatio > canvasAspectRatio) {
        scaleX = canvasEditor.width! / img.width!;
        scaleY = scaleX;
      } else {
        scaleY = canvasEditor.height! / img.height!;
        scaleX = scaleY;
      }

      img.set({
        left: canvasEditor.width! / 2,
        top: canvasEditor.height! / 2,
        originX: "center",
        originY: "center",
        scaleX,
        scaleY,
        selectable: true,
        evented: true,
      });

      canvasEditor.add(img);
      canvasEditor.requestRenderAll();
      saveState(); // Save the reset state as a new history point
    }
  };

  // Ensure project has all required properties
  const projectWithId = project
    ? ({ ...project, _id: projectid } as Project)
    : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <span className="animate-spin">
          <Loader2 height={50} width={40} />
        </span>
        <p>Loading Please wait.</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-red-500">
            Project Not Found
          </h2>
          <p className="text-gray-600">
            The project you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CanvasContext.Provider
      value={{
        canvasEditor,
        setCanvasEditor,
        activeTool,
        processingMessage,
        setProcessingMessage,
        onToolChange: setActiveTool,
        history,
        historyIndex,
        canUndo,
        canRedo,
        undo,
        redo,
        reset,
        saveState,
        isSaving,
      }}
    >
      <div className="flex min-h-screen items-center justify-center text-center lg:hidden">
        <div>
          <Monitor className="mx-auto mb-5 h-16 w-16" />
          <h2 className="text-4xl">Desktop Required</h2>
          <p className="text-sm opacity-80">
            Please use a larger screen to access the full editing experience
          </p>
        </div>
      </div>
      <div className="hidden min-h-screen lg:block bg-background">
        {processingMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-2xl">
              <HashLoader color="hsl(var(--primary))" />
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  {processingMessage}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Please wait, do not switch tabs or navigate away
                </p>
              </div>
            </div>
          </div>
        )}
        <EditorTopbar project={projectWithId!} />
        <div className="flex h-[calc(100vh-var(--topbar-height))] overflow-hidden">
          <EditorSidebar project={projectWithId!} />
          <div className="flex-1 bg-muted/30">
            <CanvasEditor project={projectWithId!} />
          </div>
        </div>
      </div>
    </CanvasContext.Provider>
  );
};

export default Editor;
