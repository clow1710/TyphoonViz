export interface WindRadii {
  ne: number;
  se: number;
  sw: number;
  nw: number;
}

export interface TyphoonPoint {
  id: string; // generated unique id
  dateUtc: string; // Original string format
  timestamp: Date; // Parsed date
  lon: number;
  lat: number;
  vmaxMs: number;
  mslpHpa: number;
  moveDir: string;
  moveSpeedKmh: number;
  grade: string;
  r34: WindRadii; // 7 grade (34kt)
  r50: WindRadii; // 10 grade (50kt)
  r64: WindRadii; // 12 grade (64kt)
}

export interface CsvRow {
  date_utc: string;
  lon: string;
  lat: string;
  vmax_ms: string;
  mslp_hpa: string;
  move_dir: string;
  move_speed_kmh: string;
  grade: string;
  r34_ne_km: string;
  r34_se_km: string;
  r34_sw_km: string;
  r34_nw_km: string;
  r50_ne_km: string;
  r50_se_km: string;
  r50_sw_km: string;
  r50_nw_km: string;
  r64_ne_km: string;
  r64_se_km: string;
  r64_sw_km: string;
  r64_nw_km: string;
}
