import { WorkoutPreset, MuscleGroup } from '../types/workout';

export const SYSTEM_PRESETS: WorkoutPreset[] = [
  // Strength (bodyweight)
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

  // Dumbbell (home training) — Phase 5, muscle groups added Phase 6
  { id: 'db_bicep_curl',       name: 'Bicep Curl',         nameVi: 'Curl tạ đơn (bắp tay)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_hammer_curl',      name: 'Hammer Curl',        nameVi: 'Curl búa (bắp tay)',     category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔨', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_tricep_ext',       name: 'Tricep Extension',   nameVi: 'Giơ tạ sau đầu (tay sau)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦾', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_tricep_kick',      name: 'Tricep Kickback',    nameVi: 'Đá tay sau (tricep)',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦾', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_shoulder_press',   name: 'Shoulder Press',     nameVi: 'Đẩy tạ đôi (vai)',     category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🙆', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_lateral_raise',    name: 'Lateral Raise',      nameVi: 'Nâng tạ ngang vai',    category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '↔️', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_front_raise',      name: 'Front Raise',        nameVi: 'Nâng tạ phía trước',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬆️', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_chest_press',      name: 'Chest Press (floor)',nameVi: 'Đẩy tạ nằm sàn (ngực)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🛌', isCustom: false, usageCount: 0, muscleGroup: 'chest' },
  { id: 'db_chest_fly',        name: 'Chest Fly (floor)',  nameVi: 'Bay tạ nằm sàn (ngực)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🕊️', isCustom: false, usageCount: 0, muscleGroup: 'chest' },
  { id: 'db_bent_row',         name: 'Bent Over Row',      nameVi: 'Kéo tạ cúi người (lưng)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔙', isCustom: false, usageCount: 0, muscleGroup: 'back' },
  { id: 'db_single_arm_row',   name: 'Single Arm Row',     nameVi: 'Kéo tạ một tay (lưng)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦴', isCustom: false, usageCount: 0, muscleGroup: 'back' },
  { id: 'db_goblet_squat',     name: 'Goblet Squat',       nameVi: 'Squat ôm tạ (đùi)',    category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏆', isCustom: false, usageCount: 0, muscleGroup: 'legs_glutes' },
  { id: 'db_lunge',            name: 'Dumbbell Lunge',     nameVi: 'Lunge tạ (đùi mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'legs_glutes' },
  { id: 'db_sumo_squat',       name: 'Sumo Squat',         nameVi: 'Squat sumo tạ (mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'legs_glutes' },
  { id: 'db_rdl',              name: 'Romanian Deadlift',  nameVi: 'Deadlift tạ Romania (sau đùi)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏗️', isCustom: false, usageCount: 0, muscleGroup: 'legs_glutes' },
  { id: 'db_deadlift',         name: 'Dumbbell Deadlift',  nameVi: 'Deadlift tạ đôi (toàn thân)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0, muscleGroup: 'full_body' },
  { id: 'db_hip_thrust',       name: 'Hip Thrust DB',      nameVi: 'Hip thrust tạ (mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🍑', isCustom: false, usageCount: 0, muscleGroup: 'legs_glutes' },
  { id: 'db_arnold_press',     name: 'Arnold Press',       nameVi: 'Arnold press (vai)',    category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🌀', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_upright_row',      name: 'Upright Row',        nameVi: 'Kéo tạ đứng (vai/thang)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔝', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_reverse_fly',      name: 'Reverse Fly',        nameVi: 'Bay tạ ngược (vai sau)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔄', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  cardio: 'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
  dumbbell: 'Tạ đơn',
};

export const MUSCLE_GROUP_LABELS: Record<string, { label: string; emoji: string }> = {
  arms:       { label: 'Tay',       emoji: '💪' },
  shoulders:  { label: 'Vai',       emoji: '🙆' },
  chest:      { label: 'Ngực',      emoji: '🫁' },
  back:       { label: 'Lưng',      emoji: '🔙' },
  legs_glutes:{ label: 'Đùi/Mông',  emoji: '🦵' },
  full_body:  { label: 'Toàn thân', emoji: '⚡' },
};
