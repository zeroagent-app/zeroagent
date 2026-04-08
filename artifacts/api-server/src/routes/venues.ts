import { Router } from "express";
import { db, venuesTable, usersTable, bookingsTable } from "@workspace/db";
import { eq, and, gte, lte, count, countDistinct } from "drizzle-orm";
import { CreateVenueBody, UpdateVenueBody } from "@workspace/api-zod";
import { requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

const baseVenueSelect = {
  id: venuesTable.id,
  ownerId: venuesTable.ownerId,
  ownerName: usersTable.name,
  name: venuesTable.name,
  description: venuesTable.description,
  city: venuesTable.city,
  area: venuesTable.area,
  address: venuesTable.address,
  capacity: venuesTable.capacity,
  pricePerDay: venuesTable.pricePerDay,
  eventTypes: venuesTable.eventTypes,
  images: venuesTable.images,
  videos: venuesTable.videos,
  status: venuesTable.status,
  createdAt: venuesTable.createdAt,
};

router.get("/stats", async (req, res): Promise<void> => {
  const [totalVenuesRow] = await db.select({ count: count() }).from(venuesTable).where(eq(venuesTable.status, "approved"));
  const [totalBookingsRow] = await db.select({ count: count() }).from(bookingsTable);
  const [totalCitiesRow] = await db.select({ count: countDistinct(venuesTable.city) }).from(venuesTable).where(eq(venuesTable.status, "approved"));
  const [totalUsersRow] = await db.select({ count: count() }).from(usersTable);
  res.json({
    totalVenues: totalVenuesRow?.count ?? 0,
    totalBookings: totalBookingsRow?.count ?? 0,
    totalCities: totalCitiesRow?.count ?? 0,
    totalUsers: totalUsersRow?.count ?? 0,
  });
});

router.get("/featured", async (req, res): Promise<void> => {
  const venues = await db.select(baseVenueSelect).from(venuesTable).leftJoin(usersTable, eq(venuesTable.ownerId, usersTable.id)).where(eq(venuesTable.status, "approved")).limit(6);
  res.json(venues.map(v => ({ ...v, pricePerDay: Number(v.pricePerDay), ownerName: v.ownerName ?? "" })));
});

router.get("/my", requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const venues = await db.select(baseVenueSelect).from(venuesTable).leftJoin(usersTable, eq(venuesTable.ownerId, usersTable.id)).where(eq(venuesTable.ownerId, req.userId!));
  res.json(venues.map(v => ({ ...v, pricePerDay: Number(v.pricePerDay), ownerName: v.ownerName ?? "" })));
});

router.get("/", async (req, res): Promise<void> => {
  const { city, area, minCapacity, maxPrice, eventType, page = "1", limit = "12" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(venuesTable.status, "approved")];
  if (city) conditions.push(eq(venuesTable.city, city));
  if (area) conditions.push(eq(venuesTable.area, area));
  if (minCapacity) conditions.push(gte(venuesTable.capacity, parseInt(minCapacity)));
  if (maxPrice) conditions.push(lte(venuesTable.pricePerDay, maxPrice));

  const baseQuery = db.select(baseVenueSelect).from(venuesTable).leftJoin(usersTable, eq(venuesTable.ownerId, usersTable.id)).where(and(...conditions));
  const [totalRow] = await db.select({ count: count() }).from(venuesTable).where(and(...conditions));
  const total = totalRow?.count ?? 0;
  let venues = await baseQuery.limit(limitNum).offset(offset);
  if (eventType) venues = venues.filter(v => v.eventTypes.includes(eventType));

  res.json({
    venues: venues.map(v => ({ ...v, pricePerDay: Number(v.pricePerDay), ownerName: v.ownerName ?? "" })),
    total,
    page: pageNum,
    totalPages: Math.ceil(Number(total) / limitNum),
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [venue] = await db.select(baseVenueSelect).from(venuesTable).leftJoin(usersTable, eq(venuesTable.ownerId, usersTable.id)).where(eq(venuesTable.id, id));
  if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }

  const bookedDates = await db.select({ eventDate: bookingsTable.eventDate }).from(bookingsTable).where(and(eq(bookingsTable.venueId, id), eq(bookingsTable.status, "approved")));

  res.json({
    ...venue,
    pricePerDay: Number(venue.pricePerDay),
    ownerName: venue.ownerName ?? "",
    bookedDates: bookedDates.map(b => b.eventDate),
  });
});

router.post("/", requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateVenueBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { name, description, city, area, address, capacity, pricePerDay, eventTypes, images, videos } = parsed.data as any;
  const [venue] = await db.insert(venuesTable).values({
    ownerId: req.userId!,
    name,
    description,
    city,
    area: area ?? null,
    address,
    capacity,
    pricePerDay: String(pricePerDay),
    eventTypes: eventTypes ?? [],
    images: images ?? [],
    videos: videos ?? [],
    status: "pending",
  }).returning();
  if (!venue) { res.status(500).json({ error: "Failed to create venue" }); return; }
  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.userId!));
  res.status(201).json({ ...venue, pricePerDay: Number(venue.pricePerDay), ownerName: owner?.name ?? "" });
});

router.put("/:id", requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateVenueBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [existing] = await db.select().from(venuesTable).where(eq(venuesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Venue not found" }); return; }
  if (req.userRole !== "admin" && existing.ownerId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const d = parsed.data as any;
  const updates: Partial<typeof venuesTable.$inferInsert> = {};
  if (d.name !== undefined) updates.name = d.name;
  if (d.description !== undefined) updates.description = d.description;
  if (d.city !== undefined) updates.city = d.city;
  if (d.area !== undefined) updates.area = d.area;
  if (d.address !== undefined) updates.address = d.address;
  if (d.capacity !== undefined) updates.capacity = d.capacity;
  if (d.pricePerDay !== undefined) updates.pricePerDay = String(d.pricePerDay);
  if (d.eventTypes !== undefined) updates.eventTypes = d.eventTypes;
  if (d.images !== undefined) updates.images = d.images;
  if (d.videos !== undefined) updates.videos = d.videos;
  const [updated] = await db.update(venuesTable).set(updates).where(eq(venuesTable.id, id)).returning();
  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated!.ownerId));
  res.json({ ...updated, pricePerDay: Number(updated!.pricePerDay), ownerName: owner?.name ?? "" });
});

router.delete("/:id", requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(venuesTable).where(eq(venuesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Venue not found" }); return; }
  if (req.userRole !== "admin" && existing.ownerId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(venuesTable).where(eq(venuesTable.id, id));
  res.json({ message: "Venue deleted" });
});

export default router;
