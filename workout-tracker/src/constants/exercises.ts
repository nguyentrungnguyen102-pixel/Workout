import { WorkoutPreset } from '../types/workout';

export const SYSTEM_PRESETS: WorkoutPreset[] = [
  // Strength
  { id: 'pushup', name: 'Push Up', nameVi: 'Hít đất', category: 'strength', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'pullup', name: 'Pull Up', nameVi: 'Kéo xà', category: 'strength', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🤸', isCustom: false, usageCount: 0 },
  { id: 'squat', name: 'Squat', nameVi: 'Squat', category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'plank', name: 'Plank', nameVi: 'Plank', category: 'strength', unit: 'seconds', defaultValue: 60, defaultSets: 3, icon: '🧘', isCustom: false, usageCount: 0 },
  { id: 'lunge', name: 'Lunge', nameVi: 'Lunge', category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'burpee', name: 'Burpee', nameVi: 'Burpee', category: 'strength', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🔥', isCustom: false, usageCount: 0 },
  { id: 'dip', name: 'Dip', nameVi: 'Chống đẩy ghế', category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '💺', isCustom: false, usageCount: 0 },

  // Cardio
  { id: 'running', name: 'Running', nameVi: 'Chạy bộ', category: 'cardio', unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🏃', isCustom: false, usageCount: 0 },
  { id: 'cycling', name: 'Cycling', nameVi: 'Đạp xe', category: 'cardio', unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🚴', isCustom: false, usageCount: 0 },
  { id: 'jumping_jacks', name: 'Jumping Jacks', nameVi: 'Bật nhảy', category: 'cardio', unit: 'reps', defaultValue: 50, defaultSets: 3, icon: '⭐', isCustom: false, usageCount: 0 },
  { id: 'jump_rope', name: 'Jump Rope', nameVi: 'Nhảy dây', category: 'cardio', unit: 'minutes', defaultValue: 10, defaultSets: 1, icon: '🪢', isCustom: false, usageCount: 0 },

  // Mobility
  { id: 'yoga', name: 'Yoga', nameVi: 'Yoga', category: 'mobility', unit: 'minutes', defaultValue: 20, defaultSets: 1, icon: '🧘', isCustom: false, usageCount: 0 },
  { id: 'stretching', name: 'Stretching', nameVi: 'Giãn cơ', category: 'mobility', unit: 'minutes', defaultValue: 15, defaultSets: 1, icon: '🌅', isCustom: false, usageCount: 0 },

  // Recovery
  { id: 'walking', name: 'Walking', nameVi: 'Đi bộ', category: 'recovery', unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🚶', isCustom: false, usageCount: 0 },
  { id: 'foam_rolling', name: 'Foam Rolling', nameVi: 'Lăn cơ', category: 'recovery', unit: 'minutes', defaultValue: 10, defaultSets: 1, icon: '🧻', isCustom: false, usageCount: 0 },

  // Dumbbell (home)
  { id: 'dumbbell_curl',          name: 'Dumbbell Curl',          nameVi: 'Curl tạ đơn',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'dumbbell_shoulder_press',name: 'Dumbbell Shoulder Press', nameVi: 'Đẩy tạ vai',         category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'dumbbell_row',           name: 'Dumbbell Row',           nameVi: 'Rowing tạ đơn',       category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🤸', isCustom: false, usageCount: 0 },
  { id: 'goblet_squat',           name: 'Goblet Squat',           nameVi: 'Goblet Squat tạ',     category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'dumbbell_lunge',         name: 'Dumbbell Lunge',         nameVi: 'Lunge tạ đơn',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'dumbbell_fly',           name: 'Dumbbell Fly',           nameVi: 'Bay ngực tạ',         category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'dumbbell_rdl',           name: 'Dumbbell RDL',           nameVi: 'Romanian Deadlift tạ',category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'lateral_raise',          name: 'Lateral Raise',          nameVi: 'Nâng ngang tạ',       category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'tricep_ext',             name: 'Tricep Extension',       nameVi: 'Duỗi bắp tay sau',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'dumbbell_shrug',         name: 'Dumbbell Shrug',         nameVi: 'Nhún vai tạ',         category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  cardio: 'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
  dumbbell: 'Tạ đơn',
};
