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
import EditorToolbar from "../_components/editor-toolbar";
import { FabricImage } from "fabric";
import EditorSidebar from "../_components/editor-sidebar";
import { useKeyboardShortcuts } from "../_components/use-keyboard-shortcuts";
import { CanvasContextMenu } from "../_components/canvas-context-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

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
      saveState();
    }
  };

  const projectWithId = project
    ? ({ ...project, _id: projectid } as Project)
    : null;

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <div className="flex h-11 items-center gap-3 border-b border-border px-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex flex-1">
          <Skeleton className="h-full w-12 rounded-none" />
          <Skeleton className="h-full w-60 rounded-none" />
          <Skeleton className="h-full flex-1 rounded-none" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <Monitor className="size-6 text-destructive" />
          </div>
          <h2 className="mb-1 text-base font-semibold text-foreground">
            Project not found
          </h2>
          <p className="text-sm text-muted-foreground">
            This project doesn&apos;t exist or has been removed.
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

        <div className="flex h-dvh items-center justify-center text-center lg:hidden">
          <div className="max-w-sm px-4">
            <Monitor className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Desktop required
            </h2>
            <p className="text-sm text-muted-foreground">
              Use a larger screen to access the full editing experience
            </p>
          </div>
        </div>

        <div className="hidden h-dvh flex-col overflow-hidden bg-background lg:flex">
          {processingMessage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-2xl">
                <HashLoader color="#0d99ff" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {processingMessage}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please wait — don&apos;t switch tabs
                  </p>
                </div>
              </div>
            </div>
          )}

          <EditorTopbar project={projectWithId!} />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <EditorToolbar />
            <div
              ref={canvasAreaRef}
              className="relative h-full min-h-0 min-w-0 flex-1"
            >
              <CanvasEditor project={projectWithId!} />
              <ZoomControls
                project={projectWithId!}
                containerRef={canvasAreaRef}
              />
            </div>
            <EditorSidebar project={projectWithId!} />
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
