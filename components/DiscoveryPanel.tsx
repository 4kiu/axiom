import React, { useState, useEffect } from 'react';
import { WorkoutEntry, IdentityState, WorkoutPlan } from '../types.ts';
import { SyncMode } from '../App.tsx';
import { GoogleGenAI } from '@google/genai';
import { 
  BrainCircuit, 
  Loader2, 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Cloud, 
  CloudOff, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw,
  Link,
  LogOut,
  AlertTriangle,
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { format } from 'date-fns';

declare var process: {
  env: {
    API_KEY: string;
    GOOGLE_CLIENT_ID: string;
    [key: string]: string | undefined;
  };
};

declare const google: any;

interface DiscoveryPanelProps {
  entries: WorkoutEntry[];
  plans: WorkoutPlan[];
  onUpdateEntries: (entries: WorkoutEntry[]) => void;
  onUpdatePlans: (plans: WorkoutPlan[]) => void;
  externalSyncStatus?: 'idle' | 'syncing' | 'loading' | 'success' | 'error';
  onManualSync?: () => void;
  syncMode?: SyncMode;
  onSetSyncMode?: (mode: SyncMode) => void;
}

const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ 
  entries, 
  plans, 
  onUpdateEntries, 
  onUpdatePlans,
  externalSyncStatus = 'idle',
  onManualSync,
  syncMode = 'off',
  onSetSyncMode
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('axiom_sync_token'));
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('axiom_sync_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [localSyncStatus, setLocalSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [customSyncName, setCustomSyncName] = useState(() => `sync.${format(new Date(), 'ss.mm.HH.dd.MM.yyyy')}`);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && !userInfo) fetchUserInfo(accessToken);
  }, [accessToken, userInfo]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const profile = { name: data.name, email: data.email };
        setUserInfo(profile);
        localStorage.setItem('axiom_sync_profile', JSON.stringify(profile));
      } else if (response.status === 401) handleLogout();
    } catch (e) {
      console.error("Discovery: Profile fetch failure", e);
    }
  };

  const loginWithGoogle = () => {
    setAuthError(null);
    try {
      if (typeof google !== 'undefined' && google.accounts?.oauth2) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId || clientId.includes("placeholder")) {
          setAuthError("Configuration Missing: GOOGLE_CLIENT_ID environment variable is not set.");
          return;
        }

        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (response: any) => {
            if (response.access_token) {
              const token = response.access_token;
              setAccessToken(token);
              localStorage.setItem('axiom_sync_token', token);
              setAuthError(null);
              fetchUserInfo(token);
              window.location.reload(); 
            }
          }
        });
        client.requestAccessToken();
      }
    } catch (e: any) {
      setAuthError(`System Error: ${e.message}`);
    }
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserInfo(null);
    localStorage.removeItem('axiom_sync_token');
    localStorage.removeItem('axiom_sync_profile');
    setAuthError(null);
    window.location.reload();
  };

  const loadLatestSync = async () => {
    if (!accessToken) return loginWithGoogle();
    setLocalSyncStatus('loading');
    try {
      const q_folder = encodeURIComponent("name = 'Axiom' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const listFolder = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q_folder}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const folderData = await listFolder.json();
      const folderId = folderData.files?.[0]?.id;
      if (!folderId) {
        setAuthError("No cloud data found.");
        setLocalSyncStatus('idle');
        return;
      }
      const q = encodeURIComponent(`'${folderId}' in parents and name contains "sync." and trashed = false`);
      const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const listData = await listResponse.json();
      if (listData.files && listData.files.length > 0) {
        const fileId = listData.files[0].id;
        const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const manifest = await fileResponse.json();
        if (manifest.data) {
          onUpdateEntries(manifest.data.entries || []);
          onUpdatePlans(manifest.data.plans || []);
          setLocalSyncStatus('success');
          setTimeout(() => setLocalSyncStatus('idle'), 2000);
        }
      } else {
        setAuthError("No sync manifests found.");
        setLocalSyncStatus('idle');
      }
    } catch (e: any) {
      setAuthError(`Load Failure: ${e.message}`);
      setLocalSyncStatus('error');
    }
  };

  const performDiscovery = async () => {
    if (entries.length < 3) {
      setAnalysis("Insufficient data for pattern discovery. Continue logging sessions.");
      return;
    }
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an elite sports scientist. Analyze these training logs for patterns, fatigue accumulation, and identity state transitions. Provide a concise executive summary. Data: ${JSON.stringify(entries.slice(-15))}`;
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
      setAnalysis(response.text || "No insights found.");
    } catch (error) {
      setAnalysis("Discovery engine failure.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSyncMode = (target: SyncMode) => {
    if (!onSetSyncMode) return;
    onSetSyncMode(syncMode === target ? 'off' : target);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          <BrainCircuit className="text-violet-500" size={28} />
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white">Pattern Discovery</h2>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">AI Analysis Engine</p>
          </div>
        </div>
        <button onClick={performDiscovery} disabled={loading} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all font-bold flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />} Initialize Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 min-h-[400px] shadow-2xl relative overflow-hidden">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full border-t-violet-500 animate-spin" />
                <div className="text-sm font-mono text-neutral-500 animate-pulse">Scanning identity matrices...</div>
              </div>
            ) : analysis ? (
              <div className="prose prose-invert max-w-none">
                <div className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-4">Discovery Results v1.1</div>
                <div className="whitespace-pre-wrap text-neutral-300 leading-relaxed text-sm md:text-base">{analysis}</div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <BarChart3 size={48} className="text-neutral-700" />
                <p className="text-neutral-400">System idle. Patterns requires manual initialization.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Continuity Score
            </h3>
            <div className="text-4xl font-bold text-white mb-2">94%</div>
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden"><div className="w-[94%] h-full bg-emerald-500" /></div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {accessToken ? <Cloud className="text-emerald-500" size={16} /> : <CloudOff className="text-neutral-600" size={16} />} System Sync
                </h3>
                {userInfo && <p className="text-[10px] text-neutral-500 font-mono mt-1">{userInfo.email}</p>}
              </div>
              {accessToken ? <button onClick={handleLogout} className="text-[10px] font-bold text-rose-500 uppercase">Logout</button> : <button onClick={loginWithGoogle} className="text-[10px] font-bold text-emerald-500 uppercase">Link</button>}
            </div>

            {authError && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] rounded font-mono uppercase">{authError}</div>}

            <div className="space-y-2">
              <label className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block">Manifest Trace</label>
              <div className="bg-black/40 border border-neutral-800 rounded-lg p-2 text-[10px] font-mono text-neutral-500 flex items-center gap-2">
                <RefreshCw size={12} className={externalSyncStatus !== 'idle' ? 'animate-spin text-emerald-500' : ''} />
                {customSyncName}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button onClick={onManualSync} disabled={!accessToken} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all">
                  <UploadCloud size={14} /> Sync Now
                </button>
                <button onClick={() => toggleSyncMode('sync')} disabled={!accessToken} className={`px-2 py-2 rounded-lg border transition-all flex items-center gap-1 ${syncMode === 'sync' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                  {syncMode === 'sync' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} <span className="text-[9px] font-bold">AUTO</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={loadLatestSync} disabled={!accessToken} className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all">
                  <DownloadCloud size={14} /> Import Last
                </button>
                <button onClick={() => toggleSyncMode('load')} disabled={!accessToken} className={`px-2 py-2 rounded-lg border transition-all flex items-center gap-1 ${syncMode === 'load' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                  {syncMode === 'load' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} <span className="text-[9px] font-bold">AUTO</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
               <div className="flex items-center gap-2 mb-1">
                 <Zap size={10} className="text-violet-400" />
                 <span className="text-[9px] font-mono font-bold text-violet-400 uppercase">Configuration Protocol</span>
               </div>
               <p className="text-[9px] text-neutral-500 leading-tight">
                 {syncMode === 'sync' ? 'AUTO-SYNC: Commits local state to cloud after every change (mandatory safety pull first).' : syncMode === 'load' ? 'AUTO-LOAD: Pulls cloud state on system initialization.' : 'MANUAL: Cloud interactions restricted to user triggers.'}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPanel;