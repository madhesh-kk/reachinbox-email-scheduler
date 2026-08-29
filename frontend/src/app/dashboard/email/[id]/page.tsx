'use client'; import Link from 'next/link'; import { useParams } from 'next/navigation'; import { useQuery } from '@tanstack/react-query'; import { request } from '../../../../lib/api'; import { EmailJob } from '../../../../lib/types'; import { Shell } from '../../../../components/shell';

interface Attachment {
  filename: string;
  content: string;
  contentType: string;
}

export default function Detail(){
  const {id}=useParams<{id:string}>();
  const {data}=useQuery({queryKey:['email',id],queryFn:()=>request<EmailJob>(`/api/emails/${id}`)});
  
  if(!data)return <Shell><div className="p-8 text-base">Loading…</div></Shell>;
  
  // Parse attachments if they exist
  let attachments: Attachment[] = [];
  if (data.attachments) {
    try {
      attachments = JSON.parse(data.attachments);
    } catch (e) {
      console.error('Failed to parse attachments:', e);
    }
  }
  
  const downloadAttachment = (att: Attachment) => {
    // Convert base64 to blob and download
    const byteCharacters = atob(att.content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: att.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return <Shell><div className="p-8"><Link href="/dashboard" className="text-base text-brand font-medium hover:opacity-80 inline-flex items-center gap-1">← Back to inbox</Link><article className="card mt-6 max-w-4xl p-8"><h1 className="text-2xl font-bold text-slate-900">{data.subject}</h1><div className="mt-6 flex items-center gap-4 border-b border-slate-200 pb-6"><div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-brand text-lg font-semibold">{data.sender.fromEmail[0].toUpperCase()}</div><div><div className="font-semibold text-base">{data.sender.fromEmail}</div><div className="text-sm text-slate-500 mt-1">to {data.toEmail} · {new Date(data.sentAt??data.scheduledAt).toLocaleString()}</div></div></div>
  
  {/* Attachments Section */}
  {attachments.length > 0 && (
    <div className="mt-6 border-b border-slate-200 pb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{attachments.length} Attachment{attachments.length > 1 ? 's' : ''}</h3>
      <div className="flex flex-wrap gap-3">
        {attachments.map((att, index) => (
          <button
            key={index}
            onClick={() => downloadAttachment(att)}
            className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-700">{att.filename}</div>
              <div className="text-xs text-slate-500">{att.contentType}</div>
            </div>
            <svg className="w-4 h-4 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )}
  
  <div className="prose prose-slate mt-8 max-w-none text-base leading-relaxed" dangerouslySetInnerHTML={{__html:data.body}}/></article></div></Shell>
}
