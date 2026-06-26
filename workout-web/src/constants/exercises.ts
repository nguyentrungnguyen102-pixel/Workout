import { WorkoutPreset } from '../types/workout';

export const SYSTEM_PRESETS: WorkoutPreset[] = [
  // Strength (bodyweight)
  { id: 'pushup', name: 'Push Up', nameVi: 'Hít đất', category: 'strength', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'pullup', name: 'Pull Up', nameVi: 'Kéo xà', category: 'strength', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🤸', isCustom: false, usageCount: 0 },
  { id: 'squat', name: 'Squat', nameVi: 'Squat', category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0 },
  { id: 'lunge', name: 'Lunge', nameVi: 'Lunge', category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'burpee', name: 'Burpee', nameVi: 'Burpee', category: 'strength', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🔥', isCustom: false, usageCount: 0 },
  { id: 'dip', name: 'Dip', nameVi: 'Chống đẩy ghế', category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '💺', isCustom: false, usageCount: 0 },

  // Core / Bụng
  { id: 'plank', name: 'Plank', nameVi: 'Plank', category: 'core', unit: 'seconds', defaultValue: 60, defaultSets: 3, icon: '🧘', isCustom: false, usageCount: 0 },
  { id: 'crunch', name: 'Crunch', nameVi: 'Gập bụng', category: 'core', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🔥', isCustom: false, usageCount: 0 },
  { id: 'situp', name: 'Sit Up', nameVi: 'Ngồi dậy', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '⬆️', isCustom: false, usageCount: 0 },
  { id: 'leg_raise', name: 'Leg Raise', nameVi: 'Nâng chân thẳng', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'bicycle_crunch', name: 'Bicycle Crunch', nameVi: 'Đạp xe bụng', category: 'core', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🚴', isCustom: false, usageCount: 0 },
  { id: 'mountain_climber', name: 'Mountain Climber', nameVi: 'Leo núi', category: 'core', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '⛰️', isCustom: false, usageCount: 0 },
  { id: 'russian_twist', name: 'Russian Twist', nameVi: 'Xoay hông', category: 'core', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🔄', isCustom: false, usageCount: 0 },
  { id: 'side_plank', name: 'Side Plank', nameVi: 'Plank nghiêng', category: 'core', unit: 'seconds', defaultValue: 30, defaultSets: 2, icon: '↔️', isCustom: false, usageCount: 0 },
  { id: 'reverse_crunch', name: 'Reverse Crunch', nameVi: 'Gập bụng ngược', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0 },
  { id: 'v_up', name: 'V-Up', nameVi: 'Gập bụng chữ V', category: 'core', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '✌️', isCustom: false, usageCount: 0 },
  { id: 'flutter_kick', name: 'Flutter Kick', nameVi: 'Đá chân bơi', category: 'core', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '🏊', isCustom: false, usageCount: 0 },

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

  // Dumbbell (home training) — Phase 5
  { id: 'db_bicep_curl',       name: 'Bicep Curl',         nameVi: 'Curl tạ đơn (bắp tay)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0 },
  { id: 'db_hammer_curl',      name: 'Hammer Curl',        nameVi: 'Curl búa (bắp tay)',     category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔨', isCustom: false, usageCount: 0 },
  { id: 'db_tricep_ext',       name: 'Tricep Extension',   nameVi: 'Giơ tạ sau đầu (tay sau)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦾', isCustom: false, usageCount: 0 },
  { id: 'db_tricep_kick',      name: 'Tricep Kickback',    nameVi: 'Đá tay sau (tricep)',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦾', isCustom: false, usageCount: 0 },
  { id: 'db_shoulder_press',   name: 'Shoulder Press',     nameVi: 'Đẩy tạ đôi (vai)',     category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🙆', isCustom: false, usageCount: 0 },
  { id: 'db_lateral_raise',    name: 'Lateral Raise',      nameVi: 'Nâng tạ ngang vai',    category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '↔️', isCustom: false, usageCount: 0 },
  { id: 'db_front_raise',      name: 'Front Raise',        nameVi: 'Nâng tạ phía trước',   category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬆️', isCustom: false, usageCount: 0 },
  { id: 'db_chest_press',      name: 'Chest Press (floor)',nameVi: 'Đẩy tạ nằm sàn (ngực)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🛌', isCustom: false, usageCount: 0 },
  { id: 'db_chest_fly',        name: 'Chest Fly (floor)',  nameVi: 'Bay tạ nằm sàn (ngực)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🕊️', isCustom: false, usageCount: 0 },
  { id: 'db_bent_row',         name: 'Bent Over Row',      nameVi: 'Kéo tạ cúi người (lưng)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔙', isCustom: false, usageCount: 0 },
  { id: 'db_single_arm_row',   name: 'Single Arm Row',     nameVi: 'Kéo tạ một tay (lưng)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦴', isCustom: false, usageCount: 0 },
  { id: 'db_goblet_squat',     name: 'Goblet Squat',       nameVi: 'Squat ôm tạ (đùi)',    category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏆', isCustom: false, usageCount: 0 },
  { id: 'db_lunge',            name: 'Dumbbell Lunge',     nameVi: 'Lunge tạ (đùi mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'db_sumo_squat',       name: 'Sumo Squat',         nameVi: 'Squat sumo tạ (mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'db_rdl',              name: 'Romanian Deadlift',  nameVi: 'Deadlift tạ Romania (sau đùi)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏗️', isCustom: false, usageCount: 0 },
  { id: 'db_deadlift',         name: 'Dumbbell Deadlift',  nameVi: 'Deadlift tạ đôi (toàn thân)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0 },
  { id: 'db_hip_thrust',       name: 'Hip Thrust DB',      nameVi: 'Hip thrust tạ (mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🍑', isCustom: false, usageCount: 0 },
  { id: 'db_arnold_press',     name: 'Arnold Press',       nameVi: 'Arnold press (vai)',    category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🌀', isCustom: false, usageCount: 0 },
  { id: 'db_upright_row',      name: 'Upright Row',        nameVi: 'Kéo tạ đứng (vai/thang)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔝', isCustom: false, usageCount: 0 },
  { id: 'db_reverse_fly',      name: 'Reverse Fly',        nameVi: 'Bay tạ ngược (vai sau)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔄', isCustom: false, usageCount: 0 },

  // Dumbbell Phase 7 — thêm bài tập tạ đơn tại nhà cho người mới
  { id: 'db_shrug',              name: 'Dumbbell Shrug',          nameVi: 'Nhún vai tạ (cơ thang)',         category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🤷', isCustom: false, usageCount: 0 },
  { id: 'db_wrist_curl',         name: 'Wrist Curl',              nameVi: 'Cuộn cổ tay (cẳng tay)',        category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🤚', isCustom: false, usageCount: 0 },
  { id: 'db_concentration_curl', name: 'Concentration Curl',      nameVi: 'Curl tập trung (bắp tay đỉnh)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🎯', isCustom: false, usageCount: 0 },
  { id: 'db_pullover',           name: 'Dumbbell Pullover',       nameVi: 'Kéo tạ sau đầu nằm (ngực/lưng)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🌊', isCustom: false, usageCount: 0 },
  { id: 'db_side_bend',          name: 'Dumbbell Side Bend',      nameVi: 'Nghiêng người tạ (hông/oblique)', category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '↗️', isCustom: false, usageCount: 0 },
  { id: 'db_incline_curl',       name: 'Incline Curl',            nameVi: 'Curl tạ ngồi nghiêng (đỉnh bắp)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '📐', isCustom: false, usageCount: 0 },
  { id: 'db_calf_raise_db',      name: 'Calf Raise (DB)',         nameVi: 'Kiễng gót tạ (bắp chân)',       category: 'dumbbell', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0 },
  { id: 'db_press_close',        name: 'Close Grip Chest Press',  nameVi: 'Đẩy tạ sát (ngực giữa)',        category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🤲', isCustom: false, usageCount: 0 },
  { id: 'db_zottman_curl',       name: 'Zottman Curl',            nameVi: 'Curl Zottman (bắp + cẳng tay)', category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🔁', isCustom: false, usageCount: 0 },
  { id: 'db_one_arm_press',      name: 'One Arm Shoulder Press',  nameVi: 'Đẩy tạ một tay (vai + core)',   category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '☝️', isCustom: false, usageCount: 0 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  core: 'Bụng & Core',
  cardio: 'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
  dumbbell: 'Tạ đơn',
};
