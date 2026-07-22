import { Router } from "express";
import healthRouter   from "./health.js";
import authRouter     from "./auth.js";
import tableRouter    from "./table.js";
import clientsRouter  from "./clients.js";
import companyRouter  from "./company.js";

const router = Router();

router.use(healthRouter);
router.use("/auth",    authRouter);
router.use("/table",   tableRouter);
router.use("/clients", clientsRouter);
router.use("/company", companyRouter);

export default router;
