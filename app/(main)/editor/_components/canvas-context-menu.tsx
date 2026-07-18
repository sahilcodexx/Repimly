"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, ArrowUp, ArrowDown, Layers } from "lucide-react";
import { useCanvas } from "@/context/context";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
}

export function CanvasContextMenu() {
  const { canvasEditor, saveState } = useCanvas();
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasEditor) return;

    const handleContextMenu = (e: any) => {
      const pointer = canvasEditor.getScenePoint(e.e);
      const target = canvasEditor.findTarget(e.e);

      if (!target) {
        setMenu(null);
        return;
      }

      e.e.preventDefault();

      const canvasEl = canvasEditor.getElement();
      const rect = canvasEl.getBoundingClientRect();
      const scale = canvasEditor.getZoom();
      const vpt = canvasEditor.viewportTransform;

      const x = rect.left + (pointer.x * scale + vpt[4]) * scale;
      const y = rect.top + (pointer.y * scale + vpt[5]) * scale;

      const objects = canvasEditor.getObjects();
      const idx = objects.indexOf(target);

      const items: MenuItem[] = [
        {
          label: "Duplicate",
          icon: Copy,
          shortcut: "⌘D",
          action: () => {
            target.clone((clone: any) => {
              clone.set({ left: (clone.left || 0) + 20, top: (clone.top || 0) + 20 });
              canvasEditor.add(clone);
              canvasEditor.setActiveObject(clone);
              canvasEditor.requestRenderAll();
              saveState();
            });
          },
        },
        {
          label: "Bring Forward",
          icon: ArrowUp,
          shortcut: "⌘]",
          action: () => {
            if (idx < objects.length - 1) {
              canvasEditor.moveTo(target, idx + 1);
              canvasEditor.requestRenderAll();
              saveState();
            }
          },
          disabled: idx >= objects.length - 1,
        },
        {
          label: "Send Backward",
          icon: ArrowDown,
          shortcut: "⌘[",
          action: () => {
            if (idx > 0) {
              canvasEditor.moveTo(target, idx - 1);
              canvasEditor.requestRenderAll();
              saveState();
            }
          },
          disabled: idx <= 0,
        },
        {
          label: "Delete",
          icon: Trash2,
          shortcut: "⌫",
          action: () => {
            canvasEditor.remove(target);
            canvasEditor.discardActiveObject();
            canvasEditor.requestRenderAll();
            saveState();
          },
        },
      ];

      setMenu({ x: e.e.clientX, y: e.e.clientY, items });
    };

    const handleClick = () => setMenu(null);
    const handleScroll = () => setMenu(null);

    canvasEditor.on("mouse:down", (e: any) => {
      if (e.e.button === 3) return;
      setMenu(null);
    });

    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleScroll, true);

    canvasEditor.wrapperEl.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvasEditor.off("mouse:down");
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
      canvasEditor.wrapperEl.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [canvasEditor, saveState]);

  return (
    <AnimatePresence>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-sm"
            style={{ left: menu.x, top: menu.y }}
          >
            {menu.items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.action();
                  setMenu(null);
                }}
                disabled={item.disabled}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-popover-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <kbd className="rounded border border-border px-1 text-[10px] text-muted-foreground">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
