import React, { useState } from 'react';
import { 
  Building2, Users, ShieldAlert, Sparkles, Send, CheckCircle2, 
  MapPin, ArrowRight, HeartPulse, Stethoscope, Landmark, PhoneCall
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const [reportType, setReportType] = useState<'unshaded_stop' | 'broken_shade' | 'heat_emergency'>('unshaded_stop');
  const [locationText, setLocationText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [communityReports, setCommunityReports] = useState([
    {
      id: 'rep-1',
      type: 'Unshaded Bus Shelter',
      location: 'Pine St & 3rd Ave Transit Stop',
      votes: 42,
      status: 'Under Review by City Council',
      timestamp: '2 hours ago'
    },
    {
      id: 'rep-2',
      type: 'Hydration Station Requested',
      location: 'Civic Plaza North Walkway',
      votes: 78,
      status: 'Approved for Installation (Q3)',
      timestamp: 'Yesterday'
    },
    {
      id: 'rep-3',
      type: 'Dead Tree Canopy / Shade Gap',
      location: 'Medical District Hospital Crosswalk',
      votes: 115,
      status: 'Assigned to Urban Forestry',
      timestamp: '3 days ago'
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationText.trim()) return;

    const newRep = {
      id: `rep-${Date.now()}`,
      type: reportType === 'unshaded_stop' ? 'Unshaded Public Transit Stop' : reportType === 'broken_shade' ? 'Canopy / Shade Gap' : 'Urgent Heat Hazard',
      location: locationText,
      votes: 1,
      status: 'Submitted to Dispatch',
      timestamp: 'Just now'
    };

    setCommunityReports([newRep, ...communityReports]);
    setLocationText('');
    setDescriptionText('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070709] p-4 sm:p-6 lg:p-10 text-zinc-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="text-xs font-mono uppercase text-blue-400 font-bold tracking-wider mb-1 flex items-center gap-2">
            <Users className="w-4 h-4" />
            CIVIC ENGAGEMENT & HEAT EQUITY
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Community Shade & Cooling Network
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Crowdsource high-heat danger zones, request municipal tree plantings, and locate emergency cooling centers for vulnerable citizens.
          </p>
        </div>

        {/* Emergency Cooling Centers Grid */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              Designated Emergency Cooling Centers (Open Now)
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
              FREE HYDRATION & A/C
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Downtown Public Library</span>
                <span className="text-[10px] font-mono text-emerald-400">0.3 miles</span>
              </div>
              <div className="text-xs text-zinc-400">122 N Central Ave · Open until 9:00 PM</div>
              <div className="text-[11px] text-zinc-300 flex items-center gap-1.5 pt-1 font-mono">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Air Conditioning & Electrolytes
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Civic Recreation Center</span>
                <span className="text-[10px] font-mono text-emerald-400">0.6 miles</span>
              </div>
              <div className="text-xs text-zinc-400">450 W Washington St · Open 24/7</div>
              <div className="text-[11px] text-zinc-300 flex items-center gap-1.5 pt-1 font-mono">
                <Stethoscope className="w-3.5 h-3.5 text-blue-400" /> Medical Triage on Duty
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">St. Mary's Community Hall</span>
                <span className="text-[10px] font-mono text-emerald-400">0.9 miles</span>
              </div>
              <div className="text-xs text-zinc-400">230 E Monroe St · Open until 8:00 PM</div>
              <div className="text-[11px] text-zinc-300 flex items-center gap-1.5 pt-1 font-mono">
                <PhoneCall className="w-3.5 h-3.5 text-purple-400" /> Free Water Refills & Misting
              </div>
            </div>
          </div>
        </div>

        {/* Crowdsource Report Form & Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submit New Report */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Report a Heat Hazard or Request Shade
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your report routes directly to city planners to prioritize shade structures, bus awnings, and tree planting budgets.
              </p>
            </div>

            {submitted && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Report logged successfully! Urban planning team notified.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-300 font-semibold mb-1.5">Hazard / Request Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportType('unshaded_stop')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-center ${
                      reportType === 'unshaded_stop' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Transit Stop
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('broken_shade')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-center ${
                      reportType === 'broken_shade' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Tree Canopy
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('heat_emergency')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-center ${
                      reportType === 'heat_emergency' ? 'bg-rose-600 border-rose-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Heat Hazard
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 font-semibold mb-1.5">Street Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g., 4th Ave & Pine St Crosswalk"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 font-semibold mb-1.5">Description & Observations</label>
                <textarea
                  placeholder="Describe direct solar exposure, lack of seating, vulnerable elderly foot traffic..."
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Civic Hazard Report
              </button>
            </form>
          </div>

          {/* Live Community Reports Feed */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Recent Civic Shade Petitions
            </h2>

            <div className="space-y-3">
              {communityReports.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{r.type}</span>
                      <span className="text-[10px] font-mono text-zinc-400">· {r.timestamp}</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">{r.location}</div>
                    <div className="text-[10px] font-mono text-blue-400 mt-1">{r.status}</div>
                  </div>

                  <div className="flex flex-col items-center pl-3">
                    <button
                      onClick={() => {
                        setCommunityReports(prev => prev.map(item => item.id === r.id ? { ...item, votes: item.votes + 1 } : item));
                      }}
                      className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-blue-600 hover:text-white transition font-mono text-xs font-bold text-zinc-300"
                    >
                      ▲ {r.votes}
                    </button>
                    <span className="text-[9px] text-zinc-400 mt-0.5">Upvotes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
