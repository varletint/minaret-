import { Router } from "express";
import { asyncHandler } from "../middleware/index.js";
import * as searchController from "../controllers/searchController.js";

const router = Router();

// GET /api/v1/search - Public search for stations and shows
router.get("/", asyncHandler(searchController.search));

export default router;
