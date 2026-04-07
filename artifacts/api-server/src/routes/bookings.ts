import { Router } from "express";
import { db, bookingsTable, venuesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateBookingBody, RejectBookingBody, UpdatePaymentStatusBody } from "@workspace/api-zod";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [venue] = await db.select({ name: venuesTable.name }).from(venuesTable).where(eq(venuesTable.id, booking.venueId));
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.userId));
  return {
    ...booking,
    venueName: venue?.name ?? "",
    userName: user?.name ?? "",
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { status } = req.query as { status?: string };
  let query = db.select().from(bookingsTable);

  let bookings: (typeof bookingsTable.$inferSelect)[];
  if (req.userRole === "user") {
    bookings = await db.select().from(bookingsTable).where(
      status
        ? and(eq(bookingsTable.userId, req.userId!), eq(bookingsTable.status, status as "pending" | "approved" | "rejected" | "cancelled"))
        : eq(bookingsTable.userId, req.userId!)
    );
  } else if (req.userRole === "owner") {
    const myVenues = await db.select({ id: venuesTable.id }).from(venuesTable).where(eq(venuesTable.ownerId, req.userId!));
    const venueIds = myVenues.map(v => v.id);
    if (venueIds.length === 0) { res.json([]); return; }
    bookings = await db.select().from(bookingsTable).where(
      status
        ? and(
            eq(bookingsTable.status, status as "pending" | "approved" | "rejected" | "cancelled"),
          )
        : eq(bookingsTable.venueId, venueIds[0]!)
    );
    bookings = bookings.filter(b => venueIds.includes(b.venueId));
  } else {
    bookings = status
      ? await db.select().from(bookingsTable).where(eq(bookingsTable.status, status as "pending" | "approved" | "rejected" | "cancelled"))
      : await db.select().from(bookingsTable);
  }

  const enriched = await Promise.all(bookings.map(enrichBooking));
  res.json(enriched);
});

router.post("/", requireRole("user"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { venueId, eventDate, eventType, guestCount, notes } = parsed.data;
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue || venue.status !== "approved") { res.status(400).json({ error: "Venue not available" }); return; }
  const [booking] = await db.insert(bookingsTable).values({
    venueId,
    userId: req.userId!,
    eventDate,
    eventType,
    guestCount,
    notes,
    status: "pending",
    paymentStatus: "unpaid",
  }).returning();
  const enriched = await enrichBooking(booking!);
  res.status(201).json(enriched);
});

router.get("/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, booking.venueId));
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.userId));
  const enrichedVenue = venue ? {
    ...venue,
    pricePerDay: Number(venue.pricePerDay),
    ownerName: "",
  } : undefined;
  res.json({
    ...booking,
    venueName: venue?.name ?? "",
    userName: user?.name ?? "",
    venue: enrichedVenue,
    chatEnabled: booking.status === "approved",
  });
});

router.post("/:id/approve", requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, booking.venueId));
  if (!venue || venue.ownerId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(bookingsTable).set({ status: "approved" }).where(eq(bookingsTable.id, id)).returning();
  res.json(await enrichBooking(updated!));
});

router.post("/:id/reject", requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = RejectBookingBody.safeParse(req.body);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, booking.venueId));
  if (!venue || venue.ownerId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(bookingsTable).set({
    status: "rejected",
    rejectionReason: parsed.success ? (parsed.data.reason ?? null) : null,
  }).where(eq(bookingsTable.id, id)).returning();
  res.json(await enrichBooking(updated!));
});

router.post("/:id/cancel", requireRole("user"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, id)).returning();
  res.json(await enrichBooking(updated!));
});

router.patch("/:id/payment", requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdatePaymentStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(bookingsTable).set({ paymentStatus: parsed.data.paymentStatus }).where(eq(bookingsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichBooking(updated));
});

export default router;
