"use client";

import UpgradeModel from "@/components/common/upgrade-model";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCanvas } from "@/context/context";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { ToolId } from "@/utils/types";
import {
  Crop,
  Expand,
  Sliders,
  Palette,
  Maximize2,
  Text,
  Sparkles,
  Layers,
  Shapes,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TOOL_GROUPS: {
  id: ToolId;
  label: string;
  icon: LucideIcon;
  proOnly?: boolean;
  shortcut?: string;
}[][] = [
  [
    { id: "resize", label: "Resize", icon: Expand, shortcut: "R" },
    { id: "crop", label: "Crop", icon: Crop, shortcut: "C" },
    { id: "adjust", label: "Adjust", icon: Sliders, shortcut: "A" },
  ],
  [
    { id: "text", label: "Text", icon: Text, shortcut: "T" },
    { id: "shapes", label: "Shapes", icon: Shapes, shortcut: "S" },
    { id: "layers", label: "Layers", icon: Layers, shortcut: "L" },
  ],
  [
    { id: "background", label: "AI Background", icon: Palette, proOnly: true },
    { id: "ai_extender", label: "AI Extender", icon: Maximize2, proOnly: true },
    { id: "ai_edit", label: "AI Edit", icon: Sparkles, proOnly: true },
  ],
];

const EditorToolbar = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [restrictedTool, setRestrictedTool] = useState<string | null>(null);
  const { activeTool, onToolChange } = useCanvas();
  const { hasAccess } = usePlanAccess();

  const handleToolChange = (toolId: ToolId) => {
    if (!hasAccess(toolId)) {
      setRestrictedTool(toolId);
      setShowUpgradeModal(true);
      return;
    }
    onToolChange(toolId);
  };

  return (
    <>
      <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2">
        {TOOL_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} className="flex w-full flex-col items-center gap-0.5 px-1.5">
            {groupIndex > 0 && (
              <div className="mb-1 mt-1 h-px w-6 bg-border" />
            )}
            {group.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              const hasToolAccess = hasAccess(tool.id);

              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToolChange(tool.id)}
                      aria-label={tool.label}
                      aria-pressed={isActive}
                      className={cn(
                        "relative flex size-9 items-center justify-center rounded-md transition-colors duration-100 ease-out active:scale-[0.97]",
                        isActive
                          ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        !hasToolAccess && "opacity-50",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={isActive ? 2.25 : 1.75} />
                      {tool.proOnly && !hasToolAccess && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-muted">
                          <Lock className="size-2" />
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="flex items-center gap-2">
                    <span>{tool.label}</span>
                    {tool.shortcut && (
                      <kbd className="rounded border border-border/40 bg-background/20 px-1 py-0.5 text-[10px] font-medium opacity-70">
                        {tool.shortcut}
                      </kbd>
                    )}
                    {tool.proOnly && !hasToolAccess && (
                      <span className="text-[10px] opacity-70">Pro</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </aside>

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

export default EditorToolbar;
