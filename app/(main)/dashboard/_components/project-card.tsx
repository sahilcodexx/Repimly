import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Edit, Trash } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProjectCard = ({ project, onEdit }: { project: any; onEdit: any }) => {
  const { mutate: deleteProject, isLoading } = useConvexMutation(
    api.project.deleteProjects,
  );

  const lastUpdated = formatDistanceToNow(new Date(project.updatedAt), {
    addSuffix: true,
  });
  const handelDelete = async () => {
    const confirmed = confirm(
      `Are you sure, you want to delete "${project.title}"? This action cannot be undone`,
    );
    if (confirmed) {
      try {
        await deleteProject({ projectID: project._id });
        toast.success("Project Deleted Successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete Project, Please try Again");
      }
    }
  };

  return (
    <Card className="group relative overflow-hidden pt-0 transition-all duration-200 hover:scale-[1.02] hover:transform hover:border-white/20">
      <div className="relative aspect-video">
        {project.thumbnailUrl && (
          <Image
            src={project.thumbnailUrl}
            width={600}
            height={400}
            alt="projcet"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <CardContent>
        <p className="mb-1 mb-2 truncate text-2xl capitalize">
          {project.title}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant={"secondary"}>
            W {project.width} x H {project.height}
          </Badge>
          <p className="text-muted-foreground mt-2 text-xs capitalize">
            {lastUpdated}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between gap-3">
          <Button onClick={handelDelete} size={"sm"} variant={"destructive"}>
            <Trash /> Delete
          </Button>
          <Button
            onClick={onEdit}
            size={"sm"}
            variant={"outline"}
          >
            <Edit /> Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
