import { Router } from "express";
import {
  getAllSwitches,
  addSwitch,
  updateSwitch,
  deleteSwitch,
  getFilteredSwitches,
  searchSwitch,
  getSwitchStats,
} from "../controllers/switch.controller.js";
import { verifyRole } from "../middlewares/role.middleware.js";
const switchRouter = Router();

switchRouter.get("/", getAllSwitches);

switchRouter.get("/search", searchSwitch);

switchRouter.get("/filter", getFilteredSwitches);

switchRouter.get("/stats", getSwitchStats);

switchRouter.post("/", verifyRole("admin"), addSwitch);

switchRouter.put("/:uniqueKey", verifyRole("admin"), updateSwitch);

switchRouter.delete("/:uniqueKey", verifyRole("admin"), deleteSwitch);

export default switchRouter;
