import { Dispatch, SetStateAction } from "react";
import { Id } from "../convex/_generated/dataModel";
import { ComponentType } from "react";
import { ComponentProps } from "react";

type LucideReact = any;

type IconType = ComponentType<ComponentProps<any>>;

export type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  restrictedTool: string;
  reason: string;
};

export interface Project {
  _id: string;
  title: string;
  userId: string;
  canvasState: unknown;
  width: number;
  height: number;
  originalImageUrl?: string;
  currentImageUrl?: string;
  thumbnailUrl?: string;
  activeTransformation?: string;
  backgroundRemove?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type UpdateDate = {
  updatedAt: number;
  canvasState?: unknown;
  width?: number;
  height?: number;
  currentImageUrl?: string;
  thumbnailUrl?: string;
  activeTransformation?: string;
  backgroundRemove?: boolean;
};

export type User = {
  _id: Id<"users">;
  _creationTime: number; // Convex adds this automatically
  name: string;
  tokenIdentifier: string;
  email: string;
  plan: "free" | "pro";
  projectUsed: number;
  exportProjectThisMonth: number;
  createdAt: number;
  lastActive: number;
  imageUrl?: string; // optional
};

export type CanvasContextType = {
  canvasEditor: any;
  setCanvasEditor: Dispatch<SetStateAction<any>>;
  activeTool: string;
  processingMessage: string | null;
  setProcessingMessage: Dispatch<SetStateAction<string | null>>;
  onToolChange: Dispatch<SetStateAction<string>>;
  history: string[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  saveState: () => void;
  isSaving: boolean;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
};

export interface ToolConfig {
  title: string;
  icon: IconType;
  description: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  filterClass: any;
  valueKey: string;
  transform: (value: number) => number;
  suffix?: string;
}

export type ToolId =
  | "resize"
  | "crop"
  | "adjust"
  | "text"
  | "background"
  | "ai_extender"
  | "ai_edit"
  | "layers"
  | "shapes";
