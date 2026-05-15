export interface LocationFeatures {
  soil_pH: number;             // stored as pH × 10 in raster
  soil_organic_carbon: number; // g/kg
  soil_clay_fraction: number;  // %
  soil_sand_fraction: number;  // %
  elevation_m: number;
  slope_deg: number;
  rainfall_mean_mm_month: number;
}

interface Range { min: number; max: number }

interface CropProfile {
  name: string;
  ph: Range;         // actual pH (not × 10)
  elevation: Range;  // metres
  rainfall: Range;   // mm/month
  clay: Range;       // %
}

const PROFILES: Record<string, CropProfile> = {
  maize: {
    name: 'Maize',
    ph:        { min: 5.5, max: 7.0 },
    elevation: { min: 0,   max: 1800 },
    rainfall:  { min: 60,  max: 130 },
    clay:      { min: 20,  max: 45 },
  },
  beans: {
    name: 'Beans',
    ph:        { min: 6.0, max: 7.0 },
    elevation: { min: 900, max: 2400 },
    rainfall:  { min: 50,  max: 100 },
    clay:      { min: 20,  max: 50 },
  },
  irish_potato: {
    name: 'Irish Potato',
    ph:        { min: 4.8, max: 6.0 },
    elevation: { min: 1500, max: 2800 },
    rainfall:  { min: 50,  max: 90 },
    clay:      { min: 15,  max: 40 },
  },
  sorghum: {
    name: 'Sorghum',
    ph:        { min: 5.5, max: 7.5 },
    elevation: { min: 0,   max: 1500 },
    rainfall:  { min: 30,  max: 80 },
    clay:      { min: 15,  max: 45 },
  },
  cassava: {
    name: 'Cassava',
    ph:        { min: 5.5, max: 6.5 },
    elevation: { min: 0,   max: 1500 },
    rainfall:  { min: 40,  max: 100 },
    clay:      { min: 10,  max: 40 },
  },
};

export interface FactorInsight {
  label: string;
  value: string;
  ok: boolean;
  reason: string;
}

function inRange(v: number, r: Range) { return v >= r.min && v <= r.max; }

export function getCropInsights(cropKey: string, features: LocationFeatures): FactorInsight[] {
  const profile = PROFILES[cropKey];
  if (!profile) return [];

  const pH = features.soil_pH / 10;
  const { elevation_m: elev, rainfall_mean_mm_month: rain, soil_clay_fraction: clay } = features;

  const phOk = inRange(pH, profile.ph);
  const elevOk = inRange(elev, profile.elevation);
  const rainOk = inRange(rain, profile.rainfall);
  const clayOk = inRange(clay, profile.clay);

  return [
    {
      label: 'Soil pH',
      value: pH.toFixed(1),
      ok: phOk,
      reason: phOk
        ? `pH ${pH.toFixed(1)} is within the ideal range (${profile.ph.min}–${profile.ph.max}) for ${profile.name}.`
        : pH < profile.ph.min
          ? `pH ${pH.toFixed(1)} is too acidic. ${profile.name} prefers pH ${profile.ph.min}–${profile.ph.max}.`
          : `pH ${pH.toFixed(1)} is too alkaline. ${profile.name} prefers pH ${profile.ph.min}–${profile.ph.max}.`,
    },
    {
      label: 'Elevation',
      value: `${Math.round(elev)}m`,
      ok: elevOk,
      reason: elevOk
        ? `At ${Math.round(elev)}m, the altitude is suitable for ${profile.name} (${profile.elevation.min}–${profile.elevation.max}m).`
        : elev < profile.elevation.min
          ? `${Math.round(elev)}m is too low. ${profile.name} grows best above ${profile.elevation.min}m.`
          : `${Math.round(elev)}m is too high. ${profile.name} grows best below ${profile.elevation.max}m.`,
    },
    {
      label: 'Rainfall',
      value: `${Math.round(rain)}mm/mo`,
      ok: rainOk,
      reason: rainOk
        ? `Monthly rainfall of ${Math.round(rain)}mm meets ${profile.name}'s water needs (${profile.rainfall.min}–${profile.rainfall.max}mm/mo).`
        : rain < profile.rainfall.min
          ? `At ${Math.round(rain)}mm/mo, rainfall is too low for ${profile.name} (needs ${profile.rainfall.min}+ mm/mo).`
          : `At ${Math.round(rain)}mm/mo, rainfall may cause waterlogging for ${profile.name} (${profile.rainfall.min}–${profile.rainfall.max}mm/mo preferred).`,
    },
    {
      label: 'Soil Texture',
      value: `${Math.round(clay)}% clay`,
      ok: clayOk,
      reason: clayOk
        ? `Clay content of ${Math.round(clay)}% provides good water retention and structure for ${profile.name}.`
        : clay < profile.clay.min
          ? `Sandy soil (${Math.round(clay)}% clay) drains too quickly for ${profile.name}.`
          : `Heavy clay soil (${Math.round(clay)}%) may restrict drainage and root growth for ${profile.name}.`,
    },
  ];
}
