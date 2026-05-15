import { Request, Response, NextFunction } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      dbUserId?: string;
    }
  }
}

// Parses the Clerk session token — non-blocking, does not reject unauthenticated requests
export const clerkInit = clerkMiddleware();

// Verifies auth and resolves (or auto-creates) the User row in Postgres
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
      user = await prisma.user.create({
        data: { clerkUserId, email: `${clerkUserId}@pending.agrisense` },
      });
    }

    req.dbUserId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}
