"use client";

import { useCanvas } from "@/context/context";
import { Project, ToolConfig } from "@/utils/types";
import { AnimatePresence, motion } from "motion/react";
import {
  Crop,
  Expand,
  Eye,
  Layers,
  Maximize2,
  Palette,
  Shapes,
  Sliders,
  Text,
} from "lucide-react";
import AdjustControl from "./tools/Adjust";
import { ResizeContent } from "./tools/Resize";
import { CropContent } from "./tools/Crop";
import { BackgroundControls } from "./tools/background-controls";
import { TextControls } from "./tools/text-control";
import { AIExtenderControls } from "./tools/ai-extender-controls";
import { AIEdit } from "./tools/ai-edit";
import { LayerPanel } from "./tools/layer-panel";
import { ShapeControls } from "./tools/shape-controls";

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  resize: {
    title: "Resize",
    icon: Expand,
    description: "Change project dimensions",
  },
  crop: {
    title: "Crop",
    icon: Crop,
    description: "Crop and trim your image",
  },
  adjust: {
    title: "Adjust",
    icon: Sliders,
    description: "Brightness, contrast, and more",
  },
  background: {
    title: "Background",
    icon: Palette,
    description: "Remove or change background",
  },
  ai_extender: {
    title: "AI Extender",
    icon: Maximize2,
    description: "Extend image boundaries with AI",
  },
  text: {
    title: "Text",
    icon: Text,
    description: "Add and style text",
  },
  ai_edit: {
    title: "AI Edit",
    icon: Eye,
    description: "Enhance image quality with AI",
  },
  layers: {
    title: "Layers",
    icon: Layers,
    description: "Manage layering and visibility",
  },
  shapes: {
    title: "Shapes",
    icon: Shapes,
    description: "Add rectangles, circles, lines",
  },
};

const EditorSidebar = ({ project }: { project: Project }) => {
  const { activeTool } = useCanvas();
  const toolConfig = TOOL_CONFIGS[activeTool];

  if (!toolConfig) return null;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {toolConfig.title}
        </h2>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="p-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            >
              {renderToolConfig(activeTool, project)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};

export default EditorSidebar;

const renderToolConfig = (activeTool: string, project: Project) => {
  switch (activeTool) {
    case "crop":
      return <CropContent />;
    case "resize":
      return <ResizeContent project={project} />;
    case "adjust":
      return <AdjustControl />;
    case "background":
      return <BackgroundControls project={project} />;
    case "text":
      return <TextControls />;
    case "ai_extender":
      return <AIExtenderControls project={project} />;
    case "ai_edit":
      return <AIEdit project={project} />;
    case "layers":
      return <LayerPanel />;
    case "shapes":
      return <ShapeControls />;
    default:
      return (
        <p className="text-xs text-muted-foreground">
          Select a tool to get started
        </p>
      );
  }
};
