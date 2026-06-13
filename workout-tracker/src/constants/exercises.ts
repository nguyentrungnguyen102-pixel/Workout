import { WorkoutPreset } from '../types/workout';

export const SYSTEM_PRESETS: WorkoutPreset[] = [
  // ── Bodyweight Strength ──────────────────────────────────────────────────────
  { id: 'pushup',        name: 'Push Up',       nameVi: 'Hít đất',         category: 'strength',  unit: 'reps',    defaultValue: 30, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'pullup',        name: 'Pull Up',       nameVi: 'Kéo xà',          category: 'strength',  unit: 'reps',    defaultValue: 10, defaultSets: 3, icon: '🤸', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'squat',         name: 'Squat',         nameVi: 'Squat',           category: 'strength',  unit: 'reps',    defaultValue: 20, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'plank',         name: 'Plank',         nameVi: 'Plank',           category: 'strength',  unit: 'seconds', defaultValue: 60, defaultSets: 3, icon: '🧘', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'lunge',         name: 'Lunge',         nameVi: 'Lunge',           category: 'strength',  unit: 'reps',    defaultValue: 20, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'burpee',        name: 'Burpee',        nameVi: 'Burpee',          category: 'strength',  unit: 'reps',    defaultValue: 10, defaultSets: 3, icon: '🔥', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'dip',           name: 'Dip',           nameVi: 'Chống đẩy ghế',   category: 'strength',  unit: 'reps',    defaultValue: 15, defaultSets: 3, icon: '💺', isCustom: false, usageCount: 0, equipment: 'bodyweight' },

  // ── Dumbbell Strength ────────────────────────────────────────────────────────
  // Chest
  { id: 'db_chest_press',  name: 'Dumbbell Chest Press',    nameVi: 'Đẩy tạ nằm',          category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_fly',          name: 'Dumbbell Fly',            nameVi: 'Dạng tạ nằm',          category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦅', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_pullover',     name: 'Dumbbell Pullover',       nameVi: 'Pullover tạ',           category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // Back
  { id: 'db_row',          name: 'Dumbbell Row',            nameVi: 'Chèo tạ một tay',       category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🚣', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_bent_row',     name: 'Dumbbell Bent Over Row',  nameVi: 'Chèo tạ cúi người',     category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_shrug',        name: 'Dumbbell Shrug',          nameVi: 'Nhún vai tạ',           category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🤷', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // Shoulder
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', nameVi: 'Đẩy vai tạ',         category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🙌', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_lateral_raise',  name: 'Dumbbell Lateral Raise',  nameVi: 'Dạng vai ngang',      category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '↔️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_front_raise',    name: 'Dumbbell Front Raise',    nameVi: 'Nâng tạ trước vai',   category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬆️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // Biceps
  { id: 'db_curl',            name: 'Dumbbell Curl',           nameVi: 'Cuốn tạ bắp tay',   category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_hammer_curl',     name: 'Hammer Curl',             nameVi: 'Cuốn búa',           category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔨', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // Triceps
  { id: 'db_tricep_ext',   name: 'Dumbbell Tricep Extension',  nameVi: 'Duỗi tay sau tạ',   category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_overhead_ext', name: 'Overhead Tricep Extension',  nameVi: 'Duỗi tay sau đầu',  category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '☝️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // Legs
  { id: 'db_goblet_squat', name: 'Goblet Squat',               nameVi: 'Squat ôm tạ',       category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏆', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_rdl',          name: 'Romanian Deadlift',           nameVi: 'Deadlift Romania',  category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🎣', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_lunge',        name: 'Dumbbell Lunge',              nameVi: 'Lunge tạ',          category: 'strength', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_calf_raise',   name: 'Dumbbell Calf Raise',         nameVi: 'Nâng gót tạ',       category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦶', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // Core
  { id: 'db_russian_twist', name: 'Dumbbell Russian Twist',    nameVi: 'Xoay người tạ',      category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🌀', isCustom: false, usageCount: 0, equipment: 'dumbbell' },
  { id: 'db_side_bend',     name: 'Dumbbell Side Bend',         nameVi: 'Nghiêng người tạ',  category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '↩️', isCustom: false, usageCount: 0, equipment: 'dumbbell' },

  // ── Cardio ───────────────────────────────────────────────────────────────────
  { id: 'running',       name: 'Running',       nameVi: 'Chạy bộ',         category: 'cardio',    unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🏃', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'cycling',       name: 'Cycling',       nameVi: 'Đạp xe',          category: 'cardio',    unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🚴', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'jumping_jacks', name: 'Jumping Jacks', nameVi: 'Bật nhảy',        category: 'cardio',    unit: 'reps',    defaultValue: 50, defaultSets: 3, icon: '⭐', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'jump_rope',     name: 'Jump Rope',     nameVi: 'Nhảy dây',        category: 'cardio',    unit: 'minutes', defaultValue: 10, defaultSets: 1, icon: '🪢', isCustom: false, usageCount: 0, equipment: 'bodyweight' },

  // ── Mobility ─────────────────────────────────────────────────────────────────
  { id: 'yoga',          name: 'Yoga',          nameVi: 'Yoga',            category: 'mobility',  unit: 'minutes', defaultValue: 20, defaultSets: 1, icon: '🧘', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'stretching',    name: 'Stretching',    nameVi: 'Giãn cơ',        category: 'mobility',  unit: 'minutes', defaultValue: 15, defaultSets: 1, icon: '🌅', isCustom: false, usageCount: 0, equipment: 'bodyweight' },

  // ── Recovery ──────────────────────────────────────────────────────────────────
  { id: 'walking',       name: 'Walking',       nameVi: 'Đi bộ',          category: 'recovery',  unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🚶', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
  { id: 'foam_rolling',  name: 'Foam Rolling',  nameVi: 'Lăn cơ',         category: 'recovery',  unit: 'minutes', defaultValue: 10, defaultSets: 1, icon: '🧻', isCustom: false, usageCount: 0, equipment: 'bodyweight' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  cardio:   'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'Tự trọng',
  dumbbell:   'Tạ đơn',
  barbell:    'Tạ đòn',
};
