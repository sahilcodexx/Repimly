"use client";
import { CanvasContext } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { Monitor } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { HashLoader } from "react-spinners";
import CanvasEditor from "../_components/canvas-editor";
import { ZoomControls } from "../_components/zoom-controls";
import { Project } from "@/utils/types";
import EditorTopbar from "../_components/editor-topbar";
import { FabricImage } from "fabric";
import EditorSidebar from "../_components/editor-sidebar";
import { useKeyboardShortcuts } from "../_components/use-keyboard-shortcuts";
import { CanvasContextMenu } from "../_components/canvas-context-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

const Editor = () => {
  const { projectid } = useParams();
  const [canvasEditor, setCanvasEditor] = useState<any>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null,
  );
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<string>("resize");
  const [showGrid, setShowGrid] = useState(false);
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

  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!project || historyIndex < 0) return;

    const currentState = history[historyIndex];
    if (currentState === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      updateProject({
        projectId: project._id,
        canvasState: JSON.parse(currentState),
      });
      lastSavedRef.current = currentState;
    }, 2000);

    return () => clearTimeout(timer);
  }, [historyIndex, project, updateProject]);

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
      <div className="flex min-h-screen flex-col gap-4 bg-background p-8">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 flex-1">
          <Skeleton className="h-full w-[280px]" />
          <Skeleton className="h-full flex-1" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Monitor className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-foreground">
            Project Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
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
        showGrid,
        setShowGrid,
      }}
    >
      <TooltipProvider delayDuration={0}>
      <KeyboardShortcuts project={projectWithId} />
      <CanvasContextMenu />
      <div className="flex min-h-screen items-center justify-center text-center lg:hidden">
        <div className="max-w-sm px-4">
          <Monitor className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-1 text-xl font-semibold text-foreground">Desktop Required</h2>
          <p className="text-sm text-muted-foreground">
            Please use a larger screen to access the full editing experience
          </p>
        </div>
      </div>
      <div className="hidden min-h-dvh lg:block bg-background">
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
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          <EditorSidebar project={projectWithId!} />
          <div ref={canvasAreaRef} className="flex-1 bg-muted/30">
            <CanvasEditor project={projectWithId!} />
            <ZoomControls project={projectWithId!} containerRef={canvasAreaRef} />
          </div>
        </div>
      </div>
      </TooltipProvider>
    </CanvasContext.Provider>
  );
};

function KeyboardShortcuts({ project }: { project: Project | null }) {
  useKeyboardShortcuts(project);
  return null;
}

export default Editor;
