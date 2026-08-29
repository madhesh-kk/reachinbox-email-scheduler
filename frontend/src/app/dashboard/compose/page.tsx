'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useQuery } from '@tanstack/react-query';
import { request } from '../../../lib/api';
import { Shell } from '../../../components/shell';

type Sender = { id: string; fromEmail: string };

export default function Compose() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => request<{ id: string; email: string }>('/auth/me'),
  });
  const { data: senders = [] } = useQuery({
    queryKey: ['senders'],
    queryFn: () => request<Sender[]>('/api/senders'),
  });

  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delay, setDelay] = useState('2');
  const [limit, setLimit] = useState('200');
  const [later, setLater] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get or create sender for current user
  const getSenderIdOrCreate = async (): Promise<string> => {
    if (senders.length > 0) return senders[0].id;
    // Auto-create sender if none exists
    try {
      const newSender = await request<Sender>('/api/senders', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return newSender.id;
    } catch (e) {
      throw new Error('Failed to setup sender email');
    }
  };

  const add = () => {
    if (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) &&
      !recipients.includes(recipient)
    ) {
      setRecipients([...recipients, recipient]);
      setRecipient('');
    }
  };

  const upload = (file: File) =>
    Papa.parse<string[]>(file, {
      complete: (r) =>
        setRecipients(
          Array.from(
            new Set([
              ...recipients,
              ...r.data.flat().filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)),
            ])
          )
        ),
    });

  const handleEditorInput = () => {
    const text = (editorRef.current?.textContent || '').trim();
    const html = editorRef.current?.innerHTML || '';
    const hasText = text.length > 0;
    const hasHTML = html.includes('<img') || html.includes('<div') || html.includes('<p');
    setHasEditorContent(hasText || hasHTML);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments([...attachments, ...files]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const submit = async (sendNow?: boolean) => {
    const text = (editorRef.current?.textContent || '').trim();

    // Validation
    if (!recipients.length) {
      alert('Please add at least one recipient email');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter a subject');
      return;
    }
    if (text.length === 0) {
      alert('Please enter email content');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const senderId = await getSenderIdOrCreate();
      const body = editorRef.current?.innerHTML || '';
      
      // Calculate scheduled time
      let scheduledTime: Date;
      
      if (sendNow) {
        // Send immediately - use current time
        scheduledTime = new Date();
      } else {
        // Send later - parse datetime-local value correctly
        const [dateStr, timeStr] = startTime.split('T');
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Create Date in local timezone
        scheduledTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        // Verify it's in the future
        if (scheduledTime.getTime() <= Date.now()) {
          alert('Scheduled time must be in the future');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare FormData for file upload
      const formData = new FormData();
      
      // Add JSON data (always use Ethereal)
      formData.append('data', JSON.stringify({
        senderId,
        recipients,
        subject,
        body,
        startTime: scheduledTime.toISOString(),
        delayMs: Number(delay) * 1000,
        hourlyLimit: Number(limit),
        useEthereal: true, // Always use Ethereal
      }));
      
      // Add file attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      // Send with FormData
      const response = await fetch('http://localhost:4000/api/emails/schedule', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      // Close modal if scheduling for later
      if (!sendNow) {
        setLater(false);
      }
      
      // Redirect based on send type with cache bust
      const redirectTab = sendNow ? 'sent' : 'scheduled';
      const timestamp = Date.now();
      location.assign(`/dashboard?tab=${redirectTab}&t=${timestamp}`);
    } catch (e) {
      console.error('Failed to send email:', e);
      alert(`Failed to send email: ${e instanceof Error ? e.message : 'Please try again'}`);
      setIsSubmitting(false);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <Shell>
      <div className="relative min-h-screen p-6">
        <header className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Link
            href="/dashboard"
            className="text-lg font-medium flex items-center gap-2 hover:text-brand"
          >
            ← Compose New Email
          </Link>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button 
              className="p-2 hover:bg-slate-100 rounded" 
              title="Attachment"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" transform="rotate(-45)">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="p-2 hover:bg-slate-100 rounded" title="Schedule" onClick={() => {
              // Set current LOCAL time when opening modal
              const now = new Date();
              now.setMinutes(now.getMinutes() + 10); // 10 minutes from now
              
              // Format as local datetime-local string (YYYY-MM-DDTHH:mm)
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              
              setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
              setLater(!later);
            }}>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="btn btn-primary py-2 px-5 text-sm font-semibold rounded-md" onClick={() => submit(true)}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </header>

        <div className="mx-auto mt-8 max-w-4xl text-sm">
          {/* From Field - Just show user email */}
          <div className="grid grid-cols-[80px_1fr] items-center border-b border-slate-200 py-3">
            <span className="font-medium">From</span>
            <div className="py-2 text-sm text-slate-700">{user?.email || 'Loading...'}</div>
          </div>

          {/* To Field */}
          <div className="grid grid-cols-[80px_1fr] border-b border-slate-200 py-3">
            <span className="pt-2 font-medium">To</span>
            <div className="flex flex-wrap items-center gap-2">
              {recipients.slice(0, 3).map((v) => (
                <span key={v} className="rounded-full border border-brand bg-emerald-50 px-3 py-1 text-xs font-medium text-brand">
                  {v}
                </span>
              ))}
              {recipients.length > 3 && (
                <span className="rounded-full border border-brand px-2 py-1 text-xs font-medium text-brand">
                  +{recipients.length - 3}
                </span>
              )}
              <input
                className="min-w-60 flex-1 py-2 outline-none text-sm"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add();
                  }
                }}
                onBlur={add}
                placeholder="recipient@example.com"
              />
              <label className="cursor-pointer whitespace-nowrap text-brand font-medium text-sm hover:opacity-80 flex items-center gap-1">
                <span>↥</span>
                <span>Upload List</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Subject Field */}
          <label className="grid grid-cols-[80px_1fr] border-b border-slate-200 py-3">
            <span className="font-medium">Subject</span>
            <input
              className="outline-none text-sm py-2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </label>

          {/* Delay and Limit */}
          <div className="flex items-center gap-6 py-4 text-sm">
            <span className="font-medium">Delay between 2 emails</span>
            <input
              className="w-16 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand focus:ring-opacity-20"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
            />
            <span className="font-medium">Hourly Limit</span>
            <input
              className="w-16 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand focus:ring-opacity-20"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="py-3 border-b border-slate-200">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-slate-700 max-w-40 truncate">{file.name}</span>
                    <span className="text-slate-400 text-xs">({(file.size / 1024).toFixed(1)}KB)</span>
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="ml-1 text-slate-400 hover:text-red-500"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="rounded-lg border border-slate-200 mt-4">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 bg-slate-50">
              <button onClick={() => execCommand('undo')} className="p-1.5 hover:bg-white rounded" title="Undo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button onClick={() => execCommand('redo')} className="p-1.5 hover:bg-white rounded" title="Redo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
              <div className="h-5 w-px bg-slate-300 mx-1" />
              <button onClick={() => execCommand('bold')} className="px-2 py-1 hover:bg-white rounded font-bold text-sm" title="Bold">
                B
              </button>
              <button onClick={() => execCommand('italic')} className="px-2 py-1 hover:bg-white rounded italic text-sm" title="Italic">
                I
              </button>
              <button onClick={() => execCommand('underline')} className="px-2 py-1 hover:bg-white rounded underline text-sm" title="Underline">
                U
              </button>
              <div className="h-5 w-px bg-slate-300 mx-1" />
              <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-white rounded" title="Bullet List">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-white rounded" title="Numbered List">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              onKeyUp={handleEditorInput}
              onPaste={handleEditorInput}
              className="min-h-64 w-full p-4 outline-none text-sm text-slate-700 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
              data-placeholder="Type Your Reply..."
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => window.history.back()}>
              Cancel
            </button>
          </div>
        </div>

        {/* Send Later Modal */}
        {later && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setLater(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-80 p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold mb-4">Send Later</h3>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-500 mb-2">Pick date & time</label>
                <input
                  className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand focus:ring-opacity-20"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2 mb-5">
                <button
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 864e5);
                    const year = tomorrow.getFullYear();
                    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                    const day = String(tomorrow.getDate()).padStart(2, '0');
                    const hours = String(tomorrow.getHours()).padStart(2, '0');
                    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
                    setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                  }}
                >
                  Tomorrow
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 864e5);
                    tomorrow.setHours(10, 0, 0, 0);
                    const year = tomorrow.getFullYear();
                    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                    const day = String(tomorrow.getDate()).padStart(2, '0');
                    setStartTime(`${year}-${month}-${day}T10:00`);
                  }}
                >
                  Tomorrow, 10:00 AM
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 864e5);
                    tomorrow.setHours(11, 0, 0, 0);
                    const year = tomorrow.getFullYear();
                    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                    const day = String(tomorrow.getDate()).padStart(2, '0');
                    setStartTime(`${year}-${month}-${day}T11:00`);
                  }}
                >
                  Tomorrow, 11:00 AM
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 864e5);
                    tomorrow.setHours(15, 0, 0, 0);
                    const year = tomorrow.getFullYear();
                    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                    const day = String(tomorrow.getDate()).padStart(2, '0');
                    setStartTime(`${year}-${month}-${day}T15:00`);
                  }}
                >
                  Tomorrow, 3:00 PM
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setLater(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary py-2 px-5 text-sm font-semibold rounded-md"
                  onClick={() => submit(false)}
                >
                  {isSubmitting ? 'Scheduling...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
