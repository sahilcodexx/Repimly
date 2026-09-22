"use client";

import { useCanvas } from "@/context/context";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { Project, ToolId } from "@/utils/types";
import { useState, useRef, useEffect, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import UpgradeModel from "@/components/common/upgrade-model";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  Crop,
  Expand,
  Eye,
  Layers,
  Maximize2,
  Palette,
  Shapes,
  Sliders,
  Type,
  Lock,
  Search,
  X,
  Sidebar,
  ChevronDown,
  PaintBucket,
  type LucideIcon,
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
import { CanvasColorControls } from "./tools/canvas-color";

interface EditorNavItem {
  id: ToolId;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  proOnly?: boolean;
}

const EDITOR_NAV_ITEMS: EditorNavItem[] = [
  { id: "resize", label: "Resize", icon: Expand, shortcut: "R" },
  { id: "canvas", label: "Canvas Color", icon: PaintBucket, shortcut: "B" },
  { id: "crop", label: "Crop", icon: Crop, shortcut: "C" },
  { id: "adjust", label: "Adjust", icon: Sliders, shortcut: "A" },
  { id: "text", label: "Text", icon: Type, shortcut: "T" },
  { id: "shapes", label: "Shapes", icon: Shapes, shortcut: "S" },
  { id: "layers", label: "Layers", icon: Layers, shortcut: "L" },
  { id: "background", label: "AI Background", icon: Palette, proOnly: true },
  { id: "ai_extender", label: "AI Extender", icon: Maximize2, proOnly: true },
  { id: "ai_edit", label: "AI Edit", icon: Eye, proOnly: true },
];

function Collapsible({
  collapsed,
  children,
  className,
}: {
  collapsed: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-200 ease-out",
        collapsed
          ? "max-w-0 opacity-0"
          : "max-w-full opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

const EditorSidebar = ({ project }: { project: Project }) => {
  const { activeTool, onToolChange } = useCanvas();
  const { hasAccess } = usePlanAccess();
  const [collapsed, setCollapsed] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [restrictedTool, setRestrictedTool] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === "l" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        setCollapsed(false);
        setSearchActive(true);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (searchActive) {
      const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [searchActive]);

  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    if (nextState) {
      setSearchActive(false);
      setQuery("");
    }
  };

  const handleToolClick = (toolId: ToolId) => {
    if (!hasAccess(toolId)) {
      setRestrictedTool(toolId);
      setShowUpgradeModal(true);
      return;
    }
    if (collapsed) {
      setCollapsed(false);
      onToolChange(toolId);
      return;
    }
    if (activeTool === toolId) {
      onToolChange("");
    } else {
      onToolChange(toolId);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? EDITOR_NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(normalizedQuery),
      )
    : EDITOR_NAV_ITEMS;

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 60 : 300 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex h-[calc(100vh-68px)] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card shadow-lg",
          collapsed ? "px-2.5 py-3" : "p-3",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto [scrollbar-width:none]">
          {/* Header row: Project badge & collapse button */}
          <div
            className={cn(
              "flex w-full items-center",
              collapsed ? "justify-center" : "justify-between px-1",
            )}
          >
            <Collapsible collapsed={collapsed}>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  R
                </div>
                <div className="flex min-w-0 flex-col overflow-hidden">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {project.title || "Untitled"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {project.width} × {project.height}px
                  </span>
                </div>
              </div>
            </Collapsible>
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
            >
              <Sidebar
                className={cn(
                  "size-4 transition-transform duration-300 ease-in-out",
                  !collapsed && "rotate-180",
                )}
              />
            </button>
          </div>

          {/* Quick Search */}
          <div className="w-full">
            {searchActive && !collapsed ? (
              <div className="flex w-full items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1.5 ring-1 ring-primary/30">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setQuery("");
                      setSearchActive(false);
                    }
                  }}
                  placeholder="Search tools..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchActive(false);
                  }}
                  className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (collapsed) setCollapsed(false);
                  setSearchActive(true);
                }}
                title={collapsed ? "Quick Search" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-muted/40 text-muted-foreground transition-[background-color] duration-200 hover:bg-muted hover:text-foreground",
                  collapsed ? "size-9 justify-center mx-auto" : "w-full px-3 py-1.5",
                )}
              >
                <Search className="size-3.5 shrink-0" />
                <Collapsible collapsed={collapsed} className="flex-1 justify-between">
                  <span className="text-xs">Quick Search</span>
                  <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 text-[9px] font-medium opacity-70">
                    ⌘L
                  </kbd>
                </Collapsible>
              </button>
            )}
          </div>

          {/* Tools navigation list with inline dropdowns */}
          <nav className="flex w-full flex-col gap-1">
            {filteredItems.map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeTool === tool.id;
              const isOpen = isSelected && !collapsed;
              const hasToolAccess = hasAccess(tool.id);

              return (
                <div
                  key={tool.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border transition-colors duration-150",
                    isOpen
                      ? "border-border/80 bg-muted/30 shadow-xs"
                      : isSelected
                        ? "border-primary/30 bg-primary/5"
                        : "border-transparent hover:bg-muted/40",
                  )}
                >
                  {/* Tool Header Button */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(tool.id)}
                    title={collapsed ? tool.label : undefined}
                    className={cn(
                      "flex w-full items-center justify-between p-2 cursor-pointer",
                      collapsed && "justify-center p-1.5",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isOpen
                            ? "bg-[#0d99ff] text-white shadow-xs"
                            : isSelected
                              ? "bg-[#0d99ff]/15 text-[#0d99ff]"
                              : "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={isOpen ? 2.2 : 1.8} />
                      </span>
                      <Collapsible collapsed={collapsed}>
                        <span
                          className={cn(
                            "text-xs font-medium whitespace-nowrap",
                            isOpen
                              ? "text-foreground font-semibold"
                              : isSelected
                                ? "text-primary"
                                : "text-muted-foreground",
                          )}
                        >
                          {tool.label}
                        </span>
                      </Collapsible>
                    </span>

                    <Collapsible collapsed={collapsed}>
                      <div className="flex items-center gap-1.5">
                        {tool.proOnly && !hasToolAccess ? (
                          <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                            <Lock className="size-2" />
                            Pro
                          </span>
                        ) : tool.shortcut && !isOpen ? (
                          <kbd className="rounded border border-border/40 bg-background/30 px-1 py-0.5 text-[9px] font-medium text-muted-foreground opacity-70">
                            {tool.shortcut}
                          </kbd>
                        ) : null}
                        <ChevronDown
                          className={cn(
                            "size-3.5 text-muted-foreground transition-transform duration-200 ease-out",
                            isOpen && "rotate-180 text-foreground",
                          )}
                        />
                      </div>
                    </Collapsible>
                  </button>

                  {/* Dropdown Content with Tool Settings */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: {
                              duration: 0.28,
                              ease: [0.16, 1, 0.3, 1],
                            },
                            opacity: {
                              duration: 0.2,
                              delay: 0.05,
                            },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: {
                              duration: 0.2,
                              ease: [0.16, 1, 0.3, 1],
                            },
                            opacity: {
                              duration: 0.12,
                            },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/40 p-2.5 pt-2">
                          {renderToolConfig(tool.id, project)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom section: User profile icon */}
        <div className="flex w-full shrink-0 border-t border-border/40 pt-2.5">
          <div
            className={cn(
              "flex w-full items-center",
              collapsed ? "justify-center" : "justify-end px-1",
            )}
          >
            <UserButton />
          </div>
        </div>
      </motion.aside>

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
    case "canvas":
      return <CanvasColorControls />;
    default:
      return (
        <p className="text-xs text-muted-foreground">
          Select a tool to get started
        </p>
      );
  }
};
