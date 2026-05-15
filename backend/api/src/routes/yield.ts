import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/clerk";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, rainfall_mm, pesticides_tonnes, avg_temp, area, crop } = req.body;

    const { data } = await axios.post(`${process.env.FASTAPI_URL}/yield`, {
      year, rainfall_mm, pesticides_tonnes, avg_temp, area, crop,
    });

    await prisma.yieldPrediction.create({
      data: {
        userId:          req.dbUserId!,
        year:            Number(year),
        rainfallMm:      Number(rainfall_mm),
        pesticidesTonnes: Number(pesticides_tonnes),
        avgTemp:         Number(avg_temp),
        area,
        crop,
        predictedYield:  data.yield_kg_ha,
      },
    });

    res.json({ yield_kg_ha: data.yield_kg_ha });
  } catch (err) {
    next(err);
  }
});

export default router;
