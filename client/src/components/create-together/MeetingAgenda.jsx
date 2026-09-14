import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, X, Check } from 'lucide-react';

export default function MeetingAgenda({ onClose }) {
  const [items, setItems] = useState([
    { id: 1, text: 'Welcome & introductions', completed: true },
    { id: 2, text: 'Review current sprint & milestones', completed: false },
    { id: 3, text: 'Brainstorm new product innovations', completed: false },
    { id: 4, text: 'Action items & next steps', completed: false },
  ]);
  const [inputVal, setInputVal] = useState('');

  const toggleItem = (id) => {
    setItems(items.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it)));
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setItems([...items, { id: Date.now(), text: inputVal.trim(), completed: false }]);
    setInputVal('');
  };

  const deleteItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="w-full sm:w-80 md:w-96 h-full flex flex-col bg-white border-l border-slate-200/80 shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Meeting Agenda</h3>
            <p className="text-[11px] text-slate-500">{completedCount} of {items.length} items discussed</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Agenda Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              item.completed
                ? 'bg-slate-50 border-slate-200 text-slate-400'
                : 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-2.5 text-left flex-1"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  item.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 hover:border-emerald-500'
                }`}
              >
                {item.completed && <Check className="w-3 h-3" />}
              </div>
              <span className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                {item.text}
              </span>
            </button>

            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              className="text-slate-300 hover:text-rose-500 p-1"
              title="Delete Agenda Item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Form */}
      <form onSubmit={addItem} className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-1.5">
          <input
            type="text"
            placeholder="Add an agenda topic..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-all"
            title="Add topic"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
