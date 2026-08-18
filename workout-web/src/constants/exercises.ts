import { WorkoutPreset } from '../types/workout';

export const SYSTEM_PRESETS: WorkoutPreset[] = [
  // Strength (bodyweight)
  { id: 'pushup', name: 'Push Up', nameVi: 'Hít đất', category: 'strength', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0, muscleGroup: 'chest' },
  { id: 'pullup', name: 'Pull Up', nameVi: 'Kéo xà', category: 'strength', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🤸', isCustom: false, usageCount: 0, muscleGroup: 'back' },
  { id: 'squat', name: 'Squat', nameVi: 'Squat', category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'lunge', name: 'Lunge', nameVi: 'Lunge', category: 'strength', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'burpee', name: 'Burpee', nameVi: 'Burpee', category: 'strength', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🔥', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'dip', name: 'Dip', nameVi: 'Chống đẩy ghế', category: 'strength', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '💺', isCustom: false, usageCount: 0, muscleGroup: 'arms' },

  // Core / Bụng
  { id: 'plank', name: 'Plank', nameVi: 'Plank', category: 'core', unit: 'seconds', defaultValue: 60, defaultSets: 3, icon: '🧘', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'crunch', name: 'Crunch', nameVi: 'Gập bụng', category: 'core', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🔥', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'situp', name: 'Sit Up', nameVi: 'Ngồi dậy', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '⬆️', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'leg_raise', name: 'Leg Raise', nameVi: 'Nâng chân thẳng', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'bicycle_crunch', name: 'Bicycle Crunch', nameVi: 'Đạp xe bụng', category: 'core', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🚴', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'mountain_climber', name: 'Mountain Climber', nameVi: 'Leo núi', category: 'core', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '⛰️', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'russian_twist', name: 'Russian Twist', nameVi: 'Xoay hông', category: 'core', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🔄', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'side_plank', name: 'Side Plank', nameVi: 'Plank nghiêng', category: 'core', unit: 'seconds', defaultValue: 30, defaultSets: 2, icon: '↔️', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'reverse_crunch', name: 'Reverse Crunch', nameVi: 'Gập bụng ngược', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'v_up', name: 'V-Up', nameVi: 'Gập bụng chữ V', category: 'core', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '✌️', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'flutter_kick', name: 'Flutter Kick', nameVi: 'Đá chân bơi', category: 'core', unit: 'reps', defaultValue: 30, defaultSets: 3, icon: '🏊', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'toe_touch', name: 'Toe Touch', nameVi: 'Tay chạm chân', category: 'core', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦶', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'ab_wheel', name: 'Ab Wheel Rollout', nameVi: 'Con lăn bụng', category: 'core', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '☸️', isCustom: false, usageCount: 0, muscleGroup: 'core' },

  // Cardio — không nhắm 1 nhóm cơ cụ thể (toàn thân/tim mạch)
  { id: 'running', name: 'Running', nameVi: 'Chạy bộ', category: 'cardio', unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🏃', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'cycling', name: 'Cycling', nameVi: 'Đạp xe', category: 'cardio', unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🚴', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'jumping_jacks', name: 'Jumping Jacks', nameVi: 'Bật nhảy', category: 'cardio', unit: 'reps', defaultValue: 50, defaultSets: 3, icon: '⭐', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'jump_rope', name: 'Jump Rope', nameVi: 'Nhảy dây', category: 'cardio', unit: 'minutes', defaultValue: 10, defaultSets: 1, icon: '🪢', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },

  // Mobility — toàn thân
  { id: 'yoga', name: 'Yoga', nameVi: 'Yoga', category: 'mobility', unit: 'minutes', defaultValue: 20, defaultSets: 1, icon: '🧘', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'stretching', name: 'Stretching', nameVi: 'Giãn cơ', category: 'mobility', unit: 'minutes', defaultValue: 15, defaultSets: 1, icon: '🌅', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },

  // Recovery — toàn thân
  { id: 'walking', name: 'Walking', nameVi: 'Đi bộ', category: 'recovery', unit: 'minutes', defaultValue: 30, defaultSets: 1, icon: '🚶', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'foam_rolling', name: 'Foam Rolling', nameVi: 'Lăn cơ', category: 'recovery', unit: 'minutes', defaultValue: 10, defaultSets: 1, icon: '🧻', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },

  // Dumbbell (home training) — Phase 5
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
  { id: 'db_goblet_squat',     name: 'Goblet Squat',       nameVi: 'Squat ôm tạ (đùi)',    category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏆', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_lunge',            name: 'Dumbbell Lunge',     nameVi: 'Lunge tạ (đùi mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_sumo_squat',       name: 'Sumo Squat',         nameVi: 'Squat sumo tạ (mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_rdl',              name: 'Romanian Deadlift',  nameVi: 'Deadlift tạ Romania (sau đùi)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🏗️', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_deadlift',         name: 'Dumbbell Deadlift',  nameVi: 'Deadlift tạ đôi (toàn thân)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '⬇️', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'db_hip_thrust',       name: 'Hip Thrust DB',      nameVi: 'Hip thrust tạ (mông)',  category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🍑', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_arnold_press',     name: 'Arnold Press',       nameVi: 'Arnold press (vai)',    category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🌀', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_upright_row',      name: 'Upright Row',        nameVi: 'Kéo tạ đứng (vai/thang)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔝', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_reverse_fly',      name: 'Reverse Fly',        nameVi: 'Bay tạ ngược (vai sau)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔄', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },

  // Dumbbell (home training) — Phase 9, bổ sung thêm bài tạ đơn giản tại nhà
  { id: 'db_farmers_carry',    name: "Farmer's Carry",     nameVi: 'Đi bộ mang tạ (toàn thân/cầm nắm)', category: 'dumbbell', unit: 'seconds', defaultValue: 40, defaultSets: 3, icon: '🚶', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'db_renegade_row',     name: 'Renegade Row',       nameVi: 'Chèo tạ plank (lưng + core)', category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🧗', isCustom: false, usageCount: 0, muscleGroup: 'back' },
  { id: 'db_pullover',         name: 'Dumbbell Pullover',  nameVi: 'Kéo tạ qua đầu (ngực/xô)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🔃', isCustom: false, usageCount: 0, muscleGroup: 'back' },
  { id: 'db_concentration_curl', name: 'Concentration Curl', nameVi: 'Curl tập trung (bắp tay)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💪', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_step_up',          name: 'Dumbbell Step Up',   nameVi: 'Bước lên bục có tạ (đùi mông)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🪜', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_thruster',         name: 'Dumbbell Thruster',  nameVi: 'Thruster tạ (toàn thân)', category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🚀', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },

  // Dumbbell (home training) — Phase 11, bổ sung nhóm cơ còn thiếu (bắp chân/
  // cẳng tay/tay sau nằm/eo) + 2 bài thăng bằng cho chương trình trung cấp
  { id: 'db_calf_raise',       name: 'Calf Raise',         nameVi: 'Nâng gót tạ (bắp chân)', category: 'dumbbell', unit: 'reps', defaultValue: 20, defaultSets: 3, icon: '🦶', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_skull_crusher',    name: 'Skull Crusher',      nameVi: 'Ép tạ nằm (tay sau)',    category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '💀', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_wrist_curl',       name: 'Wrist Curl',         nameVi: 'Gập cổ tay tạ (cẳng tay)', category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '✊', isCustom: false, usageCount: 0, muscleGroup: 'arms' },
  { id: 'db_side_bend',        name: 'Side Bend',          nameVi: 'Nghiêng hông tạ (eo)',   category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '〰️', isCustom: false, usageCount: 0, muscleGroup: 'core' },
  { id: 'db_curtsy_lunge',     name: 'Curtsy Lunge',       nameVi: 'Lunge chéo tạ (đùi trong/mông)', category: 'dumbbell', unit: 'reps', defaultValue: 12, defaultSets: 3, icon: '🦵', isCustom: false, usageCount: 0, muscleGroup: 'legs' },
  { id: 'db_single_leg_deadlift', name: 'Single Leg Deadlift', nameVi: 'Deadlift một chân tạ (thăng bằng/mông)', category: 'dumbbell', unit: 'reps', defaultValue: 10, defaultSets: 3, icon: '🧍', isCustom: false, usageCount: 0, muscleGroup: 'legs' },

  // Dumbbell (home training) — Phase 14, bài siêu đơn giản cho người mới
  // hoàn toàn chưa từng cầm tạ (kỹ thuật dễ, ít rủi ro sai form)
  { id: 'db_shrug',            name: 'Dumbbell Shrug',     nameVi: 'Nhún vai tạ (cầu vai)', category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🤷', isCustom: false, usageCount: 0, muscleGroup: 'shoulders' },
  { id: 'db_squat',            name: 'Dumbbell Squat',     nameVi: 'Squat tạ hai bên (đùi, dễ hơn ôm tạ)', category: 'dumbbell', unit: 'reps', defaultValue: 15, defaultSets: 3, icon: '🏋️', isCustom: false, usageCount: 0, muscleGroup: 'legs' },

  // Sport (outdoor/team sports) — tracked separately from indoor cardio so
  // "sport frequency" stats/PRs/charts don't blend with treadmill running,
  // jump rope etc. Existing running/cycling stay in cardio (unchanged) —
  // location is a session-level field so those two are taggable too.
  { id: 'sport_football',   name: 'Football',   nameVi: 'Bóng đá',    category: 'sport', unit: 'minutes', defaultValue: 60,  defaultSets: 1, icon: '⚽', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'sport_swimming',   name: 'Swimming',    nameVi: 'Bơi',        category: 'sport', unit: 'minutes', defaultValue: 30,  defaultSets: 1, icon: '🏊', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'sport_golf',       name: 'Golf',        nameVi: 'Golf',       category: 'sport', unit: 'minutes', defaultValue: 120, defaultSets: 1, icon: '⛳', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'sport_volleyball', name: 'Volleyball',  nameVi: 'Bóng chuyền',category: 'sport', unit: 'minutes', defaultValue: 60,  defaultSets: 1, icon: '🏐', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
  { id: 'sport_basketball', name: 'Basketball',  nameVi: 'Bóng rổ',    category: 'sport', unit: 'minutes', defaultValue: 60,  defaultSets: 1, icon: '🏀', isCustom: false, usageCount: 0, muscleGroup: 'fullBody' },
];

// Vietnamese labels + lookup for the "Cân bằng nhóm cơ" chart (Đợt 3) — an
// anatomical grouping, distinct from CATEGORY_LABELS (equipment/discipline).
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Ngực',
  back: 'Lưng',
  shoulders: 'Vai',
  arms: 'Tay',
  legs: 'Chân',
  core: 'Bụng',
  fullBody: 'Toàn thân',
};

export const MUSCLE_GROUP_KEYS = Object.keys(MUSCLE_GROUP_LABELS);

// presetId -> muscleGroup, built from SYSTEM_PRESETS so callers (the chart,
// tests) don't need to search the array themselves. Custom (user-created)
// presets aren't in this map — callers should fall back to 'fullBody'.
export const PRESET_MUSCLE_GROUP: Record<string, string> = Object.fromEntries(
  SYSTEM_PRESETS.filter((p) => p.muscleGroup).map((p) => [p.id, p.muscleGroup as string])
);

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh',
  core: 'Bụng & Core',
  cardio: 'Cardio',
  mobility: 'Linh hoạt',
  recovery: 'Phục hồi',
  dumbbell: 'Tạ đơn',
  sport: 'Thể thao',
};

// Shared per-category hex colors for charts/stats (v2.11.0) — matches the
// values StatsPage.tsx already used locally for its category breakdown bars,
// centralized here so chart components (src/components/charts/*) can reuse
// them without importing from a page module.
export const CATEGORY_COLORS_STATS: Record<string, string> = {
  strength: '#FF5400', core: '#BE185D', cardio: '#2563EB', mobility: '#059669', recovery: '#7C3AED', dumbbell: '#D97706', sport: '#CA8A04',
};
