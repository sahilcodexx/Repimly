"use client";
import UpgradeModel from "@/components/common/upgrade-model";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";

import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { Project, ToolId, User } from "@/utils/types";
import {
  Crop,
  Expand,
  Sliders,
  Palette,
  Maximize2,
  Text,
  Eye,
  ArrowLeft,
  Lock,
  RotateCcw,
  RotateCw,
  RefreshCcw,
  Loader2,
  Save,
  Download,
  ChevronDown,
  FileImage,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, ElementType } from "react";
import CanvasEditor from "./canvas-editor";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TOOLS: {
  id: ToolId;
  label: string;
  icon: ElementType;
  proOnly?: boolean;
}[] = [
  {
    id: "resize",
    label: "Resize",
    icon: Expand,
  },
  {
    id: "crop",
    label: "Crop",
    icon: Crop,
  },
  {
    id: "adjust",
    label: "Adjust",
    icon: Sliders,
  },
  {
    id: "text",
    label: "Text",
    icon: Text,
  },
  {
    id: "background",
    label: "AI Background",
    icon: Palette,
    proOnly: true,
  },
  {
    id: "ai_extender",
    label: "AI Image Extender",
    icon: Maximize2,
    proOnly: true,
  },
  {
    id: "ai_edit",
    label: "AI Editing",
    icon: Eye,
    proOnly: true,
  },
];

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
  const [viewportTransform, setViewportTransform] = useState();

  const {
    activeTool,
    onToolChange,
    canvasEditor,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    isSaving,
  } = useCanvas();
  const { hasAccess, canExport, isFree } = usePlanAccess();
  const router = useRouter();

  const { mutate: updateProject, isLoading: isUpdatingProject } =
    useConvexMutation(api.project.updateProject);

  const { data: user } = useConvexQuery(api.users.getCurrentUser) as {
    data: User | null;
  };

  const handleManualSave = async () => {
    if (!canvasEditor) {
      return;
    }
    try {
      await updateProject({
        projectId: project._id,
        canvasState: canvasEditor.toJSON(),
      });
      toast.success("Project saved successfully!");
    } catch (error) {
      console.error("Failed to save project", error);
      toast.error("Failed to save project");
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleToolChange = (toolId: ToolId) => {
    if (!hasAccess(toolId)) {
      setRestrictedTool(toolId);
      setShowUpgradeModal(true);
      return;
    }
    onToolChange(toolId);
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

      toast.success("Image exported successfully as " + exportConfig.format);
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
      <div className="supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="grid grid-cols-3 items-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-3 justify-self-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeft size={16} />
              All Projects
            </Button>
            <span className="h-4 w-px bg-border" />
            <h2 className="text-sm font-medium capitalize text-foreground">{project.title}</h2>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
              {TOOLS.map((tools) => {
                const Icon = tools.icon;
                const isActive = activeTool === tools.id;
                const hasToolAccess = hasAccess(tools.id);
                return (
                  <Button
                    key={tools.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`relative gap-1.5 text-xs ${!hasToolAccess ? "opacity-50" : ""} ${isActive ? "shadow-xs" : ""}`}
                    onClick={() => handleToolChange(tools.id)}
                  >
                    <Icon size={14} />
                    {tools.label}
                    {tools.proOnly && !hasToolAccess && <Lock size={10} />}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              className="h-8 w-8 text-muted-foreground"
            >
              <RotateCcw size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              className="h-8 w-8 text-muted-foreground"
            >
              <RotateCw size={14} />
            </Button>

            <span className="h-4 w-px bg-border" />

            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={isSaving || !project.originalImageUrl}
              className="gap-1.5 text-xs"
            >
              <RefreshCcw size={14} />
              Reset
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving || !canvasEditor}
              className="w-[82px] gap-1.5 text-xs"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>{isSaving ? "Saving" : "Save"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting || !canvasEditor}
                  className="gap-1.5 text-xs"
                >
                  {isExporting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {isExporting ? `Exporting ${exportFormat}` : "Export"}
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Export Resolution: {project.width} × {project.height}px
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXPORT_FORMATS.map((format) => (
                  <DropdownMenuItem
                    key={format.label}
                    onClick={() => handleExport(format)}
                    className="gap-3"
                  >
                    <FileImage size={16} className="text-muted-foreground" />
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
                  Free Plan: {user?.exportProjectThisMonth || 0}/20 exports this month
                  {(user?.exportProjectThisMonth || 0) >= 20 && (
                    <p className="mt-0.5 text-destructive">Limit reached. Upgrade to Pro.</p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <ModeToggle />
          </div>
        </div>
      </div>
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
