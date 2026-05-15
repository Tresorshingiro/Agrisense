import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/clerk";

const router = Router();

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const { data } = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon, format: "json" },
      headers: { "User-Agent": "AgriSense/1.0" },
      timeout: 4000,
    });
    return (
      data.address?.county ??
      data.address?.state_district ??
      data.address?.municipality ??
      data.address?.city ??
      null
    );
  } catch {
    return null;
  }
}

router.post("/predict", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;
    const lat = Number(latitude);
    const lon = Number(longitude);

    const [{ data }, district] = await Promise.all([
      axios.post(`${process.env.FASTAPI_URL}/suitability`, { latitude: lat, longitude: lon }),
      reverseGeocode(lat, lon),
    ]);

    const s = data.suitability;

    await prisma.mapPrediction.create({
      data: {
        userId:           req.dbUserId!,
        latitude:         lat,
        longitude:        lon,
        district:         district,
        maizeScore:       s.maize,
        beansScore:       s.beans,
        irishPotatoScore: s.irish_potato,
        sorghumScore:     s.sorghum,
        cassavaScore:     s.cassava,
      },
    });

    res.json({ latitude: lat, longitude: lon, district, suitability: s, features: data.features });
  } catch (err) {
    next(err);
  }
});

export default router;
