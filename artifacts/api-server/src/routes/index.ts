import { Router, type IRouter } from "express";
import healthRouter from "./health";
import daemonRouter from "./daemon";
import renderRouter from "./render";
import leadsRouter from "./leads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(daemonRouter);
router.use(renderRouter);
router.use(leadsRouter);

export default router;
