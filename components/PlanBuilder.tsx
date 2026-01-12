
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WorkoutPlan, Exercise } from '../types';
import ConfirmationModal from './ConfirmationModal.tsx';
import { 
  Plus, 
  Trash2, 
  ImageIcon,
  Dumbbell,
  Edit2,
  Check,
  X,
  FileText,
  BookOpen,
  ChevronDown,
  Activity,
  ArrowLeft,
  Link,
  Upload,
  Image as ImageControlIcon,
  Search,
  Library,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Custom SVG Icons for Muscle Groups
export const MuscleIcon: React.FC<{ type: string, className?: string }> = ({ type, className = "w-5 h-5" }) => {
  const icons: Record<string, React.ReactNode> = {
    'Chest': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M6 12C6 12 8 8 12 8C16 8 18 12 18 12" />
        <path d="M6 15C6 15 8 11 12 11C16 11 18 15 18 15" />
        <path d="M12 8V21" strokeOpacity="0.3" />
      </svg>
    ),
    'Back': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M12 4L4 8V16L12 20L20 16V8L12 4Z" />
        <path d="M12 4V20" strokeOpacity="0.3" />
        <path d="M4 8L20 16" strokeOpacity="0.3" />
        <path d="M20 8L4 16" strokeOpacity="0.3" />
      </svg>
    ),
    'Shoulders': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="6" cy="10" r="3" />
        <circle cx="18" cy="10" r="3" />
        <path d="M9 10H15" strokeOpacity="0.3" />
      </svg>
    ),
    'Biceps': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M5 15C5 15 6 10 10 10C14 10 15 15 15 15" />
        <path d="M10 10V18" strokeOpacity="0.3" />
        <rect x="15" y="13" width="4" height="4" rx="1" />
      </svg>
    ),
    'Triceps': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M19 15C19 15 18 10 14 10C10 10 9 15 9 15" />
        <rect x="5" y="13" width="4" height="4" rx="1" />
      </svg>
    ),
    'Forearms': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M8 6V18M16 6V18" strokeOpacity="0.3" />
        <rect x="6" y="8" width="12" height="8" rx="2" />
        <path d="M10 12H14" />
      </svg>
    ),
    'Abs': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="7" y="5" width="4" height="4" rx="1" />
        <rect x="13" y="5" width="4" height="4" rx="1" />
        <rect x="7" y="10" width="4" height="4" rx="1" />
        <rect x="13" y="10" width="4" height="4" rx="1" />
        <rect x="7" y="15" width="4" height="4" rx="1" />
        <rect x="13" y="15" width="4" height="4" rx="1" />
      </svg>
    ),
    'Glutes': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M7 12C7 15.3137 9.68629 18 13 18C16.3137 18 19 15.3137 19 12" />
        <path d="M5 12C5 15.3137 7.68629 18 11 18C14.3137 18 17 15.3137 17 12" strokeOpacity="0.4" />
      </svg>
    ),
    'Quads': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M8 4L6 20M16 4L18 20" />
        <path d="M9 7H15M9 12H15M9 17H15" strokeOpacity="0.3" />
      </svg>
    ),
    'Hamstrings': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M8 4L10 20M16 4L14 20" />
        <path d="M10 8H14M10 13H14M10 18H14" strokeOpacity="0.3" />
      </svg>
    ),
    'Calves': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M9 4V20M15 4V20" strokeOpacity="0.2" />
        <path d="M7 10C7 10 8 16 12 16C16 16 17 10 17 10" />
      </svg>
    ),
    'Neck': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M8 8C8 8 9 14 12 14C15 14 16 8 16 8" />
        <path d="M12 4V14" strokeOpacity="0.3" />
      </svg>
    ),
  };

  return icons[type] || <Dumbbell className={className} />;
};

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 
  'Forearms', 'Abs', 'Glutes', 'Quads', 'Hamstrings', 
  'Calves', 'Neck'
];

interface DriveImage {
  id: string;
  name: string;
  thumbnailLink?: string;
}

interface PlanBuilderProps {
  plans: WorkoutPlan[];
  onUpdatePlans: (plans: WorkoutPlan[]) => void;
  onLogPlan?: (planId: string) => void;
  onBack?: () => void;
  // External navigation props from App.tsx
  externalIsEditing?: boolean;
  externalEditingPlanId?: string | null;
  onOpenEditor?: (planId: string | null) => void;
  onCloseEditor?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  accessToken?: string | null;
}

const PlanBuilder: React.FC<PlanBuilderProps> = ({ 
  plans, 
  onUpdatePlans, 
  onLogPlan,
  onBack,
  externalIsEditing,
  externalEditingPlanId,
  onOpenEditor,
  onCloseEditor,
  onDirtyChange,
  accessToken
}) => {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activePicker, setActivePicker] = useState<string | null>(null); // Exercise ID
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);
  const [exerciseToDeleteId, setExerciseToDeleteId] = useState<string | null>(null);
  const [viewingImageExId, setViewingImageExId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState<DriveImage[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tempPlan, setTempPlan] = useState<Partial<WorkoutPlan>>({
    name: '',
    description: '',
    exercises: []
  });

  const initialPlanRef = useRef<string | null>(null);

  // Intermediate input state to handle typing decimals naturally
  const [inputStates, setInputStates] = useState<Record<string, string>>({});

  // Synchronize internal state with external navigation state for back-gesture support
  useEffect(() => {
    if (externalIsEditing !== undefined) {
      if (!externalIsEditing) {
        setIsCreating(false);
        setEditingPlanId(null);
        setInputStates({});
        initialPlanRef.current = null;
      } else {
        // If external says editing but internal doesn't have plan yet, populate it
        if (externalEditingPlanId && editingPlanId !== externalEditingPlanId) {
          const plan = plans.find(p => p.id === externalEditingPlanId);
          if (plan) {
            setTempPlan(plan);
            setEditingPlanId(externalEditingPlanId);
            initialPlanRef.current = JSON.stringify(plan);
          }
        } else if (!externalEditingPlanId && !isCreating) {
           // External says creating
           const newPlan = {
             id: crypto.randomUUID(),
             name: 'New Blueprint',
             description: '',
             exercises: [],
             createdAt: Date.now()
           };
           setTempPlan(newPlan);
           setIsCreating(true);
           initialPlanRef.current = JSON.stringify(newPlan);
        }
      }
    }
  }, [externalIsEditing, externalEditingPlanId, plans]);

  // Derive local dirty state for UI feedback (Save vs Saved)
  const isDirty = (isCreating || editingPlanId !== null) && 
                  initialPlanRef.current !== null && 
                  JSON.stringify(tempPlan) !== initialPlanRef.current;

  // Track dirty state for parent
  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  const startNewPlan = () => {
    if (onOpenEditor) {
      onOpenEditor(null);
    } else {
      const newPlan = {
        id: crypto.randomUUID(),
        name: 'New Blueprint',
        description: '',
        exercises: [],
        createdAt: Date.now()
      };
      setTempPlan(newPlan);
      setIsCreating(true);
      initialPlanRef.current = JSON.stringify(newPlan);
    }
  };

  const savePlan = () => {
    if (!tempPlan.name) return;
    const finalPlan = tempPlan as WorkoutPlan;
    const exists = plans.find(p => p.id === finalPlan.id);
    
    if (exists) {
      onUpdatePlans(plans.map(p => p.id === finalPlan.id ? finalPlan : p));
    } else {
      onUpdatePlans([...plans, finalPlan]);
    }
    
    initialPlanRef.current = JSON.stringify(tempPlan);
    onDirtyChange?.(false);
    setTempPlan({ ...tempPlan });
  };

  const deletePlan = (id: string) => {
    setPlanToDeleteId(id);
  };

  const confirmDeletePlan = () => {
    if (planToDeleteId) {
      onUpdatePlans(plans.filter(p => p.id !== planToDeleteId));
      setPlanToDeleteId(null);
    }
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: 'New Exercise',
      muscleType: 'Chest',
      sets: 0,
      reps: '',
      weight: 0,
      notes: ''
    };
    setTempPlan(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), newExercise]
    }));
  };

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setTempPlan(prev => ({
      ...prev,
      exercises: prev.exercises?.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
    }));
  };

  const toggleSuperset = (exerciseId: string) => {
    const exercises = tempPlan.exercises || [];
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    let updatedExercises = [...exercises];
    
    if (exercise.supersetId) {
      updatedExercises = updatedExercises.map(ex => 
        ex.id === exerciseId ? { ...ex, supersetId: undefined } : ex
      );
    } else {
      const supersetCounts: Record<number, number> = {};
      updatedExercises.forEach(ex => {
        if (ex.supersetId) {
          supersetCounts[ex.supersetId] = (supersetCounts[ex.supersetId] || 0) + 1;
        }
      });

      let targetSupersetId = Object.keys(supersetCounts).find(id => supersetCounts[Number(id)] === 1);

      if (targetSupersetId) {
        updatedExercises = updatedExercises.map(ex => 
          ex.id === exerciseId ? { ...ex, supersetId: Number(targetSupersetId) } : ex
        );

        const sId = Number(targetSupersetId);
        const members = updatedExercises.filter(ex => ex.supersetId === sId);
        if (members.length === 2) {
          const idx1 = updatedExercises.findIndex(ex => ex.id === members[0].id);
          const idx2 = updatedExercises.findIndex(ex => ex.id === members[1].id);
          const topIdx = Math.min(idx1, idx2);
          const bottomIdx = Math.max(idx1, idx2);
          
          if (bottomIdx !== topIdx + 1) {
            const bottomEx = updatedExercises[bottomIdx];
            const filtered = updatedExercises.filter((_, idx) => idx !== bottomIdx);
            filtered.splice(topIdx + 1, 0, bottomEx);
            updatedExercises = filtered;
          }
        }
      } else {
        const nextId = Math.max(0, ...Object.keys(supersetCounts).map(Number)) + 1;
        updatedExercises = updatedExercises.map(ex => 
          ex.id === exerciseId ? { ...ex, supersetId: nextId } : ex
        );
      }
    }

    setTempPlan(prev => ({ ...prev, exercises: updatedExercises }));
  };

  const updateNumericField = (exerciseId: string, field: keyof Exercise, val: string) => {
    const filtered = val.replace(/[^0-9.]/g, '');
    const dotCount = (filtered.match(/\./g) || []).length;
    if (dotCount > 1) return;

    const stateKey = `${exerciseId}-${field}`;
    setInputStates(prev => ({ ...prev, [stateKey]: filtered }));

    if (field === 'reps') {
      updateExercise(exerciseId, { reps: filtered });
    } else {
      const parsed = parseFloat(filtered);
      if (!isNaN(parsed)) {
        updateExercise(exerciseId, { [field]: parsed });
      } else if (filtered === '') {
        updateExercise(exerciseId, { [field]: 0 });
      }
    }
  };

  const removeExercise = (exerciseId: string) => {
    setTempPlan(prev => ({
      ...prev,
      exercises: prev.exercises?.filter(ex => ex.id !== exerciseId)
    }));
  };

  // Helper for Google Drive folder management
  const findOrCreateFolder = async (folderName: string, parentId?: string): Promise<string> => {
    if (!accessToken) throw new Error('Unauthorized');
    const q = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ''}`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (data.files && data.files.length > 0) return data.files[0].id;

    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
      })
    });
    const createData = await createResponse.json();
    return createData.id;
  };

  const uploadToDrive = async (file: File, folderId: string): Promise<string> => {
    if (!accessToken) throw new Error('Unauthorized');
    const metadata = { name: file.name, parents: [folderId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,thumbnailLink,webContentLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    });
    const data = await response.json();
    return `https://www.googleapis.com/drive/v3/files/${data.id}?alt=media`;
  };

  const handleImageUpload = async (exerciseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!accessToken) {
      // Offline fallback: use local base64 but warning that it won't be in Drive
      const reader = new FileReader();
      reader.onloadend = () => {
        updateExercise(exerciseId, { image: reader.result as string });
        setViewingImageExId(null);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setLoadingLibrary(true);
      const axiomId = await findOrCreateFolder('Axiom');
      const modulesId = await findOrCreateFolder('modules', axiomId);
      const uploadsId = await findOrCreateFolder('uploads', modulesId);
      const url = await uploadToDrive(file, uploadsId);
      updateExercise(exerciseId, { image: url });
      setViewingImageExId(null);
    } catch (err) {
      console.error('Drive Upload Failed:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const fetchLibraryImages = async () => {
    if (!accessToken) return;
    setLoadingLibrary(true);
    try {
      const axiomId = await findOrCreateFolder('Axiom');
      const libraryId = await findOrCreateFolder('library', axiomId);
      // Removed mimeType filtering to allow manually uploaded images with potentially generic mime types to be indexed
      const q = encodeURIComponent(`'${libraryId}' in parents and trashed = false`);
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,thumbnailLink,mimeType)&pageSize=100`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await response.json();
      // Filter images based on name extension or generic image mimeType
      const images = (data.files || []).filter((f: any) => 
        f.mimeType?.includes('image/') || 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
      );
      setLibraryImages(images);
    } catch (err) {
      console.error('Library fetch failed:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const currentViewingEx = tempPlan.exercises?.find(ex => ex.id === viewingImageExId);

  const filteredLibrary = libraryImages.filter(img => 
    img.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  if (isCreating || editingPlanId) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div className="flex-1 max-w-xl flex items-center gap-4">
            <button 
              onClick={() => { 
                if (onCloseEditor) onCloseEditor(); 
                else { setIsCreating(false); setEditingPlanId(null); setInputStates({}); initialPlanRef.current = null; } 
              }} 
              className="p-2 -ml-2 text-neutral-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="shrink-0">
               <BookOpen className="text-neutral-500" size={28} />
            </div>
            <div className="flex flex-col flex-1">
              <input 
                type="text"
                value={tempPlan.name}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setTempPlan({ ...tempPlan, name: e.target.value })}
                className="bg-transparent border-none text-2xl font-bold text-white focus:ring-0 w-full placeholder-neutral-700 p-0 leading-tight"
                placeholder="Blueprint Name..."
              />
              <input 
                type="text"
                value={tempPlan.description}
                onChange={(e) => setTempPlan({ ...tempPlan, description: e.target.value })}
                className="bg-transparent border-none text-[10px] sm:text-xs text-neutral-500 font-mono focus:ring-0 p-0 uppercase tracking-wider mt-1"
                placeholder="System objective"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={savePlan} 
              disabled={!isDirty || !tempPlan.name}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 ${!isDirty ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              <Check size={18} />
              {isDirty ? 'Save' : 'Saved'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {tempPlan.exercises?.map((ex, index) => (
            <div key={ex.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col group relative">
              
              {activePicker === ex.id && (
                <div className="absolute inset-0 z-50 bg-neutral-950/95 backdrop-blur-md p-3 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Select Target Muscle</span>
                    <button onClick={() => setActivePicker(null)} className="p-1 text-neutral-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto pr-1">
                    {MUSCLE_GROUPS.map(group => (
                      <button
                        key={group}
                        onClick={() => {
                          updateExercise(ex.id, { muscleType: group });
                          setActivePicker(null);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all
                          ${ex.muscleType === group ? 'bg-neutral-100 border-neutral-100 text-black' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                        `}
                      >
                        <MuscleIcon type={group} className="w-5 h-5" />
                        <span className="text-[8px] font-bold uppercase">{group}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Control Row */}
              <div className="flex flex-row p-3 gap-3 items-stretch">
                {/* Left: Responsive Image Section (Spans Title to Sets field) */}
                <div className="w-32 sm:w-44 shrink-0 flex flex-col">
                  <div 
                    onClick={() => setViewingImageExId(ex.id)}
                    className="relative w-full h-full sm:h-auto sm:aspect-square bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-neutral-700 transition-all group/img"
                  >
                    {ex.image ? (
                      <img 
                        src={ex.image.startsWith('http') && accessToken ? `${ex.image}&access_token=${accessToken}` : ex.image} 
                        alt={ex.name} 
                        className="w-full h-full object-cover opacity-60 group-hover/img:opacity-80 transition-opacity" 
                        onError={(e) => {
                          // If private link failed, show placeholder
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 opacity-20 group-hover/img:opacity-40 transition-opacity w-full h-full">
                        <MuscleIcon type={ex.muscleType} className="w-8 h-8 sm:w-12 sm:h-12" />
                        <span className="text-[8px] font-mono">NO IMAGE</span>
                      </div>
                    )}
                    
                    <div className="absolute top-1.5 left-1.5 bg-black/40 px-1 py-0.5 rounded text-[8px] font-mono text-neutral-500 border border-neutral-800/50">
                      EX-{index + 1}
                    </div>
                  </div>
                </div>

                {/* Right: Primary Controls */}
                <div className="flex-1 flex flex-col min-w-0 justify-between gap-2">
                  <div className="flex items-center">
                    <input 
                      type="text"
                      value={ex.name}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                      className="bg-transparent border-none p-0 text-sm font-bold text-white w-full focus:ring-0 truncate"
                      placeholder="Exercise Title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="space-y-0.5 flex flex-col">
                      <span className="text-[8px] font-mono text-neutral-600 uppercase block truncate">Muscle</span>
                      <button 
                        onClick={() => setActivePicker(ex.id)}
                        className="flex items-center justify-center bg-neutral-950 border border-neutral-800 rounded-lg h-full min-h-[36px] px-1 text-[10px] w-full hover:border-neutral-600 transition-all active:scale-95 group/btn"
                      >
                        <span className="truncate">{ex.muscleType}</span>
                      </button>
                    </div>

                    <div className="space-y-0.5 flex flex-col">
                      <span className="text-[8px] font-mono text-neutral-600 uppercase block truncate">KG</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={inputStates[`${ex.id}-weight`] ?? (ex.weight === 0 ? '' : ex.weight.toString())}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateNumericField(ex.id, 'weight', e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg h-full min-h-[36px] px-1 text-[10px] w-full focus:border-neutral-600 outline-none text-center transition-all"
                      />
                    </div>

                    <div className="space-y-0.5 flex flex-col">
                      <span className="text-[8px] font-mono text-neutral-600 uppercase block truncate">Sets</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={inputStates[`${ex.id}-sets`] ?? (ex.sets === 0 ? '' : ex.sets.toString())}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateNumericField(ex.id, 'sets', e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg h-full min-h-[36px] px-1 text-[10px] w-full focus:border-neutral-600 outline-none text-center transition-all"
                      />
                    </div>

                    <div className="space-y-0.5 flex flex-col">
                      <span className="text-[8px] font-mono text-neutral-600 uppercase block truncate">Reps</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={inputStates[`${ex.id}-reps`] ?? ex.reps}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateNumericField(ex.id, 'reps', e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg h-full min-h-[36px] px-1 text-[10px] w-full focus:border-neutral-600 outline-none text-center transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Area - Standardized spacing matched with internal grid gaps */}
              <div className="px-3 pb-3 space-y-2">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono text-neutral-700 uppercase">Notes</span>
                  <textarea 
                    value={ex.notes}
                    onChange={(e) => updateExercise(ex.id, { notes: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-[10px] w-full focus:border-neutral-700 outline-none min-h-[44px] max-h-[80px] leading-snug"
                    placeholder="Tempo, cues..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-neutral-800/50 flex justify-end gap-2 items-center bg-black/10">
                <button 
                  onClick={() => toggleSuperset(ex.id)} 
                  className={`p-1 rounded-md border flex items-center gap-1 transition-all ${ex.supersetId ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
                >
                  <Link size={12} />
                  {ex.supersetId && <span className="text-[9px] font-bold">{ex.supersetId}</span>}
                </button>
                <button onClick={() => setExerciseToDeleteId(ex.id)} className="text-neutral-600 hover:text-rose-500 transition-colors p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addExercise}
            className="border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center p-4 hover:bg-neutral-900/50 hover:border-neutral-700 transition-all group min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center mb-3 border border-neutral-800 group-hover:scale-110 transition-transform">
              <Plus className="text-neutral-500" />
            </div>
            <span className="text-[11px] font-mono text-neutral-600 uppercase">Append Module</span>
          </button>
        </div>

        {/* Image Management Popup - Refactored to match ConfirmationModal style */}
        {viewingImageExId && createPortal(
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" 
              onClick={() => { setViewingImageExId(null); setIsLibraryOpen(false); }} 
            />
            <div className={`relative bg-[#1a1a1a] border border-neutral-800 w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isLibraryOpen ? 'max-w-2xl' : 'max-w-sm'}`}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      <ImageControlIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">{isLibraryOpen ? 'Library Explorer' : 'Visual Asset'}</h2>
                      <div className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mt-0.5">{isLibraryOpen ? 'root/library/' : 'Media Component Active'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLibraryOpen && (
                      <button onClick={fetchLibraryImages} className="p-2 text-neutral-500 hover:text-white transition-colors" title="Refresh Library">
                        <RefreshCw size={18} className={loadingLibrary ? 'animate-spin' : ''} />
                      </button>
                    )}
                    <button onClick={() => { setViewingImageExId(null); setIsLibraryOpen(false); }} className="p-2 text-neutral-500 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {!isLibraryOpen ? (
                  <>
                    <div className="w-full aspect-square bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center">
                      {currentViewingEx?.image ? (
                        <img 
                          src={currentViewingEx.image.startsWith('http') && accessToken ? `${currentViewingEx.image}&access_token=${accessToken}` : currentViewingEx.image} 
                          alt="Exercise Reference" 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <ImageIcon size={48} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">No Asset Loaded</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-neutral-100 hover:bg-white text-black font-bold rounded-xl transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                      >
                        <Upload size={16} />
                        {currentViewingEx?.image ? 'Replace Asset' : 'Upload Asset'}
                      </button>

                      <button 
                        onClick={() => { setIsLibraryOpen(true); fetchLibraryImages(); }}
                        className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold rounded-xl transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                      >
                        <Library size={16} />
                        Choose from library
                      </button>
                      
                      {currentViewingEx?.image && (
                        <button 
                          onClick={() => {
                            if (viewingImageExId) {
                              updateExercise(viewingImageExId, { image: undefined });
                              setViewingImageExId(null);
                            }
                          }}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          Purge Asset
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                      <input 
                        type="text"
                        placeholder="Search library assets..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-200 focus:border-neutral-700 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {loadingLibrary ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                          <Loader2 className="animate-spin text-emerald-500" size={32} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">Indexing Drive...</span>
                        </div>
                      ) : filteredLibrary.length > 0 ? (
                        filteredLibrary.map(img => (
                          <button
                            key={img.id}
                            onClick={() => {
                              if (viewingImageExId) {
                                updateExercise(viewingImageExId, { image: `https://www.googleapis.com/drive/v3/files/${img.id}?alt=media` });
                                setIsLibraryOpen(false);
                                setViewingImageExId(null);
                              }
                            }}
                            className="group/item relative aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden hover:border-emerald-500 transition-all"
                          >
                            {img.thumbnailLink ? (
                              <img src={img.thumbnailLink} alt={img.name} className="w-full h-full object-cover opacity-60 group-hover/item:opacity-100 transition-opacity" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full opacity-20"><ImageIcon size={24} /></div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-[7px] font-mono text-white truncate">{img.name}</div>
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center opacity-30">
                          <span className="text-[10px] font-mono uppercase tracking-widest">No matching assets found</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => viewingImageExId && handleImageUpload(viewingImageExId, e)} 
              />
            </div>
          </div>,
          document.body
        )}

        <ConfirmationModal 
          isOpen={!!exerciseToDeleteId}
          title="Dismantle Module"
          message="Are you sure you want to purge this exercise module from the blueprint? The specific load, set, and rep patterns will be lost."
          confirmLabel="Purge Module"
          onConfirm={() => {
            if (exerciseToDeleteId) {
              removeExercise(exerciseToDeleteId);
              setExerciseToDeleteId(null);
            }
          }}
          onCancel={() => setExerciseToDeleteId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
             <BookOpen className="text-neutral-500" size={28} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white leading-none">Blueprints</h2>
            <p className="text-[10px] sm:text-xs text-neutral-500 font-mono uppercase tracking-wider mt-1">Modular training profile creation</p>
          </div>
        </div>
        <button 
          onClick={startNewPlan}
          className="bg-neutral-100 hover:bg-white text-black px-2 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Blueprint</span>
        </button>
      </div>

      <ConfirmationModal 
        isOpen={!!planToDeleteId}
        title="Dismantle Blueprint"
        message="You are about to permanently delete this training blueprint and all its associated modular data. This action cannot be reversed."
        confirmLabel="Confirm Deletion"
        onConfirm={confirmDeletePlan}
        onCancel={() => setPlanToDeleteId(null)}
      />

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
          <Dumbbell size={48} className="text-neutral-700" />
          <div className="max-w-xs">
            <p className="text-sm">No training blueprints found in local storage.</p>
            <p className="text-[10px] font-mono mt-2 uppercase">Create a profile to begin pattern mapping</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan: WorkoutPlan) => (
            <div 
              key={plan.id} 
              onClick={() => { if (onOpenEditor) onOpenEditor(plan.id); else { setEditingPlanId(plan.id); setTempPlan(plan); } }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group hover:border-neutral-700 transition-all shadow-xl cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{plan.name}</h3>
                    <p className="text-xs text-neutral-500 font-mono mt-1">{plan.exercises.length} Active Modules</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onLogPlan?.(plan.id); }}
                      title="Log this blueprint today"
                      className="p-2 bg-emerald-950/40 hover:bg-emerald-900/60 rounded-lg text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all"
                    >
                      <Activity size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                      className="p-2 bg-neutral-800 hover:bg-rose-900/30 rounded-lg text-neutral-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                   {plan.description && (
                     <div className="flex gap-2 items-start opacity-70">
                       <FileText size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-neutral-400 line-clamp-2">{plan.description}</p>
                     </div>
                   )}

                   <div className="flex flex-wrap gap-2">
                     {Array.from(new Set(plan.exercises.map(ex => ex.muscleType))).map((muscle: string) => (
                       <span key={muscle} className="px-2 py-1 rounded bg-black/40 border border-neutral-800 text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-2">
                         <MuscleIcon type={muscle} className="w-3.5 h-3.5" />
                         {muscle}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-black/20 border-t border-neutral-800 flex justify-between items-center">
                 <div className="flex -space-x-2">
                    {plan.exercises.slice(0, 4).map((ex, i) => (
                      <div key={ex.id} className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-neutral-300" title={ex.name}>
                        <MuscleIcon type={ex.muscleType} className="w-5 h-5" />
                      </div>
                    ))}
                    {plan.exercises.length > 4 && (
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                        +{plan.exercises.length - 4}
                      </div>
                    )}
                 </div>
                 <div className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-wider">
                   Expand Blueprint &rarr;
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanBuilder;
