"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Search,
  Loader2,
  Eraser,
  Info,
  Check,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import fabric, { FabricImage } from "fabric";
import { Project } from "@/utils/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

const POPULAR_THEMES = [
  "Studio",
  "Gradient",
  "Minimalist",
  "Nature",
  "Office",
  "Abstract",
];

export function BackgroundControls({ project }: { project: Project }) {
  const { canvasEditor, processingMessage, setProcessingMessage, saveState } =
    useCanvas();
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const getMainImage = () => {
    if (!canvasEditor) return null;
    const active = canvasEditor.getActiveObject();
    if (active && (active.type === "image" || active instanceof FabricImage)) {
      return active as FabricImage;
    }
    const objects = canvasEditor.getObjects();
    return (
      (objects.find(
        (obj: fabric.Object) =>
          obj.type === "image" || obj instanceof FabricImage,
      ) as FabricImage) || null
    );
  };

  const handleBackgroundRemoval = async () => {
    const mainImage = getMainImage();
    if (!mainImage || !project) return;

    setProcessingMessage("Removing background with AI...");

    try {
      const currentImageUrl =
        project.currentImageUrl || project.originalImageUrl;

      if (!currentImageUrl) {
        setProcessingMessage(null);
        toast.error("No image found to remove background from");
        return;
      }

      const bgRemovedUrl = currentImageUrl.includes("ik.imagekit.io")
        ? `${currentImageUrl.split("?")[0]}?tr=e-bgremove`
        : currentImageUrl;

      const processedImage = await FabricImage.fromURL(bgRemovedUrl, {
        crossOrigin: "anonymous",
      });

      const currentProps = {
        left: mainImage.left,
        top: mainImage.top,
        scaleX: mainImage.scaleX,
        scaleY: mainImage.scaleY,
        angle: mainImage.angle,
        originX: mainImage.originX,
        originY: mainImage.originY,
      };

      canvasEditor.remove(mainImage);
      processedImage.set(currentProps);
      canvasEditor.add(processedImage);
      processedImage.setCoords();

      canvasEditor.setActiveObject(processedImage);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();
      saveState();

      toast.success("Background removed with AI");
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  };

  const handleRemoveBackground = () => {
    if (!canvasEditor) return;

    canvasEditor.backgroundColor = null;
    canvasEditor.backgroundImage = null;
    canvasEditor.requestRenderAll();
    saveState();
    toast.success("Canvas background cleared");
  };

  const searchUnsplashImages = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q || !UNSPLASH_ACCESS_KEY) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(q)}&per_page=12`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to search images");

      const data = await response.json();
      setUnsplashImages(data.results || []);
    } catch (error) {
      console.error("Error searching Unsplash:", error);
      toast.error("Failed to fetch backdrops. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageBackground = async (imageUrl: string, imageId: string) => {
    if (!canvasEditor) return;

    setSelectedImageId(imageId);
    try {
      if (UNSPLASH_ACCESS_KEY) {
        fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }).catch(() => {});
      }

      const fabricImage: fabric.Image = await FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      });

      const canvasWidth: number = project.width;
      const canvasHeight: number = project.height;

      const scaleX: number = canvasWidth / (fabricImage.width || 1);
      const scaleY: number = canvasHeight / (fabricImage.height || 1);

      const scale: number = Math.max(scaleX, scaleY);

      fabricImage.set({
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        left: canvasWidth / 2,
        top: canvasHeight / 2,
      });

      canvasEditor.backgroundImage = fabricImage;
      canvasEditor.requestRenderAll();
      saveState();
      setSelectedImageId(null);
      toast.success("Backdrop applied to canvas");
    } catch (error) {
      console.error("Error setting background image:", error);
      toast.error("Failed to set backdrop image.");
      setSelectedImageId(null);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchUnsplashImages();
    }
  };

  if (!canvasEditor) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  const hasMainImage = !!getMainImage();

  return (
    <div className="flex flex-col gap-3.5">
      {/* AI Background Removal Card */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-muted/30 to-background p-3 shadow-xs">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <Wand2 className="size-3.5 text-[#0d99ff]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              AI Background Remover
            </span>
          </div>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
            PRO
          </span>
        </div>

        <p className="pb-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Instantly cut out subjects and remove complex backgrounds using neural edge detection.
        </p>

        <Button
          onClick={handleBackgroundRemoval}
          disabled={!!processingMessage || !hasMainImage}
          className="h-8.5 w-full gap-2 rounded-lg bg-gradient-to-r from-[#0d99ff] to-[#0066cc] text-xs font-semibold text-white shadow-xs transition-all hover:from-[#0d99ff]/90 hover:to-[#0066cc]/90 active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {processingMessage ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Processing AI...
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              Remove Background
            </>
          )}
        </Button>

        {!hasMainImage && (
          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="size-3 text-[#0d99ff]" />
            Select or add an image on canvas to use AI removal.
          </p>
        )}
      </div>

      {/* AI Scene & Backdrop Replacement */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Backdrop Scenes
          </p>
          <span className="text-[10px] text-muted-foreground">Unsplash</span>
        </div>

        {/* Quick Theme Pills */}
        <div className="flex flex-wrap gap-1">
          {POPULAR_THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => {
                setSearchQuery(theme);
                searchUnsplashImages(theme);
              }}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer",
                searchQuery.toLowerCase() === theme.toLowerCase()
                  ? "border-[#0d99ff] bg-[#0d99ff]/10 text-[#0d99ff]"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {theme}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="flex gap-1.5 pt-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            placeholder="Search scenes (e.g. sunset, wall)..."
            className="h-8 text-xs placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            onClick={() => searchUnsplashImages()}
            disabled={isSearching || !searchQuery.trim()}
            className="h-8 px-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
          >
            {isSearching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
          </Button>
        </div>

        {/* Search Results Grid */}
        {unsplashImages && unsplashImages.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:none]">
              {unsplashImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative h-16 cursor-pointer overflow-hidden rounded-lg border border-border/80 transition-all hover:border-[#0d99ff]"
                  onClick={() =>
                    handleImageBackground(image.urls.regular, image.id)
                  }
                  title={`Photo by ${image.user.name}`}
                >
                  <img
                    src={image.urls.small}
                    alt={image.alt_description || "Backdrop"}
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {selectedImageId === image.id ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 className="size-4 animate-spin text-white" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                      <Check className="size-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clear Backdrop Action */}
      <div className="pt-1">
        <Button
          type="button"
          onClick={handleRemoveBackground}
          variant="outline"
          className="h-8 w-full gap-1.5 rounded-lg border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Eraser className="size-3.5" />
          Clear Canvas Backdrop
        </Button>
      </div>
    </div>
  );
}
