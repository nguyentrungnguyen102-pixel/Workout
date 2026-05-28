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

  // Dumbbell — home training
  { id: 'db_curl',           name: 'Dumbbell Curl',         nameVi: 'Cuộn tay (tạ)',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_press',          name: 'Dumbbell Chest Press',  nameVi: 'Đẩy ngực (tạ)',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'db_row',            name: 'Dumbbell Row',          nameVi: 'Kéo lưng (tạ)',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🫸', isCustom: false, usageCount: 0 },
  { id: 'db_shoulder_press', name: 'Shoulder Press',        nameVi: 'Đẩy vai (tạ)',         category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🔝', isCustom: false, usageCount: 0 },
  { id: 'db_lateral_raise',  name: 'Lateral Raise',         nameVi: 'Dang ngang vai (tạ)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '↔️', isCustom: false, usageCount: 0 },
  { id: 'db_front_raise',    name: 'Front Raise',           nameVi: 'Giơ trước vai (tạ)',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬆️', isCustom: false, usageCount: 0 },
  { id: 'db_tricep_ext',     name: 'Tricep Extension',      nameVi: 'Duỗi tay sau (tạ)',    category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔄', isCustom: false, usageCount: 0 },
  { id: 'db_hammer_curl',    name: 'Hammer Curl',           nameVi: 'Cuộn búa (tạ)',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔨', isCustom: false, usageCount: 0 },
  { id: 'db_fly',            name: 'Dumbbell Fly',          nameVi: 'Dang ngực (tạ)',       category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦅', isCustom: false, usageCount: 0 },
  { id: 'db_bent_row',       name: 'Bent Over Row',         nameVi: 'Kéo cúi người (tạ)',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'db_goblet_squat',   name: 'Goblet Squat',          nameVi: 'Squat tạ đơn',         category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏆', isCustom: false, usageCount: 0 },
  { id: 'db_rdl',            name: 'Romanian Deadlift',     nameVi: 'Deadlift Romania (tạ)',category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'db_lunge',          name: 'Dumbbell Lunge',        nameVi: 'Lunge (tạ)',           category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🚶', isCustom: false, usageCount: 0 },
  { id: 'db_calf_raise',     name: 'Calf Raise',            nameVi: 'Nâng gót chân (tạ)',   category: 'dumbbell', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦶', isCustom: false, usageCount: 0 },
  { id: 'db_arnold_press',   name: 'Arnold Press',          nameVi: 'Arnold Press (tạ)',    category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🌀', isCustom: false, usageCount: 0 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  cardio: 'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
  dumbbell: 'Tạ đơn',
};
