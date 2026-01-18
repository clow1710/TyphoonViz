import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import { TyphoonPoint } from '../types';
import { generateWindCirclePolygon } from '../utils/geoUtils';

interface TyphoonMapProps {
  data: TyphoonPoint[];
  selectedPointId: string | null;
  onPointSelect: (point: TyphoonPoint | null) => void;
}

const TyphoonMap: React.FC<TyphoonMapProps> = ({ data, selectedPointId, onPointSelect }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const windCircleSourceRef = useRef<VectorSource | null>(null);
  
  // Use a ref to store current data so the map event handler always sees the latest data
  // without needing to re-bind the event listener.
  const currentDataRef = useRef(data);
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  // Initialize Map
  useEffect(() => {
    if (!mapElement.current) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const windCircleSource = new VectorSource();
    windCircleSourceRef.current = windCircleSource;

    const map = new Map({
      target: mapElement.current,
      controls: defaultControls({ zoom: false }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        // Wind Circles Layer (Bottom, zIndex 1)
        new VectorLayer({
            source: windCircleSource,
            zIndex: 1,
            style: (feature) => {
                const type = feature.get('type');
                if (type === 'r34') {
                    return new Style({
                        fill: new Fill({ color: 'rgba(255, 255, 0, 0.2)' }), // Yellow transparent
                        stroke: new Stroke({ color: '#FFD700', width: 2 }),
                    });
                } else if (type === 'r50') {
                    return new Style({
                        fill: new Fill({ color: 'rgba(255, 165, 0, 0.2)' }), // Orange transparent
                        stroke: new Stroke({ color: '#FFA500', width: 2 }),
                    });
                } else if (type === 'r64') {
                    return new Style({
                        fill: new Fill({ color: 'rgba(255, 0, 0, 0.2)' }), // Red transparent
                        stroke: new Stroke({ color: '#FF0000', width: 2 }),
                    });
                }
            }
        }),
        // Trajectory Line & Points Layer (Top, zIndex 2)
        new VectorLayer({
          source: vectorSource,
          zIndex: 2,
        }),
      ],
      view: new View({
        center: fromLonLat([135, 20]), // Default roughly near Philippines/Japan
        zoom: 4,
      }),
    });

    // Click Interaction
    map.on('click', (event) => {
      // STRICTLY filter for the points layer (zIndex 2) to avoid mistakenly clicking the wind circle polygons
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature, {
        layerFilter: (layer) => layer.getZIndex() === 2
      });

      if (feature) {
        const id = feature.getId();
        if (typeof id === 'string' && id.startsWith('point-')) {
          // Use Ref to get current data
          const point = currentDataRef.current.find((p) => p.id === id);
          if (point) {
            onPointSelect(point);
            return;
          }
        }
      }
      onPointSelect(null);
    });

    // Pointer cursor on hover
    map.on('pointermove', (e) => {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, {
        layerFilter: (layer) => layer.getZIndex() === 2 // Only trigger for points
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, []); // Run once on mount

  // Update Trajectory Data
  useEffect(() => {
    if (!mapRef.current || !vectorSourceRef.current) return;
    
    const source = vectorSourceRef.current;
    source.clear();

    if (data.length === 0) return;

    // 1. Draw Trajectory Line
    const coordinates = data.map(p => fromLonLat([p.lon, p.lat]));
    const lineString = new LineString(coordinates);
    const lineFeature = new Feature({ geometry: lineString });
    lineFeature.setStyle(new Style({
      stroke: new Stroke({
        color: '#3b82f6', // blue-500
        width: 3,
      })
    }));
    source.addFeature(lineFeature);

    // 2. Draw Points
    data.forEach((point) => {
      const geom = new Point(fromLonLat([point.lon, point.lat]));
      const feature = new Feature({ geometry: geom });
      feature.setId(point.id);
      
      // Determine color based on intensity (vmaxMs)
      let color = '#4ade80'; // Green
      if (point.vmaxMs >= 17.2 && point.vmaxMs < 32.7) color = '#60a5fa'; // Blue
      else if (point.vmaxMs >= 32.7 && point.vmaxMs < 41.5) color = '#facc15'; // Yellow
      else if (point.vmaxMs >= 41.5 && point.vmaxMs < 51.0) color = '#fb923c'; // Orange
      else if (point.vmaxMs >= 51.0) color = '#ef4444'; // Red

      const isSelected = point.id === selectedPointId;

      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: isSelected ? 8 : 5,
          fill: new Fill({ color: color }),
          stroke: new Stroke({
            color: isSelected ? '#ffffff' : '#000000',
            width: isSelected ? 3 : 1,
          }),
        }),
      }));

      source.addFeature(feature);
    });

    // 3. Fit view to data extent
    if (data.length > 0) {
      const extent = source.getExtent();
      // Add some padding
      mapRef.current.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
    }

  }, [data]); // Re-run when data changes

  // Update Selection / Wind Circles
  useEffect(() => {
    if (!mapRef.current || !windCircleSourceRef.current || !vectorSourceRef.current) return;
    
    const windSource = windCircleSourceRef.current;
    windSource.clear();

    // Re-render points to update selection style
    if (data.length > 0) {
       vectorSourceRef.current.getFeatures().forEach(feature => {
          const id = feature.getId();
          if (typeof id === 'string' && id.startsWith('point-')) {
            const point = data.find(p => p.id === id);
            if (!point) return;

            const isSelected = point.id === selectedPointId;
            let color = '#4ade80';
            if (point.vmaxMs >= 17.2 && point.vmaxMs < 32.7) color = '#60a5fa'; 
            else if (point.vmaxMs >= 32.7 && point.vmaxMs < 41.5) color = '#facc15';
            else if (point.vmaxMs >= 41.5 && point.vmaxMs < 51.0) color = '#fb923c';
            else if (point.vmaxMs >= 51.0) color = '#ef4444';

            feature.setStyle(new Style({
                image: new CircleStyle({
                    radius: isSelected ? 8 : 5,
                    fill: new Fill({ color: color }),
                    stroke: new Stroke({
                        color: isSelected ? '#ffffff' : '#000000',
                        width: isSelected ? 3 : 1,
                    }),
                }),
            }));
          }
       });
    }


    if (selectedPointId) {
      const point = data.find(p => p.id === selectedPointId);
      if (point) {
        // Generate Wind Circles
        // 1. R34 (Grade 7)
        const coords34 = generateWindCirclePolygon(point.lon, point.lat, point.r34);
        if (coords34) {
          const poly34 = new Polygon([coords34.map(c => fromLonLat(c))]);
          const feat34 = new Feature({ geometry: poly34 });
          feat34.set('type', 'r34');
          windSource.addFeature(feat34);
        }

        // 2. R50 (Grade 10)
        const coords50 = generateWindCirclePolygon(point.lon, point.lat, point.r50);
        if (coords50) {
          const poly50 = new Polygon([coords50.map(c => fromLonLat(c))]);
          const feat50 = new Feature({ geometry: poly50 });
          feat50.set('type', 'r50');
          windSource.addFeature(feat50);
        }

        // 3. R64 (Grade 12)
        const coords64 = generateWindCirclePolygon(point.lon, point.lat, point.r64);
        if (coords64) {
          const poly64 = new Polygon([coords64.map(c => fromLonLat(c))]);
          const feat64 = new Feature({ geometry: poly64 });
          feat64.set('type', 'r64');
          windSource.addFeature(feat64);
        }
      }
    }

  }, [selectedPointId, data]);

  return (
    <div ref={mapElement} className="w-full h-full" />
  );
};

export default TyphoonMap;
