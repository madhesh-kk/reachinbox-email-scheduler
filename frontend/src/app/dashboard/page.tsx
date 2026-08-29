'use client';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../../lib/api';
import { EmailJob } from '../../lib/types';
import { Shell } from '../../components/shell';

export default function DashboardPage() {
  return (
    <Suspense fallback={<Shell><div className="p-6 text-slate-500">Loading dashboard...</div></Shell>}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'sent' ? 'sent' : 'scheduled';
  const queryClient = useQueryClient();
  
  // Invalidate queries when redirected with timestamp
  useEffect(() => {
    const timestamp = params.get('t');
    if (timestamp) {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  }, [params, queryClient]);
  
  // Filter by status
  // Sent tab: SENT, FAILED, and QUEUED (being processed)
  // Scheduled tab: SCHEDULED, DELAYED_RATE_LIMIT (future only)
  const status = tab === 'sent' ? 'SENT,FAILED,QUEUED' : 'SCHEDULED,DELAYED_RATE_LIMIT';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['emails', status],
    queryFn: () => request<{ items: EmailJob[], total: number }>(`/api/emails?status=${status}&pageSize=50`),
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });
  
  const { data: searchData, refetch: searchRefetch } = useQuery({
    queryKey: ['search', searchQuery, status],
    queryFn: () => request<EmailJob[]>(`/api/search?q=${encodeURIComponent(searchQuery)}&status=${status}`),
    enabled: false,
  });
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      await searchRefetch();
    } else {
      setIsSearching(false);
    }
  };
  
  // Filter displayData based on scheduledAt time
  const now = new Date().getTime();
  let displayData = isSearching ? searchData : data?.items;
  
  // Further filter based on tab and scheduled time
  if (displayData && tab === 'sent') {
    // Sent tab: show SENT, FAILED, and QUEUED emails (immediate sends)
    displayData = displayData.filter(email => {
      if (email.status === 'SENT' || email.status === 'FAILED') return true;
      // Include QUEUED if scheduled time is in the past (immediate send)
      if (email.status === 'QUEUED') {
        const scheduledTime = new Date(email.scheduledAt).getTime();
        return scheduledTime <= now + 60000; // Include if scheduled within last minute
      }
      return false;
    });
  } else if (displayData && tab === 'scheduled') {
    // Scheduled tab: show only future emails
    displayData = displayData.filter(email => {
      const scheduledTime = new Date(email.scheduledAt).getTime();
      return (email.status === 'SCHEDULED' || email.status === 'DELAYED_RATE_LIMIT') ||
        (email.status === 'QUEUED' && scheduledTime > now + 60000);
    });
  }
  
  const loading = isSearching ? false : isLoading;
  
  const getStatusBadge = (email: EmailJob) => {
    if (tab === 'sent') {
      switch (email.status) {
        case 'SENT': return 'Sent';
        case 'FAILED': return 'Failed';
        case 'QUEUED': return 'Sending...';
        default: return 'Sent';
      }
    } else {
      // Scheduled tab - ALWAYS show scheduled time
      return `◷ ${new Date(email.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  
  return (
    <Shell>
      <div className="min-h-screen">
        <div className="flex h-14 items-center gap-4 border-b border-slate-100 px-6">
          <form onSubmit={handleSearch} className="flex h-8 w-96 max-w-[70%] items-center rounded-full bg-slate-50 px-4">
            <span className="text-sm text-slate-400">⌕&nbsp;&nbsp;</span>
            <input
              type="text"
              placeholder="Search emails..."
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </form>
          <button className="icon-btn">▽</button>
          <button className="icon-btn" onClick={() => window.location.reload()}>↻</button>
        </div>
        
        <div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map(x => <div key={x} className="h-12 animate-pulse border-b bg-slate-50 rounded" />)}
            </div>
          ) : displayData?.length ? (
            <div>
              {displayData.map(email => (
                <Link
                  href={`/dashboard/email/${email.id}`}
                  key={email.id}
                  className="flex min-h-14 items-center gap-4 border-b border-slate-100 px-6 py-3 text-sm hover:bg-slate-50"
                >
                  <span className="w-48 shrink-0 font-medium truncate">To: {email.toEmail}</span>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      email.status === 'SENT' ? 'bg-slate-100 text-slate-600' :
                      email.status === 'QUEUED' ? 'bg-red-100 text-red-600' :
                      email.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                      email.status === 'DELAYED_RATE_LIMIT' ? 'bg-amber-100 text-amber-700' :
                      'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {getStatusBadge(email)}
                  </span>
                  <span className="flex-1 truncate font-semibold">
                    {email.subject} <span className="font-normal text-slate-400">- {email.body.replace(/<[^>]+>/g, '').slice(0, 70)}</span>
                  </span>
                  <span className="ml-auto text-slate-300 text-lg">☆</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-96 place-items-center text-center">
              <div>
                <div className="text-4xl text-slate-300">✉</div>
                <h2 className="mt-4 text-base font-semibold">
                  {isSearching ? 'No results found' : 'No ' + tab + ' emails yet'}
                </h2>
                {!isSearching && (
                  <Link href="/dashboard/compose" className="btn btn-primary mt-5 inline-block text-sm">
                    Compose
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
