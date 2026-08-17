import React, { useState, useEffect } from 'react';
import { DocId, ProjectDoc, TaskItem, ArchitectureDirective, SplinterNode, LogEntry } from './types';
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

  // Real Browser Geolocation State
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
    city: string;
    tempC: number;
    isLive: boolean;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const taskId = 'e_6a809a7420ac8325a91c1e9b50cdb6ad';

  // Request device geolocation via browser navigator.geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let cityName = "My GPS Location";
        let temp = 32.5;

        try {
          // Attempt reverse geocode via open-meteo / nominatim
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
          if (res.ok) {
            const data = await res.json();
            if (data.current_weather && typeof data.current_weather.temperature === 'number') {
              temp = data.current_weather.temperature;
            }
          }
          cityName = `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
        } catch (e) {
          console.log("Weather fetch fallback", e);
        }

        setUserCoords({
          lat,
          lng,
          city: cityName,
          tempC: Math.round(temp * 10) / 10,
          isLive: true
        });
        setIsLocating(false);

        const time = new Date().toTimeString().split(' ')[0];
        setLogs(prev => [
          {
            id: `log-${Date.now()}`,
            timestamp: time,
            level: 'success',
            source: 'GEOLOCATION_GPS',
            message: `User location acquired: ${lat.toFixed(4)}, ${lng.toFixed(4)} · Ambient: ${temp}°C`
          },
          ...prev
        ]);
      },
      (err) => {
        console.warn("Geolocation denied or timed out:", err.message);
        setIsLocating(false);
        // Fallback default
        setUserCoords({
          lat: 33.4484,
          lng: -112.0740,
          city: "Phoenix, AZ (Default)",
          tempC: 39.5,
          isLive: false
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
        isLocating={isLocating}
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
              isLocating={isLocating}
            />
          )}

          {/* 2. Live 2.5D Router Simulator */}
          {currentPage === 'router' && (
            <ShadowRouterSimulator userCoords={userCoords} />
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
        statusText={userCoords?.isLive ? `LIVE GPS ONLINE (${userCoords.city})` : 'STANDING BY'}
        taskId={taskId}
        isExecuting={isSimulating}
      />
    </div>
  );
}
