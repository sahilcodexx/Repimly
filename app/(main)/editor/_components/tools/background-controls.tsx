"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Palette,
  Image as ImageIcon,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useCanvas } from "@/context/context";
import fabric, { FabricImage } from "fabric";
import { Project } from "@/utils/types";
import { toast } from "sonner";

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

export function BackgroundControls({ project }: { project: Project }) {
  const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const getMainImage = () => {
    if (!canvasEditor) return null;
    const objects = canvasEditor.getObjects();
    return objects.find((obj: fabric.Object) => obj.type === "image") || null;
  };

  const handleBackgroundRemoval = async () => {
    const mainImage = getMainImage();
    if (!mainImage || !project) return;

    setProcessingMessage(
      "Removing background with AI...(It will take a few seconds)",
    );

    try {
      const currentImageUrl =
        project.currentImageUrl || project.originalImageUrl;

      if (!currentImageUrl) {
        setProcessingMessage(null);
        alert("No image found to remove background from");
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

      toast.success("Background removed successfully");
    } catch (error) {
      console.error("Error removing background:", error);
      alert("Failed to remove background. Please try again.");
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  };

  const handleColorBackground = () => {
    if (!canvasEditor) return;

    canvasEditor.backgroundImage = null;
    canvasEditor.backgroundColor = backgroundColor;
    canvasEditor.requestRenderAll();
  };

  const handleRemoveBackground = () => {
    if (!canvasEditor) return;

    canvasEditor.backgroundColor = null;
    canvasEditor.backgroundImage = null;
    canvasEditor.requestRenderAll();
  };

  const searchUnsplashImages = async () => {
    if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`,
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
      alert("Failed to search images. Please try again.");
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

      const scaleX: number = canvasWidth / fabricImage.width;
      const scaleY: number = canvasHeight / fabricImage.height;

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
      setSelectedImageId(null);
    } catch (error) {
      console.error("Error setting background image:", error);
      alert("Failed to set background image. Please try again.");
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
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="relative h-full space-y-5">
      <div className="space-y-3 border-b border-border pb-4">
        <div>
          <h3 className="mb-1 text-sm font-medium text-foreground">AI Background Removal</h3>
          <p className="text-xs text-muted-foreground">
            Automatically remove the background from your image using AI
          </p>
        </div>

        <Button
          onClick={handleBackgroundRemoval}
          disabled={!!processingMessage || !getMainImage()}
          className="w-full"
          variant="default"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Image Background
        </Button>

        {!getMainImage() && (
          <p className="text-xs text-destructive">
            Please add an image to the canvas first to remove its background
          </p>
        )}
      </div>

      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="color">
            <Palette className="mr-2 h-4 w-4" />
            Color
          </TabsTrigger>
          <TabsTrigger value="image">
            <ImageIcon className="mr-2 h-4 w-4" />
            Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="color" className="mt-4 space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-medium text-foreground">Solid Color Background</h3>
            <p className="text-xs text-muted-foreground">
              Choose a solid color for your canvas background
            </p>
          </div>

          <div className="space-y-4">
            <HexColorPicker
              color={backgroundColor}
              onChange={setBackgroundColor}
              style={{ width: "100%" }}
            />

            <div className="flex items-center gap-2">
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
              <div
                className="h-10 w-10 shrink-0 rounded-md border border-border"
                style={{ backgroundColor }}
              />
            </div>

            <Button
              onClick={handleColorBackground}
              className="w-full"
              variant="default"
            >
              <Palette className="mr-2 h-4 w-4" />
              Apply Color
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="image" className="mt-4 space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-medium text-foreground">Image Background</h3>
            <p className="text-xs text-muted-foreground">
              Search and use high-quality images from Unsplash
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search for backgrounds..."
              className="flex-1"
            />
            <Button
              onClick={searchUnsplashImages}
              disabled={isSearching || !searchQuery.trim()}
              variant="default"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {unsplashImages && unsplashImages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">
                Search Results ({unsplashImages?.length})
              </h4>
              <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto">
                {unsplashImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative cursor-pointer overflow-hidden rounded-lg border border-border transition-colors hover:border-foreground/30"
                    onClick={() =>
                      handleImageBackground(image.urls.regular, image.id)
                    }
                  >
                    <img
                      src={image.urls.small}
                      alt={image.alt_description || "Background image"}
                      className="h-24 w-full object-cover"
                    />

                    {selectedImageId === image.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-colors group-hover:bg-background/30 group-hover:opacity-100">
                      <Download className="h-5 w-5 text-foreground" />
                    </div>

                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-background/80 to-transparent p-2 pt-4">
                      <p className="truncate text-xs text-muted-foreground">
                        by {image.user.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSearching && unsplashImages?.length === 0 && searchQuery && (
            <div className="py-8 text-center">
              <ImageIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No images found for "{searchQuery}"
              </p>
              <p className="text-xs text-muted-foreground/60">
                Try a different search term
              </p>
            </div>
          )}

          {!searchQuery && unsplashImages?.length === 0 && (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Search for background images
              </p>
              <p className="text-xs text-muted-foreground/60">Powered by Unsplash</p>
            </div>
          )}

          {!UNSPLASH_ACCESS_KEY && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">
                Unsplash API key not configured. Please add
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to your environment variables.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="w-full border-t border-border pt-4">
        <Button
          onClick={handleRemoveBackground}
          className="w-full"
          variant="outline"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Canvas Background
        </Button>
      </div>
    </div>
  );
}
