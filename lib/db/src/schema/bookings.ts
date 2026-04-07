import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  userId: integer("user_id").notNull(),
  eventDate: text("event_date").notNull(),
  eventType: text("event_type").notNull(),
  guestCount: integer("guest_count").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] }).notNull().default("pending"),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid"] }).notNull().default("unpaid"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
