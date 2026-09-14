import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8FF] via-white to-brand-50/50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-extrabold text-slate-900">404</h1>
          <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500">
            The page or meeting link you are looking for does not exist or has moved.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Chakri's Meet</span>
          </button>
        </div>
      </main>
    </div>
  );
}
