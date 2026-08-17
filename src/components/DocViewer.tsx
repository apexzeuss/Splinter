import React, { useState } from 'react';
import { ProjectDoc, DocId } from '../types';
import { Copy, Check, Edit3, Eye, FileText, Download, Sparkles, BookOpen, Clock, Tag } from 'lucide-react';
import Markdown from 'react-markdown';

interface DocViewerProps {
  doc: ProjectDoc;
  onUpdateContent: (docId: DocId, newContent: string) => void;
  onSelectDoc: (id: DocId) => void;
}

export const DocViewer: React.FC<DocViewerProps> = ({ doc, onUpdateContent, onSelectDoc }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(doc.content);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');

  // Keep local state in sync when doc changes
  React.useEffect(() => {
    setEditedContent(doc.content);
    setIsEditing(false);
  }, [doc.id, doc.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateContent(doc.id, editedContent);
    setIsEditing(false);
  };

  const wordCount = doc.content.trim().split(/\s+/).length;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0B] h-full overflow-hidden">
      {/* Doc Action Bar */}
      <div className="h-14 border-b border-slate-800 bg-[#111113] px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-lg">{doc.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">{doc.name}</h2>
              <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                {doc.category}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Last updated: {doc.lastUpdated}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {!isEditing && (
            <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('rendered')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                  viewMode === 'rendered' ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rendered</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                  viewMode === 'raw' ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Raw</span>
              </button>
            </div>
          )}

          {/* Edit / Save Button */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditedContent(doc.content);
                  setIsEditing(false);
                }}
                className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Markdown Button */}
          <button
            onClick={() => {
              const blob = new Blob([doc.content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = doc.id;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-blue-400 hover:border-slate-700 text-xs transition font-mono"
            title="Download Markdown file"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Doc Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {isEditing ? (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Markdown Editor</span>
                <span>{editedContent.length} characters</span>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-[600px] bg-[#0c0c0e] text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed resize-none shadow-inner"
              />
            </div>
          ) : viewMode === 'raw' ? (
            <pre className="bg-[#111113] p-6 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              <code>{doc.content}</code>
            </pre>
          ) : (
            <div className="bg-[#111113] p-8 rounded-2xl border border-slate-800 shadow-sm text-slate-300 prose prose-invert max-w-none">
              <div className="markdown-body space-y-4">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-white border-b border-slate-800 pb-3 mb-4 tracking-tight flex items-center gap-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold text-slate-100 mt-6 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold text-slate-200 mt-4 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300 mb-4 pl-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-300 mb-4 pl-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm text-slate-300">{children}</li>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="text-[12px] font-mono bg-slate-900 text-blue-300 px-1.5 py-0.5 rounded border border-slate-800">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-[#0A0A0B] p-4 rounded-xl border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto my-3">
                          <code>{children}</code>
                        </pre>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-blue-500 pl-4 py-1 my-3 bg-blue-950/20 text-slate-300 text-sm italic rounded-r">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="border-slate-800 my-6" />
                  }}
                >
                  {doc.content}
                </Markdown>
              </div>
            </div>
          )}

          {/* Document Stats Footer */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono px-2">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>Encoding: UTF-8</span>
            </div>
            <span>Splinter Documentation Registry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
