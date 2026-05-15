import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Clerk sends webhook events as JSON with a svix-signature header.
// Full signature verification requires the svix library — add it if needed.
router.post("/clerk", async (req: Request, res: Response) => {
  const event = req.body;

  try {
    if (event.type === "user.created") {
      const { id: clerkUserId, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses?.[0]?.email_address ?? `${clerkUserId}@pending.agrisense`;
      const name  = [first_name, last_name].filter(Boolean).join(" ") || null;

      await prisma.user.upsert({
        where:  { clerkUserId },
        create: { clerkUserId, email, name },
        update: { email, name },
      });
    }

    if (event.type === "user.updated") {
      const { id: clerkUserId, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses?.[0]?.email_address;
      const name  = [first_name, last_name].filter(Boolean).join(" ") || undefined;

      await prisma.user.update({
        where: { clerkUserId },
        data:  { ...(email && { email }), ...(name !== undefined && { name }) },
      });
    }

    if (event.type === "user.deleted") {
      const { id: clerkUserId } = event.data;
      await prisma.user.deleteMany({ where: { clerkUserId } });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
