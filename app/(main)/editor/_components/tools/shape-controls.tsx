"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowUpRight,
  MousePointerClick,
  Ban,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import { Rect, Circle as FabricCircle, Triangle as FabricTriangle, Ellipse, Line, Group, type FabricObject } from "fabric";

const SHAPE_TYPES = [
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "ellipse", label: "Ellipse", icon: Circle },
  { id: "triangle", label: "Triangle", icon: Triangle },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
] as const;

type ShapeType = (typeof SHAPE_TYPES)[number]["id"];

const DEFAULTS = {
  fill: "#4f46e5",
  stroke: "#000000",
  strokeWidth: 2,
};

export function ShapeControls() {
  const { canvasEditor } = useCanvas();
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [fillColor, setFillColor] = useState(DEFAULTS.fill);
  const [noFill, setNoFill] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(4);
  const [strokeColor, setStrokeColor] = useState(DEFAULTS.stroke);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULTS.strokeWidth);

  const getCanvasCenter = () => {
    if (!canvasEditor) return { left: 200, top: 200 };
    return {
      left: (canvasEditor.width || 400) / 2,
      top: (canvasEditor.height || 400) / 2,
    };
  };

  const createShape = () => {
    if (!canvasEditor) return;
    const center = getCanvasCenter();
    const commonProps = {
      fill: noFill ? "transparent" : fillColor,
      stroke: strokeColor,
      strokeWidth,
      selectable: true,
      evented: true,
      originX: "center" as const,
      originY: "center" as const,
      left: center.left,
      top: center.top,
    };

    let shape: FabricObject;

    switch (shapeType) {
      case "rect":
        shape = new Rect({ ...commonProps, width: 120, height: 80, rx: cornerRadius, ry: cornerRadius });
        break;
      case "circle":
        shape = new FabricCircle({ ...commonProps, radius: 50 });
        break;
      case "ellipse":
        shape = new Ellipse({ ...commonProps, rx: 60, ry: 40 });
        break;
      case "triangle":
        shape = new FabricTriangle({ ...commonProps, width: 100, height: 100 });
        break;
      case "line":
        shape = new Line([center.left - 60, center.top, center.left + 60, center.top], {
          stroke: strokeColor,
          strokeWidth: strokeWidth || 2,
          selectable: true,
          evented: true,
          originX: "center",
          originY: "center",
          left: center.left,
          top: center.top,
        });
        break;
      case "arrow": {
        const line = new Line([-60, 0, 40, 0], {
          stroke: strokeColor,
          strokeWidth: strokeWidth || 2,
          originX: "center",
          originY: "center",
        });
        const head = new FabricTriangle({
          width: 16,
          height: 16,
          fill: strokeColor,
          stroke: strokeColor,
          strokeWidth: 0,
          originX: "center",
          originY: "center",
          left: 48,
          angle: 90,
        });
        const group = new Group([line, head], {
          selectable: true,
          evented: true,
          left: center.left,
          top: center.top,
          originX: "center",
          originY: "center",
        });
        shape = group;
        break;
      }
    }

    canvasEditor.add(shape);
    canvasEditor.setActiveObject(shape);
    canvasEditor.requestRenderAll();
  };

  if (!canvasEditor) {
    return <p className="text-xs text-muted-foreground">Canvas not ready</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Type
        </p>
        <div className="grid grid-cols-3 gap-1">
          {SHAPE_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setShapeType(id)}
              aria-label={`${label} shape`}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-md p-2 transition-colors duration-100 ease-out active:scale-[0.97] ${
                shapeType === id
                  ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Style
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Fill</label>
            <button
              type="button"
              onClick={() => setNoFill(!noFill)}
              aria-label={noFill ? "Enable fill" : "Disable fill"}
              className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                noFill
                  ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ban className="size-3" />
              None
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => {
                setFillColor(e.target.value);
                setNoFill(false);
              }}
              className="size-8 cursor-pointer rounded border border-border bg-transparent disabled:opacity-30"
              disabled={noFill}
              aria-label="Fill color"
            />
            <Input
              value={noFill ? "transparent" : fillColor}
              onChange={(e) => {
                setFillColor(e.target.value);
                setNoFill(false);
              }}
              placeholder="#4f46e5"
              className="h-8 flex-1 text-[12px] tabular-nums"
              disabled={noFill}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Stroke</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="size-8 cursor-pointer rounded border border-border bg-transparent"
              aria-label="Stroke color"
            />
            <Input
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              placeholder="#000000"
              className="h-8 flex-1 text-[12px] tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Stroke width</label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {strokeWidth}px
            </span>
          </div>
          <Slider
            value={[strokeWidth]}
            onValueChange={([v]) => setStrokeWidth(v)}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {shapeType === "rect" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-muted-foreground">Corner radius</label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {cornerRadius}px
            </span>
          </div>
          <Slider
            value={[cornerRadius]}
            onValueChange={([v]) => setCornerRadius(v)}
            min={0}
            max={40}
            step={1}
            className="w-full"
          />
        </div>
      )}

      <Button
        onClick={createShape}
        className="h-8 w-full gap-1.5 rounded-md bg-[#0d99ff] text-xs font-medium text-white shadow-none hover:bg-[#0d99ff]/90"
      >
        <MousePointerClick className="size-3.5" />
        Add {SHAPE_TYPES.find((s) => s.id === shapeType)?.label}
      </Button>
    </div>
  );
}
