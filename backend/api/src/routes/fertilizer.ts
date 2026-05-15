import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/clerk";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { temperature, humidity, moisture, soil_type, crop_type, nitrogen, phosphorous, potassium } = req.body;

    const { data } = await axios.post(`${process.env.FASTAPI_URL}/fertilizer`, {
      temperature, humidity, moisture, soil_type, crop_type, nitrogen, phosphorous, potassium,
    });

    await prisma.fertilizerPrediction.create({
      data: {
        userId:      req.dbUserId!,
        temperature: Number(temperature),
        humidity:    Number(humidity),
        moisture:    Number(moisture),
        soilType:    soil_type,
        cropType:    crop_type,
        nitrogen:    Number(nitrogen),
        phosphorous: Number(phosphorous),
        potassium:   Number(potassium),
        result:      data.fertilizer,
      },
    });

    res.json({ fertilizer: data.fertilizer });
  } catch (err) {
    next(err);
  }
});

export default router;
