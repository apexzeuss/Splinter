import React, { useState } from 'react';
import { TaskItem, ArchitectureDirective } from '../types';
import { Check, Plus, ArrowRight, ShieldCheck, Sparkles, ExternalLink, RefreshCw, Layers, CheckCircle2, Circle } from 'lucide-react';

interface HandoffOverviewProps {
  tasks: TaskItem[];
  directives: ArchitectureDirective[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (text: string, category: TaskItem['category']) => void;
  onNavigateToDocs: (docId: string, section?: string) => void;
  onNavigateToNodes: () => void;
  lastSyncTime: string;
}

export const HandoffOverview: React.FC<HandoffOverviewProps> = ({
  tasks,
  directives,
  onToggleTask,
  onAddTask,
  onNavigateToDocs,
  onNavigateToNodes,
  lastSyncTime
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskItem['category']>('Core');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const completedCount = tasks.filter(t => t.completed).length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim(), newTaskCategory);
    setNewTaskText('');
    setIsAddingTask(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0B] p-6 lg:p-8 overflow-y-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <div className="text-blue-500 text-xs font-mono mb-2 uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Current State: Handoff Phase
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Development Continuation
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            Resuming work based on architectural guidelines and established memory context. Do not modify established structures.
          </p>
        </div>

        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 shrink-0 self-start">
          <div className="text-xs text-slate-500 mb-1 font-medium">Last Sync</div>
          <div className="text-sm font-mono text-slate-200 font-semibold">{lastSyncTime}</div>
        </div>
      </div>

      {/* Main Grid: Architecture Directives & Pending from Handoff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Column: Architecture Directives */}
        <div className="bg-[#111113] border border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="text-sm font-semibold text-slate-200">Architecture Directives</h3>
            </div>
            <button
              onClick={() => onNavigateToDocs('architecture.md')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono transition"
            >
              <span>architecture.md</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3.5 text-sm text-slate-400 flex-1 overflow-y-auto pr-1">
            {directives.map((dir) => (
              <div
                key={dir.id}
                className="p-3.5 bg-slate-900/50 rounded-lg border border-slate-800/90 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-slate-200 font-medium text-sm flex items-center gap-2">
                    <span>{dir.title}</span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-800/40">
                      {dir.sectionRef}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {dir.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {dir.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {dir.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Core Interface Contract Quick Preview */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="p-3 bg-[#0A0A0B] rounded-lg border border-slate-800/90">
              <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                <span>Contract: ISplinterNode §4.2</span>
                <span className="text-emerald-400 font-medium">LOCKED</span>
              </div>
              <pre className="text-[10px] font-mono text-blue-300 overflow-x-auto p-1 bg-slate-950/80 rounded">
                <code>{`export interface ISplinterNode<TInput, TOutput> {
  readonly id: string;
  readonly name: string;
  readonly type: 'source' | 'processor' | 'embedder' | 'vectordb';
  process(payload: TInput): Promise<TOutput>;
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Pending from Handoff */}
        <div className="bg-[#111113] border border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <h3 className="text-sm font-semibold text-slate-200">Pending from Handoff</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                {completedCount}/{tasks.length} Completed
              </span>
              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="text-xs text-blue-400 hover:text-blue-300 p-1 rounded bg-slate-800/50 hover:bg-slate-800"
                title="Add handoff action"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New Task Inline Form */}
          {isAddingTask && (
            <form onSubmit={handleCreateTask} className="mb-3 p-3 bg-slate-900/90 border border-blue-600/30 rounded-lg">
              <div className="text-xs font-semibold text-slate-200 mb-2">Add Handoff Task</div>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="e.g. Implement Dead Letter Queue for failed batch jobs..."
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 mb-2"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                >
                  <option value="Core">Core System</option>
                  <option value="Pipeline">Pipeline</option>
                  <option value="Auth">Auth</option>
                  <option value="Memory">Memory</option>
                  <option value="Tests">Tests</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const isHighlight = task.id === 'task-2' && !task.completed;

              return (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer select-none transition-all ${
                    task.completed
                      ? 'bg-slate-900/30 border border-slate-800/40 opacity-75'
                      : isHighlight
                      ? 'bg-blue-600/5 rounded-lg border border-blue-600/30 hover:border-blue-500/50 shadow-sm'
                      : 'bg-slate-900/50 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}} // Handled by parent container click
                    className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm ${
                          task.completed
                            ? 'text-slate-500 line-through'
                            : isHighlight
                            ? 'text-slate-200 font-medium'
                            : 'text-slate-300'
                        }`}
                      >
                        {task.text}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          task.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.category}
                      </span>
                    </div>
                    {task.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">Next Milestone: Phase 2</span>
            <button
              onClick={onNavigateToNodes}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-blue-600/30 transition"
            >
              <span>Open Node Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
