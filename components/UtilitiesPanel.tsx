
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WorkoutEntry, WorkoutPlan } from '../types.ts';
import { 
  Settings, 
  Cloud, 
  CloudOff, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw,
  Link,
  Zap,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Activity,
  X,
  FileJson,
  ChevronRight
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

interface DriveSyncFile {
  id: string;
  name: string;
  createdTime: string;
}

interface UtilitiesPanelProps {
  entries: WorkoutEntry[];
  plans: WorkoutPlan[];
  onUpdateEntries: (entries: WorkoutEntry[]) => void;
  onUpdatePlans: (plans: WorkoutPlan[]) => void;
  externalSyncStatus?: 'idle' | 'syncing' | 'loading' | 'success' | 'error' | 'importing';
  onManualSync?: () => void;
}

const UtilitiesPanel: React.FC<UtilitiesPanelProps> = ({ 
  entries, 
  plans, 
  onUpdateEntries, 
  onUpdatePlans,
  externalSyncStatus = 'idle',
  onManualSync
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('axiom_sync_token'));
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('axiom_sync_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [localSyncStatus, setLocalSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [customSyncName] = useState(() => `sync.${format(new Date(), 'ss.mm.HH.dd.MM.yyyy')}`);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync Browser state
  const [isSyncBrowserOpen, setIsSyncBrowserOpen] = useState(false);
  const [syncFiles, setSyncFiles] = useState<DriveSyncFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Stopwatch state persisted in localStorage
  const [stopwatch, setStopwatch] = useState(() => {
    const active = localStorage.getItem('axiom_chrono_active') === 'true';
    const startTimeStr = localStorage.getItem('axiom_chrono_start');
    const elapsedStr = localStorage.getItem('axiom_chrono_elapsed');
    
    const startTime = startTimeStr ? parseInt(startTimeStr) : null;
    const elapsed = elapsedStr ? parseInt(elapsedStr) : 0;
    
    let currentElapsed = elapsed;
    if (active && startTime) {
      currentElapsed = Math.floor((Date.now() - startTime) / 1000);
    }
    
    return { active, startTime, elapsed: currentElapsed };
  });

  useEffect(() => {
    // Keep last active timestamp updated
    localStorage.setItem('axiom_last_active_ts', Date.now().toString());

    if (accessToken && !userInfo) fetchUserInfo(accessToken);
  }, [accessToken, userInfo]);

  // Stopwatch effect
  useEffect(() => {
    let interval: number | null = null;
    if (stopwatch.active) {
      interval = window.setInterval(() => {
        setStopwatch(prev => {
          const newElapsed = prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : prev.elapsed;
          return {
            ...prev,
            elapsed: newElapsed
          };
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [stopwatch.active]);

  const startStopwatch = () => {
    const now = Date.now();
    const newStart = now - (stopwatch.elapsed * 1000);
    setStopwatch(prev => ({
      ...prev,
      active: true,
      startTime: newStart
    }));
    localStorage.setItem('axiom_chrono_active', 'true');
    localStorage.setItem('axiom_chrono_start', newStart.toString());
  };

  const pauseStopwatch = () => {
    const currentElapsed = stopwatch.elapsed;
    setStopwatch(prev => ({ 
      ...prev, 
      active: false,
      startTime: null
    }));
    localStorage.setItem('axiom_chrono_active', 'false');
    localStorage.setItem('axiom_chrono_elapsed', currentElapsed.toString());
    localStorage.removeItem('axiom_chrono_start');
  };

  const resetStopwatch = () => {
    setStopwatch({ active: false, startTime: null, elapsed: 0 });
    localStorage.setItem('axiom_chrono_active', 'false');
    localStorage.setItem('axiom_chrono_elapsed', '0');
    localStorage.removeItem('axiom_chrono_start');
  };

  const formatElapsedTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: sec.toString().padStart(2, '0')
    };
  };

  const getRecommendedIdentity = (s: number) => {
    const mins = s / 60;
    if (mins >= 110) return { label: 'OVERDRIVE', color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/5' };
    if (mins >= 70) return { label: 'NORMAL', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' };
    if (mins >= 30) return { label: 'MAINTENANCE', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-emerald-500/5' };
    return { label: 'SURVIVAL', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5' };
  };

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
      } else if (response.status === 401) {
        setAccessToken(null);
        localStorage.removeItem('axiom_sync_token');
      }
    } catch (e) {
      console.error("Utilities: Profile fetch failure", e);
    }
  };

  const loginWithGoogle = () => {
    setAuthError(null);
    localStorage.setItem('axiom_last_active_ts', Date.now().toString());
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

  const fetchSyncFilesList = async () => {
    if (!accessToken) return;
    setLoadingFiles(true);
    setAuthError(null);
    try {
      const q_folder = encodeURIComponent("name = 'Axiom' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const listFolder = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q_folder}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const folderData = await listFolder.json();
      const folderId = folderData.files?.[0]?.id;
      if (!folderId) {
        setAuthError("No Axiom folder found.");
        setLoadingFiles(false);
        return;
      }

      const q_syncs = encodeURIComponent(`name = 'syncs' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const listSyncs = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q_syncs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const syncsData = await listSyncs.json();
      const syncsFolderId = syncsData.files?.[0]?.id;
      if (!syncsFolderId) {
        setAuthError("No 'syncs' folder found.");
        setLoadingFiles(false);
        return;
      }

      const q = encodeURIComponent(`'${syncsFolderId}' in parents and name contains "sync." and trashed = false`);
      const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,createdTime)`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const listData = await listResponse.json();
      setSyncFiles(listData.files || []);
    } catch (e: any) {
      setAuthError(`Failed to fetch sync archive: ${e.message}`);
    } finally {
      setLoadingFiles(false);
    }
  };

  const importSelectedFile = async (fileId: string) => {
    if (!accessToken) return;
    setLocalSyncStatus('loading');
    try {
      const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const manifest = await fileResponse.json();
      if (manifest.data) {
        onUpdateEntries(manifest.data.entries || []);
        onUpdatePlans(manifest.data.plans || []);
        setLocalSyncStatus('success');
        setIsSyncBrowserOpen(false);
        setTimeout(() => setLocalSyncStatus('idle'), 2000);
      }
    } catch (e: any) {
      setAuthError(`Import Failure: ${e.message}`);
      setLocalSyncStatus('error');
    }
  };

  const openSyncBrowser = () => {
    if (!accessToken) {
      loginWithGoogle();
      return;
    }
    setIsSyncBrowserOpen(true);
    fetchSyncFilesList();
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserInfo(null);
    localStorage.removeItem('axiom_sync_token');
    localStorage.removeItem('axiom_sync_profile');
    localStorage.removeItem('axiom_last_active_ts');
    setAuthError(null);
    window.location.reload();
  };

  const loadLatestSync = async () => {
    if (!accessToken) return loginWithGoogle();
    localStorage.setItem('axiom_last_active_ts', Date.now().toString());
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

      const q_syncs = encodeURIComponent(`name = 'syncs' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const listSyncs = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q_syncs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const syncsData = await listSyncs.json();
      const syncsFolderId = syncsData.files?.[0]?.id;
      if (!syncsFolderId) {
        setAuthError("No 'syncs' subfolder found.");
        setLocalSyncStatus('idle');
        return;
      }

      const q = encodeURIComponent(`'${syncsFolderId}' in parents and name contains "sync." and trashed = false`);
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
        setAuthError("No sync manifests found in 'syncs' folder.");
        setLocalSyncStatus('idle');
      }
    } catch (e: any) {
      setAuthError(`Load Failure: ${e.message}`);
      setLocalSyncStatus('error');
    }
  };

  const getSyncDisplayText = () => {
    if (externalSyncStatus === 'importing') return 'IMPORTING...';
    if (externalSyncStatus === 'syncing') return 'SYNCING...';
    return customSyncName;
  };

  const recommendation = getRecommendedIdentity(stopwatch.elapsed);
  const timeObj = formatElapsedTime(stopwatch.elapsed);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 sm:pb-0 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          <Settings className="text-neutral-400" size={28} />
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white leading-none">Utilities</h2>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mt-1">System Configuration & Tools</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Timer className="text-violet-500" size={16} /> Session Chronometer
            </h3>
            {stopwatch.active ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] font-mono text-emerald-500 uppercase font-bold tracking-widest">Tracking</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded-full">
                <span className="relative flex h-1.5 w-1.5 rounded-full bg-neutral-600"></span>
                <span className="text-[8px] font-mono text-neutral-500 uppercase font-bold tracking-widest">Idle</span>
              </div>
            )}
          </div>

          <div className="relative group overflow-hidden bg-black rounded-2xl border border-neutral-800 py-8 flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent opacity-50" />
            
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 items-center opacity-30">
              <div className="w-[1px] h-1 bg-neutral-500" />
              <div className="w-[1px] h-1 bg-neutral-500" />
              <div className="w-[1px] h-2 bg-neutral-400" />
              <div className="w-[1px] h-1 bg-neutral-500" />
              <div className="w-[1px] h-1 bg-neutral-500" />
            </div>

            <div className="flex items-center gap-2 z-10">
              <div className="flex flex-col items-center">
                <div className={`text-5xl font-mono font-black tracking-tighter transition-all duration-300 ${stopwatch.active ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'text-neutral-400'}`}>
                  {timeObj.h}
                </div>
                <div className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest font-bold mt-1">HRS</div>
              </div>
              
              <div className={`text-4xl font-mono font-bold transition-opacity duration-500 ${stopwatch.active ? 'opacity-100 text-violet-500 animate-pulse' : 'opacity-30 text-neutral-600'}`}>:</div>
              
              <div className="flex flex-col items-center">
                <div className={`text-5xl font-mono font-black tracking-tighter transition-all duration-300 ${stopwatch.active ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'text-neutral-400'}`}>
                  {timeObj.m}
                </div>
                <div className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest font-bold mt-1">MIN</div>
              </div>
              
              <div className={`text-4xl font-mono font-bold transition-opacity duration-500 ${stopwatch.active ? 'opacity-100 text-violet-500 animate-pulse' : 'opacity-30 text-neutral-600'}`}>:</div>
              
              <div className="flex flex-col items-center">
                <div className={`text-5xl font-mono font-black tracking-tighter transition-all duration-300 ${stopwatch.active ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'text-neutral-400'}`}>
                  {timeObj.s}
                </div>
                <div className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest font-bold mt-1">SEC</div>
              </div>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 items-center opacity-30">
              <div className="w-[1px] h-1 bg-neutral-500" />
              <div className="w-[1px] h-1 bg-neutral-500" />
              <div className="w-[1px] h-2 bg-neutral-400" />
              <div className="w-[1px] h-1 bg-neutral-500" />
              <div className="w-[1px] h-1 bg-neutral-500" />
            </div>

            {stopwatch.startTime && (
              <div className="absolute top-2 right-4 text-[7px] font-mono text-neutral-700 uppercase tracking-widest">
                Trace_Sync.init
              </div>
            )}
            <div className="absolute bottom-2 left-4 text-[7px] font-mono text-neutral-700 uppercase tracking-widest">
              Axiom_Core.chrono
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!stopwatch.active ? (
              <button 
                onClick={startStopwatch} 
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-500/10"
              >
                <Play size={14} fill="currentColor" /> Activate
              </button>
            ) : (
              <button 
                onClick={pauseStopwatch} 
                className="py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all uppercase tracking-widest active:scale-95 shadow-lg shadow-amber-500/10"
              >
                <Pause size={14} fill="currentColor" /> Suspend
              </button>
            )}
            <button 
              onClick={resetStopwatch} 
              className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all uppercase tracking-widest active:scale-95"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {stopwatch.elapsed > 0 && (
            <div className={`p-4 rounded-xl border animate-in slide-in-from-top-1 fade-in duration-300 transition-all ${recommendation.border} ${recommendation.bg}`}>
               <div className="flex items-center gap-2 mb-2">
                 <Activity size={12} className={recommendation.color} />
                 <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${recommendation.color}`}>Recommended Identity Mapping</span>
               </div>
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-lg font-bold text-white leading-tight">{recommendation.label}</p>
                   <p className="text-[9px] text-neutral-500 font-mono uppercase mt-0.5">Based on temporal occupancy</p>
                 </div>
                 <div className="text-[10px] font-mono text-neutral-600 uppercase">
                    v{timeObj.h}.{timeObj.m}
                 </div>
               </div>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {accessToken ? <Cloud className="text-emerald-500" size={16} /> : <CloudOff className="text-neutral-600" size={16} />} System Sync
              </h3>
              {userInfo && <p className="text-[10px] text-neutral-300 font-mono mt-1 font-bold uppercase tracking-tight">{userInfo.name}</p>}
            </div>
            {accessToken ? (
              <button 
                onClick={handleLogout} 
                className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[9px] font-bold rounded-lg hover:bg-rose-500/20 transition-all uppercase"
              >
                Logout
              </button>
            ) : (
              <button 
                onClick={loginWithGoogle} 
                className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold rounded-lg hover:bg-emerald-500/20 transition-all uppercase flex items-center gap-2"
              >
                <Link size={12} />
                Link Account
              </button>
            )}
          </div>

          {authError && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] rounded font-mono uppercase">{authError}</div>}

          <div className="space-y-2">
            <label className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block">Manifest Trace</label>
            <button 
              onClick={openSyncBrowser}
              className={`w-full text-left bg-black/40 border rounded-lg p-3 text-[10px] font-mono flex items-center gap-2 transition-all hover:bg-black/60 hover:border-neutral-700 ${externalSyncStatus === 'importing' || externalSyncStatus === 'syncing' ? 'border-emerald-500/50 text-emerald-400' : 'border-neutral-800 text-neutral-500'}`}
            >
              <RefreshCw size={12} className={externalSyncStatus !== 'idle' && externalSyncStatus !== 'success' && externalSyncStatus !== 'error' ? 'animate-spin text-emerald-500' : ''} />
              <span className="truncate font-bold tracking-tight">{getSyncDisplayText()}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onManualSync} disabled={!accessToken} className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all uppercase tracking-tight">
              <UploadCloud size={14} /> Sync
            </button>
            <button onClick={loadLatestSync} disabled={!accessToken} className="py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all uppercase tracking-tight">
              <DownloadCloud size={14} /> Import
            </button>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
             <div className="flex items-center gap-2 mb-1.5">
               <Zap size={10} className="text-violet-400" />
               <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest">Auto-Pulse Active</span>
             </div>
             <p className="text-[9px] text-neutral-500 leading-relaxed font-mono uppercase">
               Sync status: <span className="text-emerald-500">NOMINAL</span>. Automatic parity active for all blueprints and identity logs.
             </p>
          </div>
        </div>
      </div>

      {/* Sync Browser Modal */}
      {isSyncBrowserOpen && createPortal(
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsSyncBrowserOpen(false)} />
          <div className="relative bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <FileJson size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Sync Archives</h3>
              </div>
              <button onClick={() => setIsSyncBrowserOpen(false)} className="p-2 text-neutral-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {loadingFiles ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                  <RefreshCw className="animate-spin text-emerald-500" size={32} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">Indexing /Axiom/syncs...</span>
                </div>
              ) : syncFiles.length > 0 ? (
                syncFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => importSelectedFile(file.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-neutral-800 transition-all text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono text-neutral-300 font-bold group-hover:text-emerald-400 transition-colors">{file.name}</span>
                      <span className="text-[9px] font-mono text-neutral-600 uppercase mt-0.5">{format(new Date(file.createdTime), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </div>
                    <ChevronRight size={14} className="text-neutral-700 group-hover:text-white transition-colors" />
                  </button>
                ))
              ) : (
                <div className="py-20 text-center opacity-30">
                  <span className="text-[10px] font-mono uppercase tracking-widest">No sync manifests found</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950/50">
              <p className="text-[9px] font-mono text-neutral-600 uppercase text-center leading-relaxed">
                Select a manifest to roll back the system state. <br/>
                Warning: This replaces all current local training data.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UtilitiesPanel;
