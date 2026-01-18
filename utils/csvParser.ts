import Papa from 'papaparse';
import { TyphoonPoint, CsvRow, WindRadii } from '../types';

// Helper to parse date string "YYYYMMDDHHMM"
const parseDateString = (dateStr: string): Date => {
  if (!dateStr || dateStr.length < 12) return new Date();
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(dateStr.substring(8, 10));
  const minute = parseInt(dateStr.substring(10, 12));
  return new Date(Date.UTC(year, month, day, hour, minute));
};

// Helper to safely parse float
const parseFloatSafe = (val: string | undefined): number => {
  if (!val || val.trim() === '') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

export const parseTyphoonCsv = (csvText: string): Promise<TyphoonPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData: TyphoonPoint[] = results.data.map((row, index) => {
            const r34: WindRadii = {
              ne: parseFloatSafe(row.r34_ne_km),
              se: parseFloatSafe(row.r34_se_km),
              sw: parseFloatSafe(row.r34_sw_km),
              nw: parseFloatSafe(row.r34_nw_km),
            };
            const r50: WindRadii = {
              ne: parseFloatSafe(row.r50_ne_km),
              se: parseFloatSafe(row.r50_se_km),
              sw: parseFloatSafe(row.r50_sw_km),
              nw: parseFloatSafe(row.r50_nw_km),
            };
            const r64: WindRadii = {
              ne: parseFloatSafe(row.r64_ne_km),
              se: parseFloatSafe(row.r64_se_km),
              sw: parseFloatSafe(row.r64_sw_km),
              nw: parseFloatSafe(row.r64_nw_km),
            };

            return {
              id: `point-${index}`,
              dateUtc: row.date_utc,
              timestamp: parseDateString(row.date_utc),
              lon: parseFloatSafe(row.lon),
              lat: parseFloatSafe(row.lat),
              vmaxMs: parseFloatSafe(row.vmax_ms),
              mslpHpa: parseFloatSafe(row.mslp_hpa),
              moveDir: row.move_dir,
              moveSpeedKmh: parseFloatSafe(row.move_speed_kmh),
              grade: row.grade,
              r34,
              r50,
              r64,
            };
          });
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};
