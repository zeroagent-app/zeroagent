import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: (role as "user" | "owner") ?? "user",
  }).returning();
  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }
  res.cookie("userId", String(user.id), { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    message: "Registered successfully",
  });
});

router.post("/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.cookie("userId", String(user.id), { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    message: "Logged in successfully",
  });
});

router.post("/logout", (req, res): void => {
  res.clearCookie("userId");
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(401).json({ error: "Not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
});

export default router;
