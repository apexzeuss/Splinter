import React, { useState } from 'react';
import { 
  Code2, Terminal, Copy, Check, Sparkles, BookOpen, Layers, 
  ExternalLink, Zap, Cpu, Lock, ShieldCheck, Database
} from 'lucide-react';

export const DeveloperApiPage: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'typescript' | 'python' | 'curl'>('typescript');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets = {
    typescript: `// TypeScript / Node.js
import { SplinterClient } from '@splinter/thermal-mesh';

const client = new SplinterClient({
  apiKey: process.env.SPLINTER_API_KEY
});

// Request cool pedestrian path with solar shadow constraints
const route = await client.routing.computeShadedPath({
  origin: { lat: 33.4484, lng: -112.0740 },
  destination: { lat: 33.4530, lng: -112.0680 },
  options: {
    departureTime: new Date().toISOString(),
    minShadePercentage: 80,
    profile: 'vulnerable' // 'standard' | 'vulnerable' | 'runner' | 'ada'
  }
});

console.log(\`Shade Coverage: \${route.shadePercent}%\`);
console.log(\`Perceived Temp: \${route.perceivedTempC}°C\`);
console.log(\`Turn-by-Turn Steps:\`, route.steps);`,

    python: `# Python 3.10+
from splinter_gis import ThermalRouter

router = ThermalRouter(api_key="splinter_live_sec_9942a")

route = router.compute_cool_path(
    origin=(33.4484, -112.0740),
    destination=(33.4530, -112.0680),
    demographic_profile="vulnerable",
    max_heat_tolerance_c=32.0
)

print(f"Optimal Shade: {route.shade_coverage_percent}%")
print(f"Mean Radiant Temp: {route.mean_radiant_temp_c}°C")
for step in route.instructions:
    print(f"- {step.instruction} ({step.shade_percent}% shaded)")`,

    curl: `# cURL / REST API
curl -X POST https://api.splintergis.io/v1/routing/shade-path \\
  -H "Authorization: Bearer splinter_live_sec_9942a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": { "lat": 33.4484, "lng": -112.0740 },
    "destination": { "lat": 33.4530, "lng": -112.0680 },
    "solar_time": "2026-08-17T15:45:00Z",
    "persona": "elderly_pedestrian"
  }'`
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070709] p-4 sm:p-6 lg:p-10 text-zinc-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-purple-400 font-bold tracking-wider mb-1 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              DEVELOPER API & SDK WORKBENCH
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Splinter REST & Vector Graph API
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Integrate solar shadow raytracing and thermal pedestrian routing into mobile navigation apps, city transit kiosks, and mapping SDKs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              API Status: Operational (99.99%)
            </span>
          </div>
        </div>

        {/* API Sandbox / Code Snippet Panel */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveLang('typescript')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                  activeLang === 'typescript' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                TypeScript / Node
              </button>
              <button
                onClick={() => setActiveLang('python')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                  activeLang === 'python' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Python SDK
              </button>
              <button
                onClick={() => setActiveLang('curl')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                  activeLang === 'curl' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                cURL / REST
              </button>
            </div>

            <button
              onClick={() => handleCopy(codeSnippets[activeLang], 'code')}
              className="text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition"
            >
              {copiedKey === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'code' ? 'Copied to Clipboard' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#08080b] rounded-2xl border border-zinc-900 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
            <code>{codeSnippets[activeLang]}</code>
          </pre>
        </div>

        {/* API Endpoints Catalog */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Core API Endpoints
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-mono text-xs font-bold">
                  POST
                </span>
                <span className="font-mono text-xs text-white">/v1/routing/shade-path</span>
              </div>
              <div className="text-xs text-zinc-400">
                Computes optimal shaded walkway graph with sidewalk shade % and MRT metrics.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                  GET
                </span>
                <span className="font-mono text-xs text-white">/v1/solar/azimuth-vector</span>
              </div>
              <div className="text-xs text-zinc-400">
                Returns high-precision solar elevation, azimuth, and UV index for any lat/lng.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 font-mono text-xs font-bold">
                  GET
                </span>
                <span className="font-mono text-xs text-white">/v1/sensors/microclimate/live</span>
              </div>
              <div className="text-xs text-zinc-400">
                Streams real-time urban mesonet sensor readings across sidewalk corridors.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
