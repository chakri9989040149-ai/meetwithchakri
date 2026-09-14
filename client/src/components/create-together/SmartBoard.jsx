import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  Trash2,
  Download,
  StickyNote,
  X,
  Undo2
} from 'lucide-react';
import { getSocket } from '../../services/socket';

const COLORS = [
  '#0F172A', // Slate black
  '#7C3AED', // Brand Purple
  '#2563EB', // Blue
  '#DC2626', // Red
  '#059669', // Emerald green
  '#D97706', // Amber
  '#EC4899', // Pink
];

export default function SmartBoard({ roomId, onClose }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // 'pen', 'highlighter', 'eraser', 'rectangle', 'circle', 'line'
  const [color, setColor] = useState('#7C3AED');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');

  const socket = getSocket();
  const startPosRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);

  // Resize canvas to match display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Socket listener for strokes from other participants
    const handleRemoteStroke = (stroke) => {
      drawRemoteStroke(stroke);
    };

    const handleClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleWhiteboardHistory = (strokes) => {
      strokes.forEach(drawRemoteStroke);
    };

    socket.on('draw-stroke', handleRemoteStroke);
    socket.on('whiteboard-cleared', handleClear);
    socket.on('whiteboard-history', handleWhiteboardHistory);

    return () => {
      socket.off('draw-stroke', handleRemoteStroke);
      socket.off('whiteboard-cleared', handleClear);
      socket.off('whiteboard-history', handleWhiteboardHistory);
    };
  }, [socket]);

  const drawRemoteStroke = (stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = stroke.lineWidth * 3;
    } else {
      ctx.globalAlpha = 1.0;
    }

    if (stroke.type === 'line' || stroke.type === 'freehand') {
      ctx.beginPath();
      ctx.moveTo(stroke.from.x, stroke.from.y);
      ctx.lineTo(stroke.to.x, stroke.to.y);
      ctx.stroke();
    } else if (stroke.type === 'rectangle') {
      ctx.strokeRect(
        stroke.from.x,
        stroke.from.y,
        stroke.to.x - stroke.from.x,
        stroke.to.y - stroke.from.y
      );
    } else if (stroke.type === 'circle') {
      const radius = Math.hypot(stroke.to.x - stroke.from.x, stroke.to.y - stroke.from.y);
      ctx.beginPath();
      ctx.arc(stroke.from.x, stroke.from.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoords(e);
    startPosRef.current = coords;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = lineWidth * 4;
        ctx.globalAlpha = 1.0;
      } else if (tool === 'highlighter') {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth * 3;
        ctx.globalAlpha = 0.35;
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 1.0;
      }

      ctx.beginPath();
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.restore();

      // Emit stroke
      const strokeData = {
        type: 'freehand',
        tool,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        lineWidth: tool === 'eraser' ? lineWidth * 4 : lineWidth,
        from: startPosRef.current,
        to: coords
      };
      socket.emit('draw-stroke', { roomId, stroke: strokeData });

      startPosRef.current = coords;
    } else {
      // Shape preview: restore snapshot first then render shape preview
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === 'rectangle') {
        ctx.strokeRect(
          startPosRef.current.x,
          startPosRef.current.y,
          coords.x - startPosRef.current.x,
          coords.y - startPosRef.current.y
        );
      } else if (tool === 'circle') {
        const radius = Math.hypot(coords.x - startPosRef.current.x, coords.y - startPosRef.current.y);
        ctx.beginPath();
        ctx.arc(startPosRef.current.x, startPosRef.current.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
      const coords = getCanvasCoords(e);
      const strokeData = {
        type: tool,
        tool,
        color,
        lineWidth,
        from: startPosRef.current,
        to: coords
      };
      socket.emit('draw-stroke', { roomId, stroke: strokeData });
    }
  };

  const handleClearBoard = () => {
    if (window.confirm('Clear the entire whiteboard for everyone?')) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('clear-whiteboard', { roomId });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `chakri-meet-whiteboard-${roomId}.png`;
    link.href = url;
    link.click();
  };

  const handleAddStickyNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const note = {
      id: Date.now(),
      text: noteInput.trim(),
      x: 40 + Math.random() * 200,
      y: 40 + Math.random() * 150,
      color: '#FEF08A' // light yellow
    };
    setStickyNotes([...stickyNotes, note]);
    setNoteInput('');
  };

  return (
    <div className="absolute inset-4 z-40 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95">
      {/* Top Bar: Title & Controls */}
      <div className="p-3 sm:px-6 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-100 text-brand-700">
            <Pen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Smart Ideas Board</h3>
            <p className="text-[11px] text-slate-500">Real-time collaborative brainstorming canvas</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-white border border-slate-200 shadow-sm transition-all"
            title="Download Whiteboard as Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClearBoard}
            className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-white border border-slate-200 shadow-sm transition-all"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 shadow-sm transition-all"
            title="Close Board"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-white cursor-crosshair overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />

        {/* Sticky Notes on Board */}
        {stickyNotes.map((note) => (
          <div
            key={note.id}
            style={{ left: note.x, top: note.y }}
            className="absolute p-3 rounded-xl bg-amber-100/95 border border-amber-300 shadow-lg text-xs text-slate-800 w-44 min-h-[90px] cursor-move transition-transform active:scale-105"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Idea</span>
              <button
                type="button"
                onClick={() => setStickyNotes(stickyNotes.filter((n) => n.id !== note.id))}
                className="text-amber-800/60 hover:text-amber-900"
              >
                &times;
              </button>
            </div>
            <p className="font-medium whitespace-pre-wrap">{note.text}</p>
          </div>
        ))}
      </div>

      {/* Floating Toolbar at Bottom */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'pen' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Pen"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'highlighter' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('rectangle')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'rectangle' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('circle')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'circle' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('line')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'line' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'eraser' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-brand-500 ring-offset-2' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Add Sticky Note Form */}
        <form onSubmit={handleAddStickyNote} className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Add sticky note idea..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm flex items-center gap-1"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>
    </div>
  );
}
