import { Router, type IRouter } from "express";
import healthRouter from "./health";
import daemonRouter from "./daemon";

const router: IRouter = Router();

router.use(healthRouter);
router.use(daemonRouter);

export default router;
