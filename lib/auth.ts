import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "./db";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Get the current session (server-side)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      workspace: true,
    },
  });

  return user;
}

/**
 * Check if user has access to a workspace
 */
export async function hasWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      workspaceId: workspaceId,
    },
  });

  return !!user;
}

/**
 * Check if user is workspace admin
 */
export async function isWorkspaceAdmin(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      workspaceId: workspaceId,
      role: "admin",
    },
  });

  return !!user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Require workspace access - throws if no access
 */
export async function requireWorkspaceAccess(workspaceId: string) {
  const user = await requireAuth();

  const hasAccess = await hasWorkspaceAccess(user.id, workspaceId);

  if (!hasAccess) {
    throw new Error("Forbidden - No access to this workspace");
  }

  return user;
}
