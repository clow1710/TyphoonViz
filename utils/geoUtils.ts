import { WindRadii } from '../types';

/**
 * Calculates a destination point given a start point, distance, and bearing.
 * Approximation using spherical earth (mean radius 6371km).
 * 
 * @param lon Start Longitude in degrees
 * @param lat Start Latitude in degrees
 * @param distKm Distance in Kilometers
 * @param bearingDegrees Bearing in Degrees (0 is North, 90 is East)
 * @returns [longitude, latitude]
 */
export const getDestinationPoint = (lon: number, lat: number, distKm: number, bearingDegrees: number): [number, number] => {
  const R = 6371; // Earth's mean radius in km
  const d = distKm;
  
  const lat1 = lat * (Math.PI / 180);
  const lon1 = lon * (Math.PI / 180);
  const brng = bearingDegrees * (Math.PI / 180);

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) +
              Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
  
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
              Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

  return [lon2 * (180 / Math.PI), lat2 * (180 / Math.PI)];
};

/**
 * Generates a Polygon coordinate array for a wind circle quadrant set.
 * 
 * @param centerLon Center longitude
 * @param centerLat Center latitude
 * @param radii The WindRadii object (ne, se, sw, nw in km)
 * @returns Array of coordinates [[lon, lat], ...] closing back to start, suitable for OpenLayers Polygon
 */
export const generateWindCirclePolygon = (centerLon: number, centerLat: number, radii: WindRadii): number[][] | null => {
  // If all radii are 0, return null
  if (radii.ne === 0 && radii.se === 0 && radii.sw === 0 && radii.nw === 0) {
    return null;
  }

  const coordinates: number[][] = [];
  const stepsPerQuadrant = 15; // smoothness

  // Quadrants logic:
  // NE: 0 to 90
  // SE: 90 to 180
  // SW: 180 to 270
  // NW: 270 to 360

  const quadrants = [
    { start: 0, end: 90, radius: radii.ne },
    { start: 90, end: 180, radius: radii.se },
    { start: 180, end: 270, radius: radii.sw },
    { start: 270, end: 360, radius: radii.nw },
  ];

  quadrants.forEach(q => {
    const r = q.radius;
    // If radius is 0, we track the center, but usually wind circles are continuous shapes.
    // If a specific quadrant is 0 but others are not, it implies the wind circle doesn't extend there.
    // We will draw the arc if r > 0. If r=0, we should technically go to center, but standard met practice 
    // usually implies a very small or interpolated radius. For simplicity, if r=0, we treat it as very small 
    // or just connect to the next point which might create a dent.
    // Let's assume if r=0, we use center point.
    
    const effectiveR = r > 0 ? r : 0;

    for (let i = 0; i <= stepsPerQuadrant; i++) {
        // Linear interpolation of angle
        const angle = q.start + (q.end - q.start) * (i / stepsPerQuadrant);
        if (effectiveR === 0) {
            coordinates.push([centerLon, centerLat]);
        } else {
            const point = getDestinationPoint(centerLon, centerLat, effectiveR, angle);
            coordinates.push(point);
        }
    }
  });

  // Close the polygon
  coordinates.push(coordinates[0]);

  return coordinates;
};
