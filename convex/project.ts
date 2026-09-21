import { v } from "convex/values";
import { Project, UpdateDate } from "../utils/types";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    originalImageUrl: v.optional(v.string()),
    currentImageUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    width: v.number(),
    height: v.number(),
    canvasState: v.optional(v.any()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      title: string;
      originalImageUrl?: string;
      currentImageUrl?: string;
      thumbnailUrl?: string;
      width: number;
      height: number;
      canvasState?: unknown;
    },
  ): Promise<string> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    if (user.plan === "free") {
      const projectCount = await ctx.db
        .query("project")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      if (projectCount.length >= 3) {
        throw new Error("Free plan limited to 3 project");
      }
    }

    const projectID = await ctx.db.insert("project", {
      title: args.title,
      userId: user._id,
      canvasState: (args.canvasState as unknown) || {},
      width: args.width,
      height: args.height,
      originalImageUrl: args.originalImageUrl,
      currentImageUrl: args.currentImageUrl,
      thumbnailUrl: args.thumbnailUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(user._id, {
      projectUsed: user.projectUsed + 1,
      lastActive: Date.now(),
    });

    return projectID;
  },
});

export const getUserProjects = query({
  handler: async (ctx: QueryCtx): Promise<Project[]> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) return [];
    const projects = await ctx.db
      .query("project")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return projects;
  },
});

export const deleteProjects = mutation({
  args: { projectID: v.id("project") },
  handler: async (
    ctx: MutationCtx,
    args: { projectID: Id<"project"> },
  ): Promise<{ success: boolean }> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("Not Authenticated");
    }

    const project = (await ctx.db.get(args.projectID)) as Project | null;

    if (!project) {
      throw new Error("Project not found");
    }

    if (!user || project.userId !== user._id) {
      throw new Error("access denied");
    }

    await ctx.db.delete(args.projectID);

    await ctx.db.patch(user._id, {
      projectUsed: Math.max(0, user.projectUsed - 1),
      lastActive: Date.now(),
    });
    return { success: true };
  },
});

export const getProject = query({
  args: { projectId: v.id("project") },
  handler: async (
    ctx: QueryCtx,
    args: { projectId: Id<"project"> },
  ): Promise<Project | null> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== user._id) {
      throw new Error("Access Denied");
    }
    return project;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("project"),
    canvasState: v.optional(v.any()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    currentImageUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    activeTransformation: v.optional(v.string()),
    backgroundRemove: v.optional(v.boolean()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      projectId: Id<"project">;
      canvasState?: unknown;
      width?: number;
      height?: number;
      currentImageUrl?: string;
      thumbnailUrl?: string;
      activeTransformation?: string;
      backgroundRemove?: boolean;
    },
  ): Promise<Id<"project">> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("Not Authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (!user || project?.userId !== user._id) {
      throw new Error("Access Denied");
    }

    const updateData: UpdateDate = {
      updatedAt: Date.now(),
    };
    if (args.canvasState !== undefined)
      updateData.canvasState = args.canvasState;
    if (args.width !== undefined) updateData.width = args.width;
    if (args.height !== undefined) updateData.height = args.height;
    if (args.currentImageUrl !== undefined)
      updateData.currentImageUrl = args.currentImageUrl;
    if (args.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = args.thumbnailUrl;
    if (args.activeTransformation !== undefined)
      updateData.activeTransformation = args.activeTransformation;
    if (args.backgroundRemove !== undefined)
      updateData.backgroundRemove = args.backgroundRemove;

    await ctx.db.patch(args.projectId, updateData);

    // Update user's last active time
    await ctx.db.patch(user._id, {
      lastActive: Date.now(),
    });

    return args.projectId;
  },
});
