import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Info,
} from 'lucide-react';
import Mermaid from './Mermaid';

const MermaidModal = ({ chart, isOpen, onClose }) => {
  const [state, setState] = useState({
    transform: { scale: 1, x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    showControls: true
  });
  const containerRef = useRef(null);
  const prevIsOpenRef = useRef(isOpen);

  // Reset state when modal opens without using useEffect
  if (isOpen && !prevIsOpenRef.current) {
    setState({
      transform: { scale: 1, x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      showControls: true
    });
  }
  prevIsOpenRef.current = isOpen;

  // Memoize handlers to prevent effect dependency issues
  const handleZoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      transform: { ...prev.transform, scale: Math.min(prev.transform.scale * 1.2, 10) }
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      transform: { ...prev.transform, scale: Math.max(prev.transform.scale / 1.2, 0.1) }
    }));
  }, []);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      transform: { scale: 1, x: 0, y: 0 }
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleReset();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset]);

  if (!isOpen) return null;

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.diagram-controls')) return;
    e.preventDefault();
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: {
        x: e.clientX - prev.transform.x,
        y: e.clientY - prev.transform.y
      }
    }));
  };

  const handleMouseMove = (e) => {
    if (!state.isDragging) return;
    e.preventDefault();
    setState(prev => ({
      ...prev,
      transform: {
        ...prev.transform,
        x: e.clientX - prev.dragStart.x,
        y: e.clientY - prev.dragStart.y
      }
    }));
  };

  const handleMouseUp = () => {
    setState(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  const handleMouseLeave = () => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      showControls: false
    }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setState(prev => ({
      ...prev,
      transform: {
        ...prev.transform,
        scale: Math.min(Math.max(prev.transform.scale * delta, 0.1), 10)
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50">
        
        {/* Header Controls */}
        <div className="diagram-controls flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomIn}
              className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Reset View (0)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 ml-2">
              <Maximize2 className="h-4 w-4" />
              <span className="font-medium">{Math.round(state.transform.scale * 100)}%</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-400/10 dark:hover:bg-red-400/20 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Diagram Area */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative select-none ${
            state.isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setState(prev => ({ ...prev, showControls: true }))}
          onWheel={handleWheel}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <div className="w-full h-full flex items-center justify-center p-6">
            <div
              className="transition-transform duration-100 ease-out bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6"
              style={{
                transform: `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`,
                transformOrigin: 'center center'
              }}
            >
              <Mermaid chart={chart} isModal={true} />
            </div>
          </div>
          
          {/* Instructions */}
          <div
            className={`absolute bottom-6 right-6 bg-black/75 dark:bg-slate-900/90 text-white dark:text-slate-100 text-xs px-4 py-3 rounded-xl select-none backdrop-blur-sm border border-white/10 transition-opacity duration-300 ${
              state.showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-3 w-3" />
              <span className="font-medium">Controls</span>
            </div>
            <div className="space-y-0.5 text-white/90 dark:text-slate-200">
              <div>• Mouse wheel: Zoom in/out</div>
              <div>• Click and drag: Move diagram</div>
              <div>• Press Esc to close</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidModal;