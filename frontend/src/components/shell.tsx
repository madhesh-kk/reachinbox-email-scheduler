'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from '../lib/api';
import type { EmailJob } from '../lib/types';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => request<{ id: string; email: string; slackChannel?: string | null }>('/auth/me'),
  });

  const { data: scheduledData } = useQuery({
    queryKey: ['emails', 'SCHEDULED'],
    queryFn: () => request<{ items: EmailJob[]; total: number }>('/api/emails?status=SCHEDULED,DELAYED_RATE_LIMIT&pageSize=1'),
    refetchInterval: 3000,
  });

  const { data: sentData } = useQuery({
    queryKey: ['emails', 'SENT'],
    queryFn: () => request<{ items: EmailJob[]; total: number }>('/api/emails?status=SENT,FAILED,QUEUED&pageSize=1'),
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await fetch('http://localhost:4000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear cookies and storage
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      document.cookie = 'reachinbox_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Force redirect to login
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-56 border-r border-slate-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-slate-200">
          <span className="font-bold text-xl text-slate-900 tracking-wider">ONB</span>
        </div>

        {/* User Profile with Dropdown */}
        <div className="border-b border-slate-200 p-3 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-sm font-semibold">
              {user?.email?.[0].toUpperCase() || 'O'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {user?.email?.split('@')[0] || 'Oliver Brown'}
              </div>
              <div className="text-xs text-slate-500 truncate">{user?.email || 'oliver.brown@domain.co'}</div>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              {user?.slackChannel ? (
                <button
                  onClick={async () => {
                    try {
                      await fetch('http://localhost:4000/auth/slack/disconnect', {
                        method: 'POST',
                        credentials: 'include',
                      });
                      window.location.reload();
                    } catch (error) {
                      console.error('Slack disconnect error:', error);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                  </svg>
                  <span>✅ Slack Connected</span>
                </button>
              ) : (
                <a
                  href="http://localhost:4000/auth/slack"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                  </svg>
                  <span>Connect Slack</span>
                </a>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <div className="px-3 pt-4 pb-3">
          <Link
            href="/dashboard/compose"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Compose</span>
          </Link>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-2 pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CORE</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <Link
            href="/dashboard?tab=scheduled"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Scheduled</span>
            <span className="ml-auto text-xs font-semibold text-slate-500">{scheduledData?.total ?? 0}</span>
          </Link>

          <Link
            href="/dashboard?tab=sent"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-emerald-50 transition-colors bg-emerald-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Sent</span>
            <span className="ml-auto text-xs font-semibold text-slate-500">{sentData?.total ?? 0}</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
