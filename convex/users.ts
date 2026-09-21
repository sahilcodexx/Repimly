import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

import { User } from "../utils/types";

export const store = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new Error("Called storeUser without authentication present");

    // Find existing user by token
    let user = (await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()) as User | null;

    if (identity.email) {
      const emailUsers = (await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .collect()) as User[];

      if (emailUsers.length > 1) {
        // If duplicate users exist for this email, consolidate to the one with projects
        const primaryUser =
          emailUsers.find((u) => u.projectUsed > 0) || emailUsers[0];
        for (const u of emailUsers) {
          if (u._id !== primaryUser._id) {
            // Reassign any projects if any exist
            const userProjects = await ctx.db
              .query("project")
              .withIndex("by_user", (q) => q.eq("userId", u._id))
              .collect();
            for (const p of userProjects) {
              await ctx.db.patch(p._id, { userId: primaryUser._id });
            }
            await ctx.db.delete(u._id);
          }
        }
        user = primaryUser;
      } else if (!user && emailUsers.length === 1) {
        user = emailUsers[0];
      }
    }

    if (user) {
      // Update tokenIdentifier and name if changed
      await ctx.db.patch(user._id, {
        tokenIdentifier: identity.tokenIdentifier,
        name: identity.name ?? user.name,
        lastActive: Date.now(),
      });
      return user._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      plan: "free",
      projectUsed: 0,
      exportProjectThisMonth: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  handler: async (ctx): Promise<User | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let user = (await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()) as User | null;

    if (!user && identity.email) {
      const emailUsers = (await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .collect()) as User[];
      user =
        emailUsers.find((u) => u.projectUsed > 0) || emailUsers[0] || null;
    }

    if (!user) return null;

    return user;
  },
});
