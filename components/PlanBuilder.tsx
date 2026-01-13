import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Copy
} from 'lucide-react';

// Component to handle authenticated Drive image loading via blob fetch
const SafeImage: React.FC<{ 
  src: string | undefined, 
  alt: string, 
  accessToken?: string | null,
  className?: string
}> = ({ src, alt, accessToken, className }) => {
  const [blobUrl, setBlobUrl] = useState<string | undefined>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setBlobUrl(undefined);
      return;
    }

    // If it's not a Google Drive URL, use it directly (base64 or public CDN)
    const isDriveUrl = src.includes('googleapis.com/drive');
    if (!isDriveUrl || !accessToken) {
      setBlobUrl(src);
      return;
    }

    let isMounted = true;
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        // Use standard Bearer token for better compatibility with current Drive API security
        const response = await fetch(src, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Axiom Trace: Image fetch rejected');
        const blob = await response.blob();
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, accessToken]);

  if (!src) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 opacity-20 w-full h-full">
        <ImageIcon size={32} />
        <span className="text-[8px] font-mono">ASSET_LINK_FAIL</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="animate-spin text-neutral-700" size={24} />
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
};

// Auto-expanding textarea component to replace fixed-height inputs
const AutoExpandingTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={props.rows || 1}
      onChange={(e) => {
        props.onChange?.(e);
        adjustHeight();
      }}
      className={className}
      style={{ ...props.style, overflow: 'hidden', resize: 'none' }}
    />
  );
};

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
  target?: string;
  thumbnailLink?: string;
  directUrl?: string;
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
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
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
        setExpandedNotes({});
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

  const copyPlan = (e: React.MouseEvent, plan: WorkoutPlan) => {
    e.stopPropagation();
    const newPlan: WorkoutPlan = {
      ...JSON.parse(JSON.stringify(plan)),
      id: crypto.randomUUID(),
      name: `${plan.name} (Copy)`,
      createdAt: Date.now()
    };
    onUpdatePlans([...plans, newPlan]);
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
    const processedUpdates = { ...updates };
    if (processedUpdates.name) {
      processedUpdates.name = processedUpdates.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    setTempPlan(prev => ({
      ...prev,
      exercises: prev.exercises?.map(ex => {
        if (ex.id === exerciseId) return { ...ex, ...processedUpdates };
        if (ex.alternatives) {
          const updatedAlts = ex.alternatives.map(alt => 
            alt.id === exerciseId ? { ...alt, ...processedUpdates } : alt
          );
          if (updatedAlts !== ex.alternatives) {
            return { ...ex, alternatives: updatedAlts };
          }
        }
        return ex;
      })
    }));
  };

  const addAlternative = (parentId: string) => {
    setTempPlan(prev => {
      const exercises = prev.exercises || [];
      const index = exercises.findIndex(ex => ex.id === parentId);
      if (index === -1) return prev;

      const currentMain = exercises[index];
      const newAlt: Exercise = {
        id: crypto.randomUUID(),
        name: 'Alternative Exercise',
        muscleType: currentMain.muscleType,
        sets: currentMain.sets,
        reps: currentMain.reps,
        weight: currentMain.weight,
        notes: '',
        supersetId: currentMain.supersetId
      };

      // To keep it "saved as chosen", make the new one primary immediately
      const updatedMain = {
        ...newAlt,
        alternatives: [...(currentMain.alternatives || []), currentMain]
      };

      const newExercises = [...exercises];
      newExercises[index] = updatedMain;
      return { ...prev, exercises: newExercises };
    });
  };

  const setAsPrimary = (parentId: string, altId: string) => {
    setTempPlan(prev => {
      const exercises = prev.exercises || [];
      const index = exercises.findIndex(ex => ex.id === parentId);
      if (index === -1) return prev;

      const currentMain = exercises[index];
      const alts = currentMain.alternatives || [];
      const altIndex = alts.findIndex(a => a.id === altId);
      if (altIndex === -1) return prev;

      const chosenAlt = alts[altIndex];
      const remainingAlts = alts.filter(a => a.id !== altId);
      
      const newMain = { 
        ...chosenAlt, 
        alternatives: [...remainingAlts, { ...currentMain, alternatives: undefined }] 
      };

      const newExercises = [...exercises];
      newExercises[index] = newMain;
      return { ...prev, exercises: newExercises };
    });
  };

  const switchAlternative = (parentId: string, delta: number) => {
    setTempPlan(prev => {
      const exercises = prev.exercises || [];
      const index = exercises.findIndex(ex => ex.id === parentId);
      if (index === -1) return prev;

      const currentMain = exercises[index];
      const alts = currentMain.alternatives || [];
      if (alts.length === 0) return prev;

      const all = [currentMain, ...alts];
      const total = all.length;
      
      // Rotate primary slot to next/previous alternative and save as chosen
      const shift = (delta + total) % total;
      const rotated = [...all.slice(shift), ...all.slice(0, shift)];
      
      const newMain = { ...rotated[0], alternatives: rotated.slice(1) };
      const newExercises = [...exercises];
      newExercises[index] = newMain;
      
      return { ...prev, exercises: newExercises };
    });
  };

  const toggleSuperset = (exerciseId: string) => {
    const exercises = tempPlan.exercises || [];
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    let updatedExercises = [...exercises];
    
    if (exercise.supersetId) {
      updatedExercises = updatedExercises.map(ex => 
        ex.id === exerciseId ? { 
          ...ex, 
          supersetId: undefined,
          alternatives: ex.alternatives?.map(alt => ({ ...alt, supersetId: undefined }))
        } : ex
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
        const sid = Number(targetSupersetId);
        updatedExercises = updatedExercises.map(ex => 
          ex.id === exerciseId ? { 
            ...ex, 
            supersetId: sid,
            alternatives: ex.alternatives?.map(alt => ({ ...alt, supersetId: sid }))
          } : ex
        );

        const members = updatedExercises.filter(ex => ex.supersetId === sid);
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
          ex.id === exerciseId ? { 
            ...ex, 
            supersetId: nextId,
            alternatives: ex.alternatives?.map(alt => ({ ...alt, supersetId: nextId }))
          } : ex
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
    setTempPlan(prev => {
      const currentExercises = prev.exercises || [];
      
      // We look for the exercise "slot" where this exercise is currently displayed (primary)
      const primaryIndex = currentExercises.findIndex(ex => ex.id === exerciseId);
      
      if (primaryIndex !== -1) {
        const targetSlot = currentExercises[primaryIndex];
        // If the slot has alternatives, promote the first one to primary instead of removing the whole slot
        if (targetSlot.alternatives && targetSlot.alternatives.length > 0) {
          const nextAlts = [...targetSlot.alternatives];
          const promoted = nextAlts.shift()!;
          const newExercises = [...currentExercises];
          newExercises[primaryIndex] = { ...promoted, alternatives: nextAlts };
          return { ...prev, exercises: newExercises };
        }
        // If it has no alternatives, remove the entire slot from the blueprint
        return { ...prev, exercises: currentExercises.filter(ex => ex.id !== exerciseId) };
      }

      // Safeguard: Check if it's a nested alternative and remove it from there
      const updatedExercises = currentExercises.map(ex => {
        if (ex.alternatives && ex.alternatives.some(alt => alt.id === exerciseId)) {
          return {
            ...ex,
            alternatives: ex.alternatives.filter(alt => alt.id !== exerciseId)
          };
        }
        return ex;
      });

      return { ...prev, exercises: updatedExercises };
    });
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

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Drive Upload Failed');
    }
    
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
      if (url) {
        updateExercise(exerciseId, { image: url });
        setViewingImageExId(null);
      }
    } catch (err) {
      console.error('Axiom Drive: Asset upload sequence failure', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const fetchLibraryImages = async () => {
    const staticAssets: DriveImage[] = [
      { id: 'cd-tri-dips', name: 'Triceps Dips', target: 'Triceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323758/Triceps_Dips_blox8a.gif' },
      { id: 'cd-seated-row', name: 'Seated Row', target: 'Back', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323755/Seated_Row_keb2jq.gif' },
      { id: 'cd-single-leg-press', name: 'Single Leg Press', target: 'Quads', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323756/Single_Leg_Press_tc5iq3.gif' },
      { id: 'cd-single-calf-press', name: 'Single Calf Press', target: 'Calves', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323755/Single_Calf_Press_zvmdgu.gif' },
      { id: 'cd-seated-leg-curl', name: 'Seated Leg Curl', target: 'Hamstrings', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323755/Seated_Leg_Curl_igj4ba.gif' },
      { id: 'cd-rope-pushdown', name: 'Rope Pushdown', target: 'Triceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323755/Rope_Pushdown_pawkmm.gif' },
      { id: 'cd-pull-up', name: 'Pull-up', target: 'Back', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323752/Pull-up_wfvwed.gif' },
      { id: 'cd-rev-cable-curl', name: 'Reverse Cable Curl', target: 'Triceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323752/Reverse_Cable_Curl_wlwdbn.webp' },
      { id: 'cd-lever-calf-raise', name: 'Lever Seated Calf Raise', target: 'Calves', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323751/Lever_Seated_Calf_Raise_fpf1p2.gif' },
      { id: 'cd-neck-harness', name: 'Neck Harness Extension', target: 'Neck', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323751/Neck_Harness_Extension_ykqxdt.gif' },
      { id: 'cd-preacher-curl', name: 'Preacher Curl', target: 'Biceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323751/Preacher_Curl_e1qxeu.gif' },
      { id: 'cd-lever-tri-ext', name: 'Lever Triceps Extension', target: 'Triceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323750/Lever_Triceps_Extension_fjgrp3.gif' },
      { id: 'cd-lying-neck-flex', name: 'Lying Neck Flexion', target: 'Neck', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323751/Lying_Neck_Flexion_rctha5.gif' },
      { id: 'cd-leg-ext', name: 'Leg Extension', target: 'Quads', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323750/Leg_Extension_izu1kw.gif' },
      { id: 'cd-leg-press', name: 'Leg Press', target: 'Quads', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323750/Leg_Press_s1h69z.gif' },
      { id: 'cd-leg-curl', name: 'Leg Curl', target: 'Hamstrings', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323748/Leg_Curl_ptmvae.gif' },
      { id: 'cd-inc-chest-press', name: 'Incline Chest Press', target: 'Chest', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323747/Incline_Chest_Press_lgxlny.gif' },
      { id: 'cd-horiz-leg-press', name: 'Horizontal Leg Press', target: 'Quads', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323746/Horizontal_Leg_Press_cppv9a.gif' },
      { id: 'cd-lat-raise-mach', name: 'Lateral Raise Machine', target: 'Shoulders', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323747/Lateral_Raise_Machine_qoaknx.gif' },
      { id: 'cd-inc-db-press', name: 'Incline Dumbbell Press', target: 'Chest', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323747/Incline_Dumbbell_Press_kkmdpg.gif' },
      { id: 'cd-lat-neck-flex', name: 'Lateral Neck Flexion', target: 'Neck', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323747/Lateral_Neck_Flexion_gnjjxa.gif' },
      { id: 'cd-cable-rev-fly', name: 'Cable Reverse Fly', target: 'Shoulders', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323746/Cable_Reverse_Fly_p9pvub.gif' },
      { id: 'cd-bw-squat', name: 'Bodyweight Squat', target: 'Quads', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323745/Bodyweight_Squat_qhp71r.gif' },
      { id: 'cd-hammer-curl', name: 'Hammer Curl', target: 'Biceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323746/Hammer_Curl_hcfsnr.gif' },
      { id: 'cd-cable-wrist-curl', name: 'Cable Wrist Curl', target: 'Forearms', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323746/Cable_Wrist_Curl_hivrn8.gif' },
      { id: 'cd-cable-front-raise', name: 'Cable Front Raise', target: 'Shoulders', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323746/Cable_Front_Raise_d4yxcp.gif' },
      { id: 'cd-bench-press', name: 'Bench Press', target: 'Chest', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323745/Bench_Press_v8oin9.gif' },
      { id: 'cd-bb-squat', name: 'Barbell Squat', target: 'Quads', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323745/Barbell_Squat_iz2u2r.gif' },
      { id: 'cd-back-wrist-curl', name: 'Back Wrist Curl', target: 'Forearms', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323745/Back_Wrist_Curl_f4n3kv.gif' },
      { id: 'cd-ab-wheel', name: 'Ab Wheel Rollout', target: 'Abs', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323744/Ab_Wheel_Rollout_rd8qjt.gif' },
      { id: 'cd-bb-curl', name: 'Barbell Curl', target: 'Biceps', directUrl: 'https://res.cloudinary.com/dziwxssi4/image/upload/v1768323745/Barbell_Curl_rfhh96.gif' }
    ];

    if (!accessToken) {
      setLibraryImages(staticAssets);
      return;
    }

    setLoadingLibrary(true);
    try {
      const sharedFolderId = '1byvUDQYBqShPdqL87ZfBG_oxpnwfrt8e';
      const axiomId = await findOrCreateFolder('Axiom');
      const modulesId = await findOrCreateFolder('modules', axiomId);
      const uploadsId = await findOrCreateFolder('uploads', modulesId);

      // Fetch user's personal uploads from the modules/uploads folder
      const qPrivate = encodeURIComponent(`'${uploadsId}' in parents and mimeType contains 'image/' and trashed = false`);
      const responsePrivate = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qPrivate}&fields=files(id,name,thumbnailLink)&pageSize=50`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dataPrivate = await responsePrivate.json();

      // Fetch shared folder content
      const qShared = encodeURIComponent(`'${sharedFolderId}' in parents and mimeType contains 'image/' and trashed = false`);
      const responseShared = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qShared}&fields=files(id,name,thumbnailLink)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dataShared = await responseShared.json();

      const combinedFiles = [
        ...staticAssets,
        ...(dataPrivate.files || []),
        ...(dataShared.files || [])
      ];

      // Remove duplicates by ID
      const uniqueFiles = combinedFiles.filter((file, index, self) =>
        index === self.findIndex((f) => f.id === file.id)
      );

      setLibraryImages(uniqueFiles);
    } catch (err) {
      console.error('Library fetch failed:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

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
          {tempPlan.exercises?.map((ex, index) => {
            const totalAlts = 1 + (ex.alternatives?.length || 0);

            return (
              <div 
                key={ex.id} 
                onTouchStart={e => setTouchStart(e.targetTouches[0].clientX)}
                onTouchEnd={e => {
                  if (touchStart === null) return;
                  const touchEnd = e.changedTouches[0].clientX;
                  if (touchStart - touchEnd > 50) switchAlternative(ex.id, 1);
                  if (touchStart - touchEnd < -50) switchAlternative(ex.id, -1);
                  setTouchStart(null);
                }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col group relative"
              >
                {/* Visual Stack Layers */}
                {totalAlts >= 2 && (
                  <div className="absolute inset-0 -translate-y-2 scale-x-[0.96] bg-neutral-900/60 border border-neutral-800 rounded-xl -z-10" />
                )}
                {totalAlts >= 3 && (
                  <div className="absolute inset-0 -translate-y-3.5 scale-x-[0.90] bg-neutral-900/40 border border-neutral-800 rounded-xl -z-20" />
                )}
                
                {activePicker === ex.id && (
                  <div className="absolute inset-0 z-50 bg-neutral-950/95 backdrop-blur-md p-3 flex flex-col animate-in fade-in zoom-in-95 duration-200 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Select Target Muscle</span>
                      <button onClick={() => setActivePicker(null)} className="p-1 text-neutral-500 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 flex-1 overflow-y-auto pr-1">
                      {MUSCLE_GROUPS.map(group => (
                        <button
                          key={group}
                          onClick={() => {
                            updateExercise(ex.id, { muscleType: group });
                            setActivePicker(null);
                          }}
                          className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl border transition-all
                            ${ex.muscleType === group ? 'bg-neutral-100 border-neutral-100 text-black' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                          `}
                        >
                          <MuscleIcon type={group} className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase">{group}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Control Row */}
                <div className="flex flex-row p-3 gap-3 items-stretch relative z-10 bg-neutral-900 rounded-t-xl">
                  {/* Left: Responsive Image Section */}
                  <div className="w-32 sm:w-44 shrink-0 flex flex-col">
                    <div 
                      onClick={() => setViewingImageExId(ex.id)}
                      className="relative w-full h-full sm:h-auto sm:aspect-square bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-neutral-700 transition-all group/img"
                    >
                      <SafeImage 
                        src={ex.image} 
                        alt={ex.name} 
                        accessToken={accessToken}
                        className="w-full h-full object-cover opacity-60 group-hover/img:opacity-80 transition-opacity"
                      />
                      
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

                {/* Conditional Notes Area */}
                {expandedNotes[ex.id] && (
                  <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200 bg-neutral-900 relative z-10">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono text-neutral-700 uppercase">Notes</span>
                      <AutoExpandingTextarea 
                        value={ex.notes}
                        onChange={(e) => updateExercise(ex.id, { notes: e.target.value })}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-[10px] w-full focus:border-neutral-700 outline-none min-h-[44px] leading-snug"
                        placeholder="Tempo, cues..."
                      />
                    </div>
                    
                    {ex.alternatives && ex.alternatives.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-neutral-800/50">
                        <span className="text-[8px] font-mono text-neutral-700 uppercase">Alternatives</span>
                        <div className="space-y-1">
                          {ex.alternatives.map(alt => (
                            <div key={alt.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-neutral-800/50">
                              <span className="text-[10px] text-neutral-400 truncate pr-2">{alt.name}</span>
                              <button 
                                onClick={() => setAsPrimary(ex.id, alt.id)}
                                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded text-[8px] font-mono uppercase transition-all whitespace-nowrap"
                              >
                                Set Primary
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="p-2 border-t border-neutral-800/50 flex justify-end gap-2 items-center bg-black/10 relative z-10 rounded-b-xl">
                  <div className="group/plus relative flex items-center mr-auto">
                    {totalAlts > 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex gap-2 opacity-0 group-hover/plus:opacity-100 transition-opacity bg-neutral-900 rounded-lg p-1 border border-neutral-700 shadow-2xl z-20">
                         <button onClick={(e) => { e.stopPropagation(); switchAlternative(ex.id, -1); }} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"><ChevronLeft size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); switchAlternative(ex.id, 1); }} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"><ChevronRight size={16}/></button>
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); addAlternative(ex.id); }}
                      className="p-1 h-6 rounded-md border bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-emerald-500 transition-all flex items-center justify-center"
                      title="Add alternative exercise"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button 
                    onClick={() => toggleSuperset(ex.id)} 
                    className={`p-1 h-6 rounded-md border flex items-center gap-1 transition-all ${ex.supersetId ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
                  >
                    <Link size={12} />
                    {ex.supersetId && <span className="text-[9px] font-bold leading-none">{ex.supersetId}</span>}
                  </button>
                  <button 
                    onClick={() => setExpandedNotes(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))} 
                    title="Toggle Notes"
                    className={`p-1 h-6 rounded-md border flex items-center gap-1 transition-all ${expandedNotes[ex.id] ? 'bg-neutral-100 border-neutral-100 text-black' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
                  >
                    <FileText size={12} />
                  </button>
                  <button onClick={() => setExerciseToDeleteId(ex.id)} className="text-neutral-600 hover:text-rose-500 transition-colors p-1 h-6 flex items-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

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

        {/* Image Management Popup */}
        {viewingImageExId && createPortal(
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
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
                      <div className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mt-0.5">{isLibraryOpen ? 'root/uploads/' : 'Media Component Active'}</div>
                    </div>
                  </div>
                  {isLibraryOpen && (
                    <button onClick={() => setIsLibraryOpen(false)} className="p-2 text-neutral-500 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  )}
                </div>

                {!isLibraryOpen ? (
                  <>
                    <div className="w-full aspect-square bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center">
                      <SafeImage 
                        src={tempPlan.exercises?.flatMap(ex => [ex, ...(ex.alternatives || [])]).find(ex => ex.id === viewingImageExId)?.image} 
                        alt="Exercise Reference" 
                        accessToken={accessToken}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-neutral-100 hover:bg-white text-black font-bold rounded-xl transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                      >
                        <Upload size={16} />
                        {tempPlan.exercises?.flatMap(ex => [ex, ...(ex.alternatives || [])]).find(ex => ex.id === viewingImageExId)?.image ? 'Replace Asset' : 'Upload Asset'}
                      </button>

                      <button 
                        onClick={() => { setIsLibraryOpen(true); fetchLibraryImages(); }}
                        className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold rounded-xl transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                      >
                        <Library size={16} />
                        Choose from library
                      </button>
                      
                      {tempPlan.exercises?.flatMap(ex => [ex, ...(ex.alternatives || [])]).find(ex => ex.id === viewingImageExId)?.image && (
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
                                const imgUrl = img.directUrl || `https://www.googleapis.com/drive/v3/files/${img.id}?alt=media`;
                                updateExercise(viewingImageExId, { 
                                  image: imgUrl,
                                  name: img.name,
                                  muscleType: img.target || 'Chest'
                                });
                                setIsLibraryOpen(false);
                                setViewingImageExId(null);
                              }
                            }}
                            className="group/item relative aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden hover:border-emerald-500 transition-all"
                          >
                            <SafeImage 
                              src={img.thumbnailLink || img.directUrl || `https://www.googleapis.com/drive/v3/files/${img.id}?alt=media`}
                              alt={img.name}
                              accessToken={accessToken}
                              className="w-full h-full object-cover opacity-60 group-hover/item:opacity-100 transition-opacity"
                            />
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
              
              {!isLibraryOpen && (
                <div className="absolute top-2 right-2">
                  <button onClick={() => setViewingImageExId(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={16} className="text-neutral-600" />
                  </button>
                </div>
              )}

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
                      onClick={(e) => { e.stopPropagation(); copyPlan(e, plan); }}
                      title="Copy this blueprint"
                      className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white border border-neutral-700/50 transition-all"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                      title="Delete blueprint"
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