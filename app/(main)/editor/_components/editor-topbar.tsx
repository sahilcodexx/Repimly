"use client";

import UpgradeModel from "@/components/common/upgrade-model";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { Project, User } from "@/utils/types";
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  RefreshCcw,
  Loader2,
  Save,
  Download,
  ChevronDown,
  FileImage,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const EXPORT_FORMATS = [
  {
    format: "PNG",
    quality: 1.0,
    label: "PNG (High Quality)",
    extension: "png",
  },
  {
    format: "JPEG",
    quality: 0.9,
    label: "JPEG (90% Quality)",
    extension: "jpg",
  },
  {
    format: "JPEG",
    quality: 0.8,
    label: "JPEG (80% Quality)",
    extension: "jpg",
  },
  {
    format: "WEBP",
    quality: 0.9,
    label: "WebP (90% Quality)",
    extension: "webp",
  },
];

const EditorTopbar = ({ project }: { project: Project }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [restrictedTool, setRestrictedTool] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const {
    canvasEditor,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    isSaving,
  } = useCanvas();
  const { canExport } = usePlanAccess();
  const router = useRouter();

  const { mutate: updateProject } = useConvexMutation(api.project.updateProject);

  const { data: user } = useConvexQuery(api.users.getCurrentUser) as {
    data: User | null;
  };

  const handleManualSave = async () => {
    if (!canvasEditor) return;
    try {
      await updateProject({
        projectId: project._id,
        canvasState: canvasEditor.toJSON(),
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      toast.success("Project saved");
    } catch (error) {
      console.error("Failed to save project", error);
      toast.error("Failed to save project");
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleExport = async (exportConfig: {
    format: string;
    quality: number;
    label: string;
    extension: string;
  }) => {
    try {
      if (!canExport || !project) {
        toast.error(
          "You have reached your export limit for this month. Please upgrade to Pro for more exports.",
        );
        return;
      }
      if (!canExport(user?.exportProjectThisMonth || 0)) {
        setRestrictedTool("export");
        setShowUpgradeModal(true);
        return;
      }
      setIsExporting(true);
      setExportFormat(exportConfig.format);

      const currentZoom = canvasEditor?.getZoom();
      const currentViewportTransform = [...canvasEditor?.viewportTransform];

      canvasEditor.setZoom(1);
      canvasEditor.setViewportTransform([1, 0, 0, 1, 0, 0]);

      canvasEditor.setDimensions({
        width: project.width,
        height: project.height,
      });

      canvasEditor.requestRenderAll();

      const dataUrl = canvasEditor.toDataURL({
        format: exportConfig.format.toLowerCase(),
        quality: exportConfig.quality,
        multiplier: 1,
      });

      canvasEditor.setZoom(currentZoom);
      canvasEditor.setViewportTransform(currentViewportTransform);
      canvasEditor.setDimensions({
        width: project.width * currentZoom,
        height: project.height * currentZoom,
      });
      setIsExporting(false);
      setExportFormat(null);
      canvasEditor.requestRenderAll();

      const link = document.createElement("a");
      link.download = `${project.title}.${exportConfig.extension}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Exported as " + exportConfig.format);
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <>
      <header className="z-40 flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-2">
        <div className="flex min-w-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleBackToDashboard}
                aria-label="Back to dashboard"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97]"
              >
                <ArrowLeft className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>All projects</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-border" />

          <h1 className="max-w-[200px] truncate text-[13px] font-medium text-foreground">
            {project.title}
          </h1>

          {isSaving && (
            <span className="ml-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Saving…
            </span>
          )}
          {justSaved && !isSaving && (
            <span className="ml-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors duration-100 ease-out active:scale-[0.97]",
                  canUndo
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "cursor-not-allowed text-muted-foreground/30",
                )}
              >
                <RotateCcw className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Undo{" "}
              <kbd className="ml-1 rounded border border-border/40 px-1 text-[10px]">
                ⌘Z
              </kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors duration-100 ease-out active:scale-[0.97]",
                  canRedo
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "cursor-not-allowed text-muted-foreground/30",
                )}
              >
                <RotateCw className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Redo{" "}
              <kbd className="ml-1 rounded border border-border/40 px-1 text-[10px]">
                ⌘⇧Z
              </kbd>
            </TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={reset}
                disabled={isSaving || !project.originalImageUrl}
                aria-label="Reset"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <RefreshCcw className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Reset to original</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleManualSave}
                disabled={isSaving || !canvasEditor}
                aria-label="Save"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Save{" "}
              <kbd className="ml-1 rounded border border-border/40 px-1 text-[10px]">
                ⌘S
              </kbd>
            </TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={isExporting || !canvasEditor}
                className="h-7 gap-1.5 rounded-md bg-[#0d99ff] px-2.5 text-xs font-medium text-white shadow-none hover:bg-[#0d99ff]/90 active:scale-[0.97]"
              >
                {isExporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {isExporting ? exportFormat : "Export"}
                <ChevronDown className="size-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {project.width} × {project.height}px
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXPORT_FORMATS.map((format) => (
                <DropdownMenuItem
                  key={format.label}
                  onClick={() => handleExport(format)}
                  className="gap-3"
                >
                  <FileImage className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">{format.format}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(format.quality * 100)}% Quality
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Free: {user?.exportProjectThisMonth || 0}/20 exports this month
                {(user?.exportProjectThisMonth || 0) >= 20 && (
                  <p className="mt-0.5 text-destructive">
                    Limit reached. Upgrade to Pro.
                  </p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1 h-4 w-px bg-border" />

          <div className="[&_button]:size-8 [&_button]:rounded-md [&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none [&_button]:hover:bg-muted">
            <ModeToggle />
          </div>
        </div>
      </header>

      <UpgradeModel
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setRestrictedTool(null);
        }}
        restrictedTool={restrictedTool || ""}
        reason="This tool is only available for Pro users."
      />
    </>
  );
};

export default EditorTopbar;
