import React, { useState, useEffect } from 'react';
import { Expand, AlertTriangle, Loader2, Copy, Download, Check } from 'lucide-react';
import mermaid from 'mermaid';

const Mermaid = ({ chart, onExpand, isModal = false }) => {
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle', 'copying', 'copied'

  useEffect(() => {
    const renderChart = async () => {
      try {
        setIsLoading(true);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    renderChart();
  }, [chart]);

  const copyToClipboard = async () => {
    try {
      setCopyStatus('copying');
      await navigator.clipboard.writeText(chart);
      setCopyStatus('copied');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus('idle');
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = chart;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyStatus('copied');
        setTimeout(() => {
          setCopyStatus('idle');
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 my-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-2">
              Mermaid Diagram Error
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{error}</p>
            <details className="group">
              <summary className="cursor-pointer text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                View Chart Source
              </summary>
              <pre className="text-slate-700 dark:text-slate-300 text-xs mt-3 overflow-auto bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono leading-relaxed">
                {chart}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center my-8 h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-100 animate-spin"></div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 font-medium">
          Rendering diagram...
        </p>
      </div>
    );
  }

  if (!svg) return null;

  return (
    <div
      className={`relative group ${
        isModal
          ? 'flex justify-center items-center'
          : 'my-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700   transition-all duration-300 overflow-hidden'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Diagram Content */}
      <div className={`${isModal ? '' : 'p-6'} flex justify-center items-center`}>
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="mermaid-diagram [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:rounded-lg"
        />
      </div>

      {/* Controls */}
      {!isModal && (
        <div
          className={`absolute top-4 right-4 flex items-center gap-2 transition-all duration-300 ${
            showControls
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {/* Copy Button with Status */}
          <button
            onClick={copyToClipboard}
            disabled={copyStatus === 'copying'}
            className="p-2.5 bg-white dark:bg-slate-800 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
            title={
              copyStatus === 'copied'
                ? 'Copied!'
                : copyStatus === 'copying'
                ? 'Copying...'
                : 'Copy Source'
            }
          >
            {copyStatus === 'copied' ? (
              <Check className="h-4 w-4 animate-in zoom-in duration-200" />
            ) : copyStatus === 'copying' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            )}
          </button>

          <button
            onClick={downloadSvg}
            className="p-2.5 bg-white dark:bg-slate-800 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
            title="Download SVG"
          >
            <Download className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={() => onExpand(chart)}
            className="p-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow-lg text-white dark:text-slate-900 transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
            title="Expand Diagram"
          >
            <Expand className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Subtle overlay for better control visibility */}
      {!isModal && showControls && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5 dark:to-white/5 pointer-events-none transition-opacity duration-300" />
      )}
    </div>
  );
};

export default Mermaid;