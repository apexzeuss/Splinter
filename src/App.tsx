import React, { useState, useEffect } from 'react';
import { DocId, ProjectDoc, TaskItem, ArchitectureDirective, SplinterNode, LogEntry, UserCoords } from './types';
import { INITIAL_DOCS, INITIAL_TASKS, INITIAL_DIRECTIVES, INITIAL_NODES, INITIAL_LOGS } from './data/projectData';
import { ModernHeader, AppNavPage } from './components/ModernHeader';
import { UnifiedCoolWalkDashboard } from './components/UnifiedCoolWalkDashboard';
import { Sidebar } from './components/Sidebar';
import { HandoffOverview } from './components/HandoffOverview';
import { DocViewer } from './components/DocViewer';
import { LocationModal } from './components/LocationModal';
import { Footer } from './components/Footer';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppNavPage>('unified');
  const [selectedDocId, setSelectedDocId] = useState<DocId>('handoff.md');
  const [docs, setDocs] = useState<Record<string, ProjectDoc>>(INITIAL_DOCS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [directives, setDirectives] = useState<ArchitectureDirective[]>(INITIAL_DIRECTIVES);
  const [nodes, setNodes] = useState<SplinterNode[]>(INITIAL_NODES);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [lastSyncTime, setLastSyncTime] = useState<string>('2026-08-17 01:40:00');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Real Browser Geolocation State
  const [userCoords, setUserCoords] = useState<UserCoords | null>({
    lat: 51.5074,
    lng: -0.1278,
    city: 'London, UK',
    tempC: 22.4,
    isLive: true,
    source: 'DEFAULT'
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const taskId = 'e_6a809a7420ac8325a91c1e9b50cdb6ad';

  // Real Geolocation Strategy: GPS with automatic IP Geolocation fallback & Open-Meteo weather
  const handleRequestLocation = async () => {
    setIsLocating(true);

    const resolveWeatherAndCity = async (lat: number, lng: number, fallbackCity: string, isGPS: boolean) => {
      let resolvedCity = fallbackCity;
      let temp = 22.4;

      // 1. Reverse Geocode for clean City/Town name
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const cityPart = geoData.city || geoData.locality || geoData.principalSubdivision || '';
          const countryPart = geoData.countryCode || geoData.countryName || '';
          if (cityPart) {
            resolvedCity = countryPart ? `${cityPart}, ${countryPart}` : cityPart;
          }
        }
      } catch (e) {
        console.log("Reverse geocode fallback", e);
      }

      // 2. Fetch live Open-Meteo weather for exact latitude/longitude
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        );
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          if (weatherData.current_weather && typeof weatherData.current_weather.temperature === 'number') {
            temp = weatherData.current_weather.temperature;
          }
        }
      } catch (e) {
        console.log("Weather API fallback", e);
      }

      const finalCoords = {
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        city: resolvedCity,
        tempC: Math.round(temp * 10) / 10,
        isLive: true
      };

      setUserCoords(finalCoords);
      setIsLocating(false);

      const time = new Date().toTimeString().split(' ')[0];
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          level: 'success',
          source: isGPS ? 'GPS_HARDWARE' : 'IP_GEOLOCATION_MESH',
          message: `Location active: ${resolvedCity} (${finalCoords.lat}°, ${finalCoords.lng}°) · Ambient: ${finalCoords.tempC}°C`
        },
        ...prev
      ]);
    };

    // Fallback: IP-based Geolocation if browser GPS is blocked/denied/timeout
    const tryIPGeolocation = async () => {
      try {
        const ipRes = await fetch('https://ipwho.is/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.success && typeof ipData.latitude === 'number') {
            const cityStr = `${ipData.city || 'Local Region'}, ${ipData.country_code || ''}`.trim();
            await resolveWeatherAndCity(ipData.latitude, ipData.longitude, cityStr, false);
            return;
          }
        }
      } catch (err) {
        console.log("ipwho.is failed, trying freeipapi.com...", err);
      }

      // Secondary IP Fallback
      try {
        const ipRes2 = await fetch('https://freeipapi.com/api/json');
        if (ipRes2.ok) {
          const ipData2 = await ipRes2.json();
          if (typeof ipData2.latitude === 'number') {
            const cityStr2 = `${ipData2.cityName || 'Local Area'}, ${ipData2.countryCode || ''}`.trim();
            await resolveWeatherAndCity(ipData2.latitude, ipData2.longitude, cityStr2, false);
            return;
          }
        }
      } catch (err2) {
        console.log("freeipapi failed, using standard fallback", err2);
      }

      // Standard default fallback if all offline
      setUserCoords({
        lat: 51.5074,
        lng: -0.1278,
        city: "London, UK",
        tempC: 22.4,
        isLive: true
      });
      setIsLocating(false);
    };

    // Try HTML5 Browser Geolocation first
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await resolveWeatherAndCity(
            position.coords.latitude,
            position.coords.longitude,
            "My Location",
            true
          );
        },
        async (error) => {
          console.warn("Browser GPS unavailable or denied, falling back to IP Geolocation:", error.message);
          await tryIPGeolocation();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      await tryIPGeolocation();
    }
  };

  // Attempt automatic location on startup
  useEffect(() => {
    handleRequestLocation();
  }, []);

  // Toggle task completion
  const handleToggleTask = (targetTaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === targetTaskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  // Add new task
  const handleAddTask = (text: string, category: TaskItem['category']) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      text,
      category,
      completed: false,
      priority: 'medium',
      assignee: 'AI Agent',
      notes: 'Added to session handoff queue'
    };
    setTasks(prev => [...prev, newTask]);
  };

  // Update markdown document content
  const handleUpdateDocContent = (docId: DocId, newContent: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setDocs(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        content: newContent,
        lastUpdated: now
      }
    }));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const isDevWorkspace = ['handoff', 'docs'].includes(currentPage);

  return (
    <div className="w-full h-full bg-[#070709] text-zinc-300 font-sans flex flex-col overflow-hidden select-none">
      {/* Top Universal Website Header */}
      <ModernHeader
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userCoords={userCoords}
        onRequestLocation={handleRequestLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        isLocating={isLocating}
      />

      {/* Location Selector / Search / GPS Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        userCoords={userCoords}
        onSelectLocation={(newCoords) => {
          setUserCoords(newCoords);
          const time = new Date().toTimeString().split(' ')[0];
          setLogs(prev => [
            {
              id: `log-${Date.now()}`,
              timestamp: time,
              level: 'success',
              source: `LOCATION_${newCoords.source || 'MANUAL'}`,
              message: `Active location updated: ${newCoords.city} (${newCoords.lat}°, ${newCoords.lng}°) · ${newCoords.tempC}°C`
            },
            ...prev
          ]);
        }}
      />

      {/* Main Page Routing Switcher */}
      <div className="flex flex-1 overflow-hidden">
        {isDevWorkspace && (
          <Sidebar
            docs={docs}
            selectedDocId={selectedDocId}
            onSelectDoc={(id) => {
              setSelectedDocId(id);
              setCurrentPage('docs');
            }}
            activeView={currentPage === 'unified' ? 'simulator' : (currentPage as any)}
            setActiveView={(v: any) => {
              if (v === 'simulator') setCurrentPage('unified');
              else setCurrentPage(v);
            }}
            completedTasksCount={completedCount}
            totalTasksCount={tasks.length}
          />
        )}

        <main className="flex-1 flex flex-col bg-[#070709] overflow-hidden">
          {currentPage === 'unified' && (
            <UnifiedCoolWalkDashboard
              userCoords={userCoords || { lat: 51.5074, lng: -0.1278, city: 'London, UK', tempC: 22.4, isLive: true }}
              onLocationChange={(lat, lng, city) => {
                setUserCoords(prev => prev ? { ...prev, lat, lng, city } : { lat, lng, city, tempC: 22.4, isLive: true });
              }}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              onRequestLocation={handleRequestLocation}
              isLocating={isLocating}
            />
          )}

          {/* Architecture & System Documentation View */}
          {currentPage === 'docs' && (
            <DocViewer
              doc={docs[selectedDocId]}
              onUpdateContent={handleUpdateDocContent}
              onSelectDoc={(id) => setSelectedDocId(id)}
            />
          )}
        </main>
      </div>

      {/* Footer info */}
      <Footer
        logs={logs}
        statusText={userCoords?.isLive ? `OPEN-METEO LIVE (${userCoords.city} · ${userCoords.tempC}°C)` : 'STANDING BY'}
        taskId={taskId}
        isExecuting={false}
      />
    </div>
  );
}
