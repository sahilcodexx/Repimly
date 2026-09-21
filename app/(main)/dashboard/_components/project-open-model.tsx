"use client";

import UpgradeModel from "@/components/common/upgrade-model";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { AlertTriangleIcon, ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

type ProjectOpenModelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ProjectOpenModel = ({ isOpen, onClose }: ProjectOpenModelProps) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showupgrade, setShowupgrade] = useState<boolean>(false);
  const router = useRouter();

  const { isFree, canCreateProject } = usePlanAccess();
  const { data: project } = useConvexQuery(api.project.getUserProjects);
  const { mutate: createProject } = useConvexMutation(api.project.create);

  const currenprojectcount = Array.isArray(project) ? project.length : 0;
  const canCreate = canCreateProject(currenprojectcount);

  const handleCreateProject = async () => {
    if (!canCreate) {
      setShowupgrade(true);
      return;
    }

    if (!selectedFile || !projectTitle.trim()) {
      toast.error("Please select an Image and enter a project title");
      return;
    }
    setIsUploading(true);

    try {
      if (!selectedFile) {
        throw new Error("No file selected");
      }
      const formData = new FormData();
      formData.append("file", selectedFile as Blob);
      formData.append("fileName", selectedFile.name);

      const uploadResponse = await fetch("/api/imagekit/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "failed to upload image");
      }

      const projectId = await createProject({
        title: projectTitle.trim(),
        originalImageUrl: uploadData.url,
        currentImageUrl: uploadData.url,
        thumbnailUrl: uploadData.url,
        width: uploadData.width || 800,
        height: uploadData.height || 600,
        canvasState: null,
      });

      toast.success("Project created Succesfully!");
      router.push(`/editor/${projectId}`);
    } catch (error: unknown) {
      console.log(error);
      toast.error(
        error instanceof Error
          ? error.message
          : String(error) || "failed to create porject. Please try again",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handelChange = () => {
    onClose();
    setSelectedFile(null);
    setPreviewUrl("");
    setProjectTitle("");
    setIsUploading(false);
  };

  const onDrop = (acceptedFile: File[]) => {
    const file = acceptedFile[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setProjectTitle(nameWithoutExt);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={handelChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Your Project</DialogTitle>
            {isFree && <Badge> {currenprojectcount}/3 Projects </Badge>}
            <div>
              {isFree && currenprojectcount >= 2 && (
                <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                  <AlertTriangleIcon />

                  <AlertTitle>
                    <p>
                      {currenprojectcount === 2
                        ? "This is your last free Project"
                        : "Your Project limit is reached"}
                    </p>
                  </AlertTitle>
                  <AlertDescription>
                    <p>
                      {currenprojectcount === 2
                        ? "This will be your last free project. Upgrade to Pro for Unlimated projects"
                        : "Free plan is limited to 3 projects"}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-primary/20 hover:border-primary/40 cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${!canCreate && "pointer-events-none opacity-50"}`}
              >
                <input {...getInputProps()} />
                <Upload className="text-primary mx-auto mb-4 min-h-12 w-12 opacity-70" />
                <h2 className="mb-2 text-lg">
                  {isDragActive
                    ? " Drop the Image here"
                    : " Upload your image "}
                </h2>
                <p className="mb-2 opacity-90">
                  {canCreate
                    ? "Drag and drop your image, or click to browse"
                    : " Upgrade to Pro to Create more Project "}
                </p>
                <p className="text-sm opacity-70">
                  Supports PNG,JPG,WEBP up to 20MB
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <Image
                    src={previewUrl}
                    width={600}
                    height={500}
                    alt="image"
                    className="h-65 w-full rounded-sm border border-neutral-400/40 object-cover dark:border-neutral-600"
                  />
                  <Button
                    size={"icon"}
                    variant={"ghost"}
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                      setProjectTitle("");
                    }}
                    className="absolute top-2 right-2 rounded-full bg-neutral-300 shadow-md dark:bg-neutral-700"
                  >
                    <X />
                  </Button>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="project-title">Project Title</Label>
                  <Input
                    id="project-title"
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div
                  className={`dark:bg-input/30 border-input flex h-18 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm`}
                >
                  <div className="flex items-center gap-4">
                    <ImageIcon className="text-primary h-5 w-5" />
                    <div>
                      <p>{projectTitle} </p>
                      <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>

          <DialogFooter>
            <Button
              onClick={handleCreateProject}
              disabled={!selectedFile || !projectTitle.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpgradeModel
        isOpen={showupgrade}
        onClose={() => setShowupgrade(false)}
        restrictedTool="project"
        reason="Free plan is limited to 3 projects. Upgrade to Pro for unlimated projects and access to all AI editing tools"
      />
    </div>
  );
};

export default ProjectOpenModel;
