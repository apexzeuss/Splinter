import React, { useState, useEffect } from 'react';
import { DocId, ProjectDoc, TaskItem, ArchitectureDirective, SplinterNode, LogEntry, UserCoords } from './types';
import { INITIAL_DOCS, INITIAL_TASKS, INITIAL_DIRECTIVES, INITIAL_NODES, INITIAL_LOGS } from './data/projectData';
import { ModernHeader, AppNavPage } from './components/ModernHeader';
import { HomePage } from './components/HomePage';
import { ShadowRouterSimulator } from './components/ShadowRouterSimulator';
import { AnalyticsPage } from './components/AnalyticsPage';
import { CommunityPage } from './components/CommunityPage';
import { DeveloperApiPage } from './components/DeveloperApiPage';
import { AboutMissionPage } from './components/AboutMissionPage';
import { Sidebar } from './components/Sidebar';
import { HandoffOverview } from './components/HandoffOverview';
import { DocViewer } from './components/DocViewer';
import { NodeRegistry } from './components/NodeRegistry';
import { RagSandbox } from './components/RagSandbox';
import { MemoryConsole } from './components/MemoryConsole';
import { LocationModal } from './components/LocationModal';
import { Footer } from './components/Footer';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppNavPage>('home');
  const [selectedDocId, setSelectedDocId] = useState<DocId>('handoff.md');
  const [docs, setDocs] = useState<Record<string, ProjectDoc>>(INITIAL_DOCS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [directives, setDirectives] = useState<ArchitectureDirective[]>(INITIAL_DIRECTIVES);
  const [nodes, setNodes] = useState<SplinterNode[]>(INITIAL_NODES);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [lastSyncTime, setLastSyncTime] = useState<string>('2026-08-17 01:40:00');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Location state. `isLive` is false until something actually locates the user:
  // this default is a hardcoded fallback, and the header and footer both render a
  // "live" indicator from this flag.
  const [userCoords, setUserCoords] = useState<UserCoords | null>({
    lat: 33.4484,
    lng: -112.0740,
    city: 'Phoenix, AZ',
    tempC: 39.5,
    isLive: false,
    source: 'DEFAULT',
    utcOffsetHours: -7
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const taskId = 'e_6a809a7420ac8325a91c1e9b50cdb6ad';

  // Real Geolocation Strategy: GPS with automatic IP Geolocation fallback & Open-Meteo weather
  const handleRequestLocation = async () => {
    setIsLocating(true);

    const resolveWeatherAndCity = async (
      lat: number,
      lng: number,
      fallbackCity: string,
      source: 'GPS' | 'IP'
    ) => {
      let resolvedCity = fallbackCity;
      let temp: number | null = null;
      let utcOffsetHours: number | undefined;

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

      // 2. Live weather plus the real UTC offset, which the solar calculation
      //    needs in order to place solar noon correctly.
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`
        );
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          if (weatherData.current_weather && typeof weatherData.current_weather.temperature === 'number') {
            temp = weatherData.current_weather.temperature;
          }
          if (typeof weatherData.utc_offset_seconds === 'number') {
            utcOffsetHours = weatherData.utc_offset_seconds / 3600;
          }
        }
      } catch (e) {
        console.log("Weather API fallback", e);
      }

      const finalCoords: UserCoords = {
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        city: resolvedCity,
        // Fall back to the previous reading rather than inventing 31.5 °C.
        tempC: temp !== null ? Math.round(temp * 10) / 10 : (userCoords?.tempC ?? 30),
        isLive: true,
        source,
        utcOffsetHours
      };

      setUserCoords(finalCoords);
      setIsLocating(false);

      const time = new Date().toTimeString().split(' ')[0];
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          level: 'success',
          source: source === 'GPS' ? 'GPS_HARDWARE' : 'IP_GEOLOCATION',
          message: `Location set: ${resolvedCity} (${finalCoords.lat}°, ${finalCoords.lng}°)${
            temp !== null ? ` · ${finalCoords.tempC}°C observed` : ' · no weather reading'
          }`
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
            await resolveWeatherAndCity(ipData.latitude, ipData.longitude, cityStr, 'IP');
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
            await resolveWeatherAndCity(ipData2.latitude, ipData2.longitude, cityStr2, 'IP');
            return;
          }
        }
      } catch (err2) {
        console.log("freeipapi failed, using standard fallback", err2);
      }

      // Nothing located the user. Keep the default coordinates but do not claim
      // they are live — the previous version set isLive: true here, so the UI
      // reported "LIVE GPS ONLINE (Phoenix, AZ)" while completely offline.
      setIsLocating(false);
      const time = new Date().toTimeString().split(' ')[0];
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          level: 'warn',
          source: 'GEOLOCATION',
          message: 'Could not determine location. Showing the Phoenix, AZ default — set a location manually for real figures.'
        },
        ...prev
      ]);
    };

    // Try HTML5 Browser Geolocation first.
    //
    // enableHighAccuracy is false here because this fires unprompted on load and
    // a coarse fix is enough to pick a city. The location modal, where the user
    // explicitly asks to be located, requests high accuracy instead.
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await resolveWeatherAndCity(
            position.coords.latitude,
            position.coords.longitude,
            "My Location",
            'GPS'
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

  // Attempt automatic location on startup.
  //
  // The ref guard matters: under StrictMode this effect runs twice in
  // development, which previously fired two geolocation requests and two full
  // reverse-geocode plus weather chains on every reload.
  const startupLocationRequested = React.useRef(false);
  useEffect(() => {
    if (startupLocationRequested.current) return;
    startupLocationRequested.current = true;
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

  // Manual Sync trigger
  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setLastSyncTime(now);
      setIsSyncing(false);
    }, 500);
  };

  // Toggle node active state
  const handleToggleNodeStatus = (nodeId: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: n.status === 'active' ? 'idle' : 'active' } : n));
  };

  // Simulate Ingestion Batch execution
  const handleSimulateIngestion = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setNodes(prev => prev.map(n => ({
        ...n,
        processedCount: n.status === 'active' ? n.processedCount + 48 : n.processedCount
      })));
      setIsSimulating(false);
    }, 1200);
  };

  const completedCount = tasks.filter(t => t.completed).length;

  const isDevWorkspace = ['handoff', 'docs', 'nodes', 'rag', 'memory'].includes(currentPage);

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
              if (id === 'handoff.md') {
                setCurrentPage('handoff');
              } else {
                setCurrentPage('docs');
              }
            }}
            activeView={currentPage === 'router' ? 'simulator' : (currentPage as any)}
            setActiveView={(v: any) => {
              if (v === 'simulator') setCurrentPage('router');
              else setCurrentPage(v);
            }}
            completedTasksCount={completedCount}
            totalTasksCount={tasks.length}
          />
        )}

        <main className="flex-1 flex flex-col bg-[#070709] overflow-hidden">
          {/* 1. Consumer Home Page */}
          {currentPage === 'home' && (
            <HomePage
              onNavigateToRouter={() => setCurrentPage('router')}
              userCoords={userCoords}
              onRequestLocation={handleRequestLocation}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              isLocating={isLocating}
            />
          )}

          {/* 2. Live 2.5D Router Simulator */}
          {currentPage === 'router' && (
            <ShadowRouterSimulator
              userCoords={userCoords}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
            />
          )}

          {/* 3. Urban Heat Island Analytics Page */}
          {currentPage === 'analytics' && <AnalyticsPage />}

          {/* 4. Community Shade & Cooling Network */}
          {currentPage === 'community' && <CommunityPage />}

          {/* 5. Developer API / SDK Page */}
          {currentPage === 'api' && <DeveloperApiPage />}

          {/* 6. Mission & About Page */}
          {currentPage === 'about' && <AboutMissionPage />}

          {/* Developer / Project Artifact Views */}
          {currentPage === 'handoff' && (
            <HandoffOverview
              tasks={tasks}
              directives={directives}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onNavigateToDocs={(docId) => {
                setSelectedDocId(docId as DocId);
                setCurrentPage('docs');
              }}
              onNavigateToNodes={() => setCurrentPage('nodes')}
              lastSyncTime={lastSyncTime}
            />
          )}

          {currentPage === 'docs' && (
            <DocViewer
              doc={docs[selectedDocId]}
              onUpdateContent={handleUpdateDocContent}
              onSelectDoc={(id) => setSelectedDocId(id)}
            />
          )}

          {currentPage === 'nodes' && (
            <NodeRegistry
              nodes={nodes}
              onToggleNodeStatus={handleToggleNodeStatus}
              onSimulateIngestion={handleSimulateIngestion}
              isSimulating={isSimulating}
              onUpdateNodeConfig={(nodeId, config) => {
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config } : n));
              }}
            />
          )}

          {currentPage === 'rag' && <RagSandbox />}

          {currentPage === 'memory' && (
            <MemoryConsole
              onSync={handleSync}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
            />
          )}
        </main>
      </div>

      {/* Footer info */}
      <Footer
        logs={logs}
        statusText={
          userCoords?.isLive
            ? `${userCoords.source === 'GPS' ? 'GPS' : userCoords.source === 'IP' ? 'IP lookup' : 'Manual'}: ${userCoords.city}`
            : `Default location (${userCoords?.city ?? 'none'}) — not located`
        }
        taskId={taskId}
        isExecuting={isSimulating}
      />
    </div>
  );
}
