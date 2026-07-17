import { useCanvas } from "@/context/context";
import { Project, ToolConfig } from "@/utils/types";

import {
  Crop,
  Expand,
  Sliders,
  Palette,
  Maximize2,
  Text,
  Eye,
  Layers,
} from "lucide-react";
import AdjustControl from "./tools/Adjust";
import { ResizeContent } from "./tools/Resize";
import { CropContent } from "./tools/Crop";
import { BackgroundControls } from "./tools/background-controls";
import { TextControls } from "./tools/text-control";
import { AIExtenderControls } from "./tools/ai-extender-controls";
import { AIEdit } from "./tools/ai-edit";
import { LayerPanel } from "./tools/layer-panel";

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
    description: "Brightness, contrast, and more (Manual saving required)",
  },
  background: {
    title: "Background",
    icon: Palette,
    description: "Remove or change background",
  },
  ai_extender: {
    title: "AI Image Extender",
    icon: Maximize2,
    description: "Extend image boundaries with AI",
  },
  text: {
    title: "Add Text",
    icon: Text,
    description: "Customize in Various Fonts",
  },
  ai_edit: {
    title: "AI Editing",
    icon: Eye,
    description: "Enhance image quality with AI",
  },
  layers: {
    title: "Layers",
    icon: Layers,
    description: "Manage object layering and visibility",
  },
};
const EditorSidebar = ({ project }: { project: Project }) => {
  const { activeTool } = useCanvas();

  const toolConfig = TOOL_CONFIGS[activeTool];
  if (!toolConfig) {
    return null;
  }

  const Icon = toolConfig.icon;
  return (
    <div className="flex w-80 min-w-80 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-semibold">{toolConfig.title}</h2>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{toolConfig.description}</p>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="p-4">
          {renderToolConfig(activeTool, project)}
        </div>
      </div>
    </div>
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
    default:
      return <div>Select a Tool to get started</div>;
  }
};
