import React from 'react';
import { TyphoonPoint, WindRadii } from '../types';
import { Wind, Gauge, Compass, Calendar, MapPin, Activity } from 'lucide-react';

interface InfoPanelProps {
  point: TyphoonPoint | null;
}

const WindRadiiTable: React.FC<{ label: string; radii: WindRadii; colorClass: string }> = ({ label, radii, colorClass }) => {
  const hasData = radii.ne > 0 || radii.se > 0 || radii.sw > 0 || radii.nw > 0;
  if (!hasData) return null;

  return (
    <div className="mb-4 text-sm">
      <h4 className={`font-semibold mb-1 ${colorClass}`}>{label} Wind Radii (km)</h4>
      <div className="grid grid-cols-4 gap-1 text-center bg-gray-50 p-2 rounded border border-gray-100">
        <div className="flex flex-col"><span className="text-xs text-gray-500">NE</span><span className="font-mono">{radii.ne}</span></div>
        <div className="flex flex-col"><span className="text-xs text-gray-500">SE</span><span className="font-mono">{radii.se}</span></div>
        <div className="flex flex-col"><span className="text-xs text-gray-500">SW</span><span className="font-mono">{radii.sw}</span></div>
        <div className="flex flex-col"><span className="text-xs text-gray-500">NW</span><span className="font-mono">{radii.nw}</span></div>
      </div>
    </div>
  );
};

const InfoPanel: React.FC<InfoPanelProps> = ({ point }) => {
  if (!point) {
    return (
      <div className="p-6 text-gray-500 text-center flex flex-col items-center justify-center h-40">
        <MapPin size={48} className="mb-4 opacity-30" />
        <p>Select a point to view details.</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600" />
          Point Details
        </h2>
        <div className="mt-2 text-gray-600 flex items-center gap-2 text-sm">
          <Calendar size={16} />
          {formatDate(point.timestamp)} UTC
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700 mb-1 text-sm font-semibold">
             <Wind size={16} /> Max Wind
          </div>
          <div className="text-2xl font-bold text-blue-900">{point.vmaxMs} <span className="text-sm font-normal text-blue-700">m/s</span></div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700 mb-1 text-sm font-semibold">
             <Gauge size={16} /> Pressure
          </div>
          <div className="text-2xl font-bold text-purple-900">{point.mslpHpa} <span className="text-sm font-normal text-purple-700">hPa</span></div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-500 flex items-center gap-2"><MapPin size={16}/> Coordinates</span>
            <span className="font-mono text-gray-700">{point.lat.toFixed(1)}°N, {point.lon.toFixed(1)}°E</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-500 flex items-center gap-2"><Compass size={16}/> Movement</span>
            <span className="font-mono text-gray-700">{point.moveDir} @ {point.moveSpeedKmh} km/h</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-500">Grade</span>
            <span className="font-bold px-2 py-0.5 bg-gray-200 rounded text-gray-800 text-sm">{point.grade}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-2">Wind Circles</h3>
        <WindRadiiTable label="Grade 7 (34kt)" radii={point.r34} colorClass="text-yellow-600" />
        <WindRadiiTable label="Grade 10 (50kt)" radii={point.r50} colorClass="text-orange-600" />
        <WindRadiiTable label="Grade 12 (64kt)" radii={point.r64} colorClass="text-red-600" />
        
        {(!point.r34.ne && !point.r50.ne && !point.r64.ne) && (
            <p className="text-sm text-gray-400 italic text-center py-2">No wind radius data available for this point.</p>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
