import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

export default function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || 'An unexpected error occurred while connecting to the meeting.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8FF] via-white to-brand-50/50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-extrabold text-slate-900">
              Meeting Notice
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/create')}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start New Meeting</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
