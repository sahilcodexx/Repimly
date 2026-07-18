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
      fill: fillColor,
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
        shape = new Rect({ ...commonProps, width: 120, height: 80, rx: 4, ry: 4 });
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
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">Shape Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {SHAPE_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setShapeType(id)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                shapeType === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Style</h3>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Fill Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <Input
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              placeholder="#4f46e5"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Stroke Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <Input
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Stroke Width</label>
            <span className="text-xs tabular-nums text-muted-foreground">
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

      <Button onClick={createShape} className="w-full gap-2" variant="default">
        <MousePointerClick className="h-4 w-4" />
        Add {SHAPE_TYPES.find((s) => s.id === shapeType)?.label}
      </Button>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          Customize your shape below, then click to add it to the canvas.
          Shapes can be resized and rotated after placement.
        </p>
      </div>
    </div>
  );
}
