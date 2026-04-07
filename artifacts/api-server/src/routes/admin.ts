import { Router } from "express";
import { db, usersTable, venuesTable, bookingsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireRole } from "../middlewares/auth";

const router = Router();

router.get("/users", requireRole("admin"), async (req, res): Promise<void> => {
  const users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable);
  res.json(users);
});

router.get("/venues", requireRole("admin"), async (req, res): Promise<void> => {
  const venues = await db
    .select({
      id: venuesTable.id,
      ownerId: venuesTable.ownerId,
      ownerName: usersTable.name,
      name: venuesTable.name,
      description: venuesTable.description,
      city: venuesTable.city,
      address: venuesTable.address,
      capacity: venuesTable.capacity,
      pricePerDay: venuesTable.pricePerDay,
      eventTypes: venuesTable.eventTypes,
      images: venuesTable.images,
      status: venuesTable.status,
      createdAt: venuesTable.createdAt,
    })
    .from(venuesTable)
    .leftJoin(usersTable, eq(venuesTable.ownerId, usersTable.id));
  res.json(venues.map(v => ({ ...v, pricePerDay: Number(v.pricePerDay), ownerName: v.ownerName ?? "" })));
});

router.post("/venues/:id/approve", requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db.update(venuesTable).set({ status: "approved" }).where(eq(venuesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.ownerId));
  res.json({ ...updated, pricePerDay: Number(updated.pricePerDay), ownerName: owner?.name ?? "" });
});

router.post("/venues/:id/reject", requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db.update(venuesTable).set({ status: "rejected" }).where(eq(venuesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.ownerId));
  res.json({ ...updated, pricePerDay: Number(updated.pricePerDay), ownerName: owner?.name ?? "" });
});

router.get("/bookings", requireRole("admin"), async (req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  const enriched = await Promise.all(bookings.map(async b => {
    const [venue] = await db.select({ name: venuesTable.name }).from(venuesTable).where(eq(venuesTable.id, b.venueId));
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.userId));
    return { ...b, venueName: venue?.name ?? "", userName: user?.name ?? "" };
  }));
  res.json(enriched);
});

router.get("/stats", requireRole("admin"), async (req, res): Promise<void> => {
  const [usersRow] = await db.select({ count: count() }).from(usersTable);
  const [ownersRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "owner"));
  const [venuesRow] = await db.select({ count: count() }).from(venuesTable);
  const [pendingVenuesRow] = await db.select({ count: count() }).from(venuesTable).where(eq(venuesTable.status, "pending"));
  const [bookingsRow] = await db.select({ count: count() }).from(bookingsTable);
  const [pendingBookingsRow] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.status, "pending"));
  const [approvedBookingsRow] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.status, "approved"));
  const [paidRow] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.paymentStatus, "paid"));
  const [unpaidRow] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.paymentStatus, "unpaid"));
  res.json({
    totalUsers: usersRow?.count ?? 0,
    totalOwners: ownersRow?.count ?? 0,
    totalVenues: venuesRow?.count ?? 0,
    pendingVenues: pendingVenuesRow?.count ?? 0,
    totalBookings: bookingsRow?.count ?? 0,
    pendingBookings: pendingBookingsRow?.count ?? 0,
    approvedBookings: approvedBookingsRow?.count ?? 0,
    totalRevenue: 0,
    paidBookings: paidRow?.count ?? 0,
    unpaidBookings: unpaidRow?.count ?? 0,
  });
});

export default router;
