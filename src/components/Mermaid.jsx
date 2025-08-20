import React, { useState, useEffect } from 'react';
import { Expand, AlertTriangle, Loader2, Copy, Download, Check } from 'lucide-react';
import mermaid from 'mermaid';

const Mermaid = ({ chart, onExpand, isModal = false }) => {
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // copy statuses
  const [copySrcStatus, setCopySrcStatus] = useState('idle'); // idle | copying | copied
  const [copyErrStatus, setCopyErrStatus] = useState('idle'); // idle | copying | copied

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      setIsLoading(true);
      setError(null);
      setSvg(null);

      try {
        // Validate first to get a real exception for grammar errors.
        mermaid.parse(chart);

        // Render may still return an "error SVG" instead of throwing.
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);

        // Detect Mermaid's built-in error diagram and treat it as a failure.
        const looksLikeError =
          /Mermaid Diagram Error|Parse error|class=["']error["']|data-parseerror/i.test(svg);

        if (looksLikeError) {
          throw new Error('Mermaid returned an error diagram.');
        }

        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.str || err?.message || 'Failed to render Mermaid diagram.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  const copyText = async (value, setStatus) => {
    try {
      setStatus('copying');
      await navigator.clipboard.writeText(value);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('idle');
      }
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
    // Fallback UI with copy buttons; no Expand button when there is an error.
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 my-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-2">
              Mermaid render failed
            </h3>

            {/* Error text in a scrollable pre to avoid overflow */}
            <pre className="text-slate-700 dark:text-slate-300 text-xs overflow-auto bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono leading-relaxed max-h-40 whitespace-pre">
              {error}
            </pre>

            <details className="group my-3">
              <summary className="cursor-pointer text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                View chart source
              </summary>
              <pre className="text-slate-700 dark:text-slate-300 text-xs mt-2 overflow-auto bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono leading-relaxed max-h-56">
                {chart}
              </pre>
            </details>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(error, setCopyErrStatus)}
                disabled={copyErrStatus === 'copying'}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                title={copyErrStatus === 'copied' ? 'Copied!' : 'Copy error'}
              >
                {copyErrStatus === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copyErrStatus === 'copied' ? 'Copied' : 'Copy error'}</span>
              </button>

              <button
                onClick={() => copyText(chart, setCopySrcStatus)}
                disabled={copySrcStatus === 'copying'}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                title={copySrcStatus === 'copied' ? 'Copied!' : 'Copy source'}
              >
                {copySrcStatus === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copySrcStatus === 'copied' ? 'Copied' : 'Copy source'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center my-8 h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-100 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 font-medium">Rendering diagram...</p>
      </div>
    );
  }

  if (!svg) return null;

  return (
    <div
      className={`relative group ${
        isModal
          ? 'flex justify-center items-center'
          : 'my-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex justify-center items-center min-h-[20rem]'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className={`${isModal ? '' : 'p-6'} w-full flex justify-center items-center`}>
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="mermaid-diagram w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:rounded-lg"
        />
      </div>

      {!isModal && (
        <div
          className={`absolute top-4 right-4 flex items-center gap-2 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <button
            onClick={() => copyText(chart, setCopySrcStatus)}
            disabled={copySrcStatus === 'copying'}
            className="p-2.5 bg-white dark:bg-slate-8 00 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
            title={copySrcStatus === 'copied' ? 'Copied!' : copySrcStatus === 'copying' ? 'Copying...' : 'Copy Source'}
          >
            {copySrcStatus === 'copied' ? (
              <Check className="h-4 w-4" />
            ) : copySrcStatus === 'copying' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={downloadSvg}
            className="p-2.5 bg-white dark:bg-slate-800 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Download SVG"
          >
            <Download className="h-4 w-4" />
          </button>

          {onExpand && (
            <button
              onClick={() => onExpand(chart)}
              className="p-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow-lg text-white dark:text-slate-900 transition-all duration-200 hover:scale-105 active:scale-95"
              title="Expand Diagram"
            >
              <Expand className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {!isModal && showControls && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5 dark:to-white/5 pointer-events-none transition-opacity duration-300" />
      )}
    </div>
  );
};

export default Mermaid;