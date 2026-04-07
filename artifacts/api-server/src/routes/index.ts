import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import venuesRouter from "./venues";
import bookingsRouter from "./bookings";
import chatRouter from "./chat";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/venues", venuesRouter);
router.use("/bookings", bookingsRouter);
router.use("/chat", chatRouter);
router.use("/admin", adminRouter);

export default router;
