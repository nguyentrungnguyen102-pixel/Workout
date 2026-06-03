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

  // Dumbbell (tạ đơn tại nhà)
  { id: 'db_bicep_curl',      name: 'Dumbbell Bicep Curl',          nameVi: 'Curl tạ bắp tay',      category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_overhead_press',  name: 'Dumbbell Overhead Press',       nameVi: 'Ép vai tạ',            category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'db_bent_row',        name: 'Dumbbell Bent-Over Row',        nameVi: 'Kéo tạ lưng',          category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_chest_press',     name: 'Dumbbell Chest Press',          nameVi: 'Đẩy tạ ngực',         category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'db_chest_fly',       name: 'Dumbbell Chest Fly',            nameVi: 'Bay tạ ngực',          category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_rdl',             name: 'Dumbbell Romanian Deadlift',    nameVi: 'Deadlift tạ',          category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'db_goblet_squat',    name: 'Dumbbell Goblet Squat',         nameVi: 'Squat tạ trước ngực',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'db_lateral_raise',   name: 'Dumbbell Lateral Raise',        nameVi: 'Nâng tạ ngang vai',   category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_front_raise',     name: 'Dumbbell Front Raise',          nameVi: 'Nâng tạ trước vai',   category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_tricep_ext',      name: 'Dumbbell Tricep Extension',     nameVi: 'Tạ tay sau',           category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_hammer_curl',     name: 'Dumbbell Hammer Curl',          nameVi: 'Curl tạ búa',          category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'db_lunge',           name: 'Dumbbell Lunge',                nameVi: 'Lunge tạ',             category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  cardio: 'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
  dumbbell: 'Tạ đơn',
};
