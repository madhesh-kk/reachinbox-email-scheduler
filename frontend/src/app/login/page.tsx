'use client';
import { useState } from 'react';
import { api } from '../../lib/api'; 

export default function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${api}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Login failed');
                setIsLoading(false);
                return;
            }
            
            // Login successful, redirect to dashboard
            window.location.href = '/dashboard';
        } catch (err) {
            setError('Network error. Please try again.');
            setIsLoading(false);
        }
    };
    
    return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-50 to-white p-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-slate-900">Login</h1>
            </div>
            
            <button 
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-teal-100" 
                onClick={()=>location.assign(`${api}/auth/google`)}
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Login with Google
            </button>
            
            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-300"/>
                <span className="text-xs text-slate-400">or sign up through email</span>
                <div className="h-px flex-1 bg-slate-300"/>
            </div>
            
            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}
            
            <div className="space-y-5">
                <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 focus:ring-opacity-20" 
                    placeholder="Email ID"
                />
                
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 focus:ring-opacity-20" 
                    placeholder="Password"
                />
                
                <button 
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-green-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </div>
        </div>
    </main>
    );
}
