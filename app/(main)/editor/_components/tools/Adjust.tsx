"use client";
import fabric, { filters, Image as FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCanvas } from "@/context/context";
import { FilterConfig } from "@/utils/types";
import { RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "brightness",
    label: "Brightness",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Brightness,
    valueKey: "brightness",
    transform: (value) => value / 100,
  },
  {
    key: "contrast",
    label: "Contrast",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Contrast,
    valueKey: "contrast",
    transform: (value) => value / 100,
  },
  {
    key: "saturation",
    label: "Saturation",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Saturation,
    valueKey: "saturation",
    transform: (value) => value / 100,
  },
  {
    key: "vibrance",
    label: "Vibrance",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Vibrance,
    valueKey: "vibrance",
    transform: (value) => value / 100,
  },
  {
    key: "blur",
    label: "Blur",
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Blur,
    valueKey: "blur",
    transform: (value) => value / 100,
  },
  {
    key: "hue",
    label: "Hue",
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
    filterClass: filters.HueRotation,
    valueKey: "rotation",
    transform: (value) => value * (Math.PI / 180),
    suffix: "°",
  },
];

const DEFAULT_VALUES = FILTER_CONFIGS.reduce(
  (acc, config) => {
    acc[config.key] = config.defaultValue;
    return acc;
  },
  {} as Record<string, number>,
);

const AdjustControl = () => {
  const [filterValues, setFilterValues] = useState(DEFAULT_VALUES);
  const [isApplying, setIsApplying] = useState(false);
  const { projectid } = useParams();
  const { canvasEditor } = useCanvas();

  const getLocalStorageKey = () => `project-filters-${projectid}`;

  const getActiveImage = (): FabricImage | null => {
    if (!canvasEditor) return null;
    const activeObject = canvasEditor.getActiveObject();
    if (activeObject && activeObject.type === "image")
      return activeObject as FabricImage;
    const objects = canvasEditor.getObjects();
    return (
      (objects.find(
        (obj: fabric.Object) => obj.type === "image",
      ) as FabricImage) || null
    );
  };

  const extractFilterValues = (imageObject: FabricImage | null) => {
    if (!imageObject?.filters?.length) return DEFAULT_VALUES;
    const extractedValue = { ...DEFAULT_VALUES };
    imageObject.filters.forEach((filter) => {
      const config = FILTER_CONFIGS.find(
        (c) => c.filterClass.name === filter.constructor.name,
      );
      if (config) {
        const filterValue = (filter as any)[config.valueKey];
        if (config.key === "hue") {
          extractedValue[config.key] = Math.round(
            filterValue * (180 / Math.PI),
          );
        } else {
          extractedValue[config.key] = Math.round(filterValue * 100);
        }
      }
    });
    return extractedValue;
  };


  useEffect(() => {
    const imageObject = getActiveImage();
    if (!imageObject) return;

    const savedFilters = localStorage.getItem(getLocalStorageKey());

    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      setFilterValues(parsedFilters);
      applyFilters(parsedFilters);
    } else {
      const existingValues = extractFilterValues(imageObject);
      setFilterValues(existingValues);
    }
  }, [canvasEditor]);

  const applyFilters = async (newValue: Record<string, number>) => {
    const imageObject = getActiveImage();
    if (!imageObject || isApplying) return;

    setIsApplying(true);

    try {
      const filtersToApply:any[] = [];
      FILTER_CONFIGS.forEach((config) => {
        const value = newValue[config.key];
        if (value !== config.defaultValue) {
          const transformedValue = config.transform(value);
          filtersToApply.push(
            new (config.filterClass as any)({
              [config.valueKey]: transformedValue,
            }),
          );
        }
      });
      imageObject.filters = filtersToApply;

      await new Promise<void>((resolve) => {
        imageObject.applyFilters();
        canvasEditor.requestRenderAll();
        setTimeout(() => {
          canvasEditor.fire("object:modified", { target: imageObject });
          resolve();
        }, 50);
      });

      localStorage.setItem(getLocalStorageKey(), JSON.stringify(newValue));
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const resetFilters = () => {
    setFilterValues(DEFAULT_VALUES);
    applyFilters(DEFAULT_VALUES);
    localStorage.removeItem(getLocalStorageKey());
    const imageObject = getActiveImage();
    if (imageObject) {
      imageObject.filters = [];
      imageObject.applyFilters();
      canvasEditor.requestRenderAll();
      canvasEditor.fire("object:modified", { target: imageObject });
    }
  };

  const handleValueChange = (
    filterKey: string,
    value: number | number[],
  ) => {
    const newValue = {
      ...filterValues,
      [filterKey]: Array.isArray(value) ? value[0] : value,
    };
    setFilterValues(newValue);
    applyFilters(newValue);
  };

  if (!canvasEditor) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Load an image to start adjusting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Image Adjustments</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-7 gap-1 text-xs text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
      {FILTER_CONFIGS.map((config) => (
        <div key={config.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">{config.label}</label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {filterValues[config.key]}
              {config.suffix || ""}
            </span>
          </div>
          <Slider
            value={[filterValues[config.key]]}
            onValueChange={(value) => handleValueChange(config.key, value)}
            min={config.min}
            max={config.max}
            step={config.step}
            className="w-full"
          />
        </div>
      ))}
      {isApplying && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border border-foreground/30 border-t-foreground/80" />
          Applying filters...
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Adjustments are applied in real-time. Use the{" "}
          <span className="text-primary"> Reset button </span> to restore
          original values.
        </p>
      </div>
    </div>
  );
};

export default AdjustControl;
