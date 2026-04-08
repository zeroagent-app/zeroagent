import { Router } from "express";
import { db, messagesTable, bookingsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/:bookingId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const bookingId = parseInt(String(req.params.bookingId ?? ""));
  if (isNaN(bookingId)) { res.status(400).json({ error: "Invalid bookingId" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.status !== "approved") { res.status(403).json({ error: "Chat only available for approved bookings" }); return; }
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.bookingId, bookingId));
  const enriched = await Promise.all(messages.map(async (m) => {
    const [sender] = await db.select({ name: usersTable.name, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, m.senderId));
    return {
      id: m.id,
      bookingId: m.bookingId,
      senderId: m.senderId,
      senderName: sender?.name ?? "",
      senderRole: sender?.role ?? "user",
      message: m.message,
      createdAt: m.createdAt,
    };
  }));
  res.json(enriched);
});

router.post("/:bookingId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const bookingId = parseInt(String(req.params.bookingId ?? ""));
  if (isNaN(bookingId)) { res.status(400).json({ error: "Invalid bookingId" }); return; }
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.status !== "approved") { res.status(403).json({ error: "Chat only available for approved bookings" }); return; }
  const [msg] = await db.insert(messagesTable).values({
    bookingId,
    senderId: req.userId!,
    message: parsed.data.message,
  }).returning();
  const [sender] = await db.select({ name: usersTable.name, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.userId!));
  res.status(201).json({
    id: msg!.id,
    bookingId: msg!.bookingId,
    senderId: msg!.senderId,
    senderName: sender?.name ?? "",
    senderRole: sender?.role ?? "user",
    message: msg!.message,
    createdAt: msg!.createdAt,
  });
});

export default router;
