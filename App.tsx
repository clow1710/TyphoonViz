import React, { useState, useEffect } from 'react';
import TyphoonMap from './components/TyphoonMap';
import InfoPanel from './components/InfoPanel';
import FileUpload from './components/FileUpload';
import { parseTyphoonCsv } from './utils/csvParser';
import { TyphoonPoint } from './types';
import { Waves, Menu, Map as MapIcon, X, FileText } from 'lucide-react';

function App() {
  const [data, setData] = useState<TyphoonPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleDataLoaded = async (csvText: string, name: string) => {
    try {
      const parsedData = await parseTyphoonCsv(csvText);
      setData(parsedData);
      setFilename(name);
      setSelectedPointId(null);
      
      // Auto-select the point with max intensity as an interesting starting point
      if (parsedData.length > 0) {
        const maxIntensityPoint = parsedData.reduce((prev, current) => 
            (prev.vmaxMs > current.vmaxMs) ? prev : current
        );
        setSelectedPointId(maxIntensityPoint.id);
      }
    } catch (error) {
      alert("Error parsing CSV file. Please ensure format matches requirements.");
      console.error(error);
    }
  };

  const handlePointSelect = (point: TyphoonPoint | null) => {
    setSelectedPointId(point ? point.id : null);
  };
  
  // Scroll selected row into view
  useEffect(() => {
    if (selectedPointId && isSidebarOpen) {
      const row = document.getElementById(`row-${selectedPointId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedPointId, isSidebarOpen]);

  const selectedPoint = data.find(p => p.id === selectedPointId) || null;

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-20 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-gray-200 flex flex-col`}
      >
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Waves className="text-blue-400" />
            <h1 className="text-lg font-bold tracking-tight">Typhoon Viz</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <FileUpload onDataLoaded={handleDataLoaded} />
          {filename && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium px-1">
               <FileText size={12} className="inline" /> Loaded: {filename}
            </div>
          )}
        </div>

        {/* Sidebar Content: Only List */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
             
             {/* Trajectory List */}
             <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">
                 Trajectory Points
             </div>
             
             <div className="flex-1 overflow-y-auto bg-white">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-3 py-2 text-xs">Time (UTC)</th>
                            <th className="px-3 py-2 text-right text-xs">Wind (m/s)</th>
                            <th className="px-3 py-2 text-right text-xs">Pres (hPa)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((point) => (
                            <tr 
                                key={point.id} 
                                id={`row-${point.id}`}
                                onClick={() => handlePointSelect(point)}
                                className={`cursor-pointer border-b border-gray-50 hover:bg-blue-50 transition-colors ${selectedPointId === point.id ? 'bg-blue-100' : ''}`}
                            >
                                <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                    {point.timestamp.getUTCMonth() + 1}/{point.timestamp.getUTCDate()} {point.timestamp.getUTCHours().toString().padStart(2, '0')}h
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-gray-700">{point.vmaxMs}</td>
                                <td className="px-3 py-2 text-right font-mono text-gray-700">{point.mslpHpa}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No trajectory data available. <br/>Upload a CSV to begin.
                    </div>
                )}
             </div>
        </div>
        
        <div className="p-2 text-[10px] text-gray-400 text-center border-t border-gray-100 bg-white flex-shrink-0">
          Data Viz © {new Date().getFullYear()}
        </div>
      </div>

      {/* Main Content (Map) */}
      <div className="flex-1 relative flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden h-14 bg-white shadow-sm flex items-center px-4 justify-between z-10 relative flex-shrink-0">
             <div className="flex items-center gap-2 text-slate-800 font-bold">
                 <Waves className="text-blue-600" size={20} /> Typhoon Viz
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded text-gray-600">
                 <Menu size={20} />
             </button>
        </div>

        <div className="flex-1 relative bg-slate-200">
            {data.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-500">
                    <MapIcon size={64} className="mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Map is ready</p>
                    <p className="text-sm">Upload a CSV file to visualize trajectory</p>
                </div>
            ) : null}
            
            <TyphoonMap 
                data={data} 
                selectedPointId={selectedPointId} 
                onPointSelect={handlePointSelect} 
            />

            {/* Floating Info Window (Top Right) */}
            {selectedPoint && (
              <div className="absolute top-4 right-4 z-30 w-80 bg-white/95 backdrop-blur shadow-xl rounded-lg border border-gray-200 max-h-[calc(100vh-2rem)] overflow-y-auto">
                 <div className="relative">
                     <button 
                        onClick={() => handlePointSelect(null)}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 z-10 bg-white/50 rounded-full hover:bg-gray-100 transition-colors"
                     >
                        <X size={18} />
                     </button>
                     <InfoPanel point={selectedPoint} />
                 </div>
              </div>
            )}

            {/* Legend Overlay */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded shadow-lg border border-gray-200 text-xs z-10 pointer-events-none">
                <h4 className="font-bold mb-2 text-gray-700">Wind Intensity (m/s)</h4>
                <div className="space-y-1">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div> &lt; 17.2 (TD)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400"></div> 17.2 - 32.6 (TS/STS)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> 32.7 - 41.4 (TY)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400"></div> 41.5 - 50.9 (STY)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> &gt; 51.0 (SuperTY)</div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                     <h4 className="font-bold mb-1 text-gray-700">Wind Radii</h4>
                     <div className="flex items-center gap-2 text-[10px] text-gray-500">
                         <span className="w-3 h-3 border border-yellow-500 bg-yellow-100 block"></span> 34kt
                         <span className="w-3 h-3 border border-orange-500 bg-orange-100 block"></span> 50kt
                         <span className="w-3 h-3 border border-red-500 bg-red-100 block"></span> 64kt
                     </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Import FileText for the icon used in the sidebar logic above */}
      <div className="hidden">
         <FileText />
      </div>
    </div>
  );
}

export default App;
