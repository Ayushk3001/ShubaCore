import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

type AppRole = "PARTNER" | "STAFF";

export async function requireUser() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  // Auto-link pre-provisioned user by email on first login
  if (!dbUser) {
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (userByEmail) {
        dbUser = await prisma.user.update({
          where: { id: userByEmail.id },
          data: { clerkUserId: userId },
        });
      }
    }
  }

  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }

  return dbUser;
}

export async function getOptionalUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
}

export async function requireRole(roles: AppRole | AppRole[]) {
  const dbUser = await requireUser();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(dbUser.role)) {
    redirect("/unauthorized");
  }

  return dbUser;
}

export async function requirePartner() {
  return requireRole("PARTNER");
}

export async function getClerkProfile() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  return {
    clerkUserId: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
    name: clerkUser.fullName ?? clerkUser.username ?? "Unnamed user",
  };
}

