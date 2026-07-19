// Self-authored line-icon set for exercises — no external assets/licensing.
// Visual language matches lucide-react: 24x24 viewBox, currentColor stroke,
// no fill, rounded caps/joins. Each glyph is intentionally a handful of
// strokes (simple stick-figure / equipment pictograms) — clarity over detail.
// Glyphs are grouped by movement pattern and reused across similar presets
// (e.g. every dumbbell curl variant shares gDbCurl) rather than hand-drawn
// per preset id.

const gDumbbell = (
  <>
    <circle cx="4.5" cy="12" r="2" />
    <circle cx="19.5" cy="12" r="2" />
    <line x1="6.4" y1="12" x2="17.6" y2="12" />
    <line x1="2.5" y1="9.7" x2="2.5" y2="14.3" />
    <line x1="21.5" y1="9.7" x2="21.5" y2="14.3" />
  </>
);

const gPushup = (
  <>
    <circle cx="5" cy="8" r="1.6" />
    <path d="M6.2 9 L19 13" />
    <path d="M9 10 L7.5 16" />
    <path d="M15 11.5 L14 17" />
    <path d="M19 13 L21 15.5" />
  </>
);

const gDip = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M8 4 L8 15" />
    <path d="M16 4 L16 15" />
    <path d="M12 6 L12 8 L8 8" />
    <path d="M12 8 L16 8" />
    <path d="M12 8 L10 18" />
    <path d="M12 8 L14 18" />
  </>
);

const gPullup = (
  <>
    <line x1="6" y1="4" x2="18" y2="4" />
    <circle cx="12" cy="7.5" r="1.6" />
    <path d="M9 4.5 L12 9" />
    <path d="M15 4.5 L12 9" />
    <path d="M12 9 L12 15" />
    <path d="M12 15 L9.5 20" />
    <path d="M12 15 L14.5 20" />
  </>
);

const gSquat = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L12 11" />
    <path d="M12 11 L8 9" />
    <path d="M12 11 L16 9" />
    <path d="M12 11 L9 15" />
    <path d="M9 15 L9 19" />
    <path d="M12 11 L15 15" />
    <path d="M15 15 L15 19" />
  </>
);

const gLunge = (
  <>
    <circle cx="9" cy="4.5" r="1.6" />
    <path d="M9 6 L11 12" />
    <path d="M11 12 L7 16 L5 19" />
    <path d="M11 12 L17 14 L19 19" />
    <path d="M9 7.5 L6 9" />
    <path d="M9 7.5 L13 6" />
  </>
);

const gBurpee = (
  <>
    <circle cx="12" cy="4" r="1.6" />
    <path d="M12 5.5 L12 12" />
    <path d="M12 7 L8 4" />
    <path d="M12 7 L16 4" />
    <path d="M12 12 L8 17" />
    <path d="M12 12 L16 17" />
  </>
);

const gPlank = (
  <>
    <circle cx="4.5" cy="9" r="1.5" />
    <path d="M5.7 10 L19 10" />
    <path d="M8 10.5 L8 15" />
    <path d="M19 10 L21 13" />
  </>
);

const gSidePlank = (
  <>
    <circle cx="5" cy="9" r="1.5" />
    <path d="M6.2 10 L18 13" />
    <path d="M9 10.5 L9 15.5" />
    <path d="M13 11.5 L15 6" />
    <path d="M18 13 L20 16" />
  </>
);

const gCrunch = (
  <>
    <circle cx="7" cy="9" r="1.5" />
    <path d="M8 10 L13 12 L13 16 L17 16" />
    <path d="M13 12 L17 10" />
  </>
);

const gVUp = (
  <>
    <circle cx="8" cy="8" r="1.5" />
    <path d="M9 9 L14 15 L19 9" />
    <path d="M9 9 L5 6" />
  </>
);

const gLegRaise = (
  <>
    <circle cx="3" cy="16" r="1.5" />
    <path d="M4.5 16 L14 16" />
    <path d="M14 16 L19 8" />
    <path d="M14 16 L18 11" />
  </>
);

const gTwist = (
  <>
    <circle cx="12" cy="5" r="1.5" />
    <path d="M12 6.5 L12 12" />
    <path d="M12 12 L8 15" />
    <path d="M12 12 L16 15" />
    <path d="M12 8 L17 6" />
    <path d="M12 8 L7 10" />
  </>
);

const gMountainClimber = (
  <>
    <circle cx="5" cy="9" r="1.5" />
    <path d="M6.2 10 L18 10" />
    <path d="M8 10.5 L8 15" />
    <path d="M18 10 L14 14 L14 17" />
  </>
);

const gAbWheel = (
  <>
    <circle cx="12" cy="14" r="4" />
    <circle cx="12" cy="14" r="1" />
    <line x1="8.5" y1="11.5" x2="4" y2="8" />
    <line x1="15.5" y1="11.5" x2="20" y2="8" />
  </>
);

const gRunning = (
  <>
    <circle cx="15" cy="5" r="1.6" />
    <path d="M15 6.5 L12 12 L15 16 L13 21" />
    <path d="M12 12 L8 10" />
    <path d="M15 16 L19 18" />
    <path d="M13 9 L17 8" />
  </>
);

const gCycling = (
  <>
    <circle cx="6" cy="17" r="3" />
    <circle cx="18" cy="17" r="3" />
    <path d="M6 17 L11 9 L18 17" />
    <path d="M11 9 L9 17" />
    <path d="M11 9 L14 9" />
    <circle cx="14" cy="6" r="1.5" />
  </>
);

const gJumpingJacks = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L12 14" />
    <path d="M12 8 L6 4" />
    <path d="M12 8 L18 4" />
    <path d="M12 14 L6 20" />
    <path d="M12 14 L18 20" />
  </>
);

const gJumpRope = (
  <>
    <circle cx="12" cy="8" r="1.6" />
    <path d="M12 9.5 L12 15" />
    <path d="M12 15 L9 20" />
    <path d="M12 15 L15 20" />
    <path d="M8 11 L10 8" />
    <path d="M16 11 L14 8" />
    <path d="M7 5 C9 1, 15 1, 17 5" />
  </>
);

const gYoga = (
  <>
    <circle cx="12" cy="6" r="1.6" />
    <path d="M12 7.5 L12 12" />
    <path d="M12 12 L7 15 L11 14" />
    <path d="M12 12 L17 15 L13 14" />
    <path d="M12 8.5 L8 11" />
    <path d="M12 8.5 L16 11" />
  </>
);

const gStretching = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L12 15" />
    <path d="M12 8 L7 4" />
    <path d="M12 8 L17 12" />
    <path d="M12 15 L9 20" />
    <path d="M12 15 L15 20" />
  </>
);

const gWalking = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L11 12" />
    <path d="M11 12 L8 18" />
    <path d="M11 12 L15 17" />
    <path d="M12 8 L9 10" />
    <path d="M12 8 L16 9" />
  </>
);

const gFoamRolling = (
  <>
    <rect x="4" y="9" width="16" height="6" rx="3" />
    <line x1="8" y1="9" x2="8" y2="15" />
    <line x1="12" y1="9" x2="12" y2="15" />
    <line x1="16" y1="9" x2="16" y2="15" />
  </>
);

// -- Dumbbell (home training) movement groups --

const gDbCurl = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L12 13" />
    <path d="M12 8 L9 11 L9 7.5" />
    <line x1="7.5" y1="7.5" x2="10.5" y2="7.5" />
    <circle cx="7.3" cy="7.5" r="0.9" />
    <circle cx="10.7" cy="7.5" r="0.9" />
    <path d="M12 13 L9.5 19" />
    <path d="M12 13 L14.5 19" />
  </>
);

const gDbTricep = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L12 13" />
    <path d="M12 7.5 L16 6 L16 10" />
    <line x1="14.5" y1="10" x2="17.5" y2="10" />
    <circle cx="14.5" cy="10" r="0.9" />
    <circle cx="17.5" cy="10" r="0.9" />
    <path d="M12 13 L9.5 19" />
    <path d="M12 13 L14.5 19" />
  </>
);

const gDbOverheadPress = (
  <>
    <circle cx="12" cy="5" r="1.6" />
    <path d="M12 6.5 L12 14" />
    <path d="M12 8 L8 3" />
    <path d="M12 8 L16 3" />
    <line x1="6.5" y1="3" x2="9.5" y2="3" />
    <circle cx="6.3" cy="3" r="0.9" />
    <circle cx="9.7" cy="3" r="0.9" />
    <line x1="14.5" y1="3" x2="17.5" y2="3" />
    <circle cx="14.3" cy="3" r="0.9" />
    <circle cx="17.7" cy="3" r="0.9" />
    <path d="M12 14 L9.5 20" />
    <path d="M12 14 L14.5 20" />
  </>
);

const gDbLateral = (
  <>
    <circle cx="12" cy="4.5" r="1.6" />
    <path d="M12 6 L12 14" />
    <path d="M12 8 L5 8" />
    <path d="M12 8 L19 8" />
    <circle cx="4" cy="8" r="1" />
    <circle cx="20" cy="8" r="1" />
    <path d="M12 14 L9.5 20" />
    <path d="M12 14 L14.5 20" />
  </>
);

const gDbChestPress = (
  <>
    <path d="M3 16 L21 16" />
    <circle cx="6" cy="12" r="1.6" />
    <path d="M6 13.5 L6 16" />
    <line x1="10" y1="9" x2="10" y2="13" />
    <circle cx="10" cy="8" r="1" />
    <circle cx="10" cy="14" r="1" />
    <line x1="15" y1="9" x2="15" y2="13" />
    <circle cx="15" cy="8" r="1" />
    <circle cx="15" cy="14" r="1" />
  </>
);

const gDbRow = (
  <>
    <circle cx="6" cy="6" r="1.6" />
    <path d="M6.5 7.5 L14 12" />
    <path d="M14 12 L18 15" />
    <path d="M14 12 L20 11" />
    <line x1="18.5" y1="9.5" x2="18.5" y2="12.5" />
    <circle cx="18.5" cy="9" r="1" />
    <circle cx="18.5" cy="13" r="1" />
    <path d="M14 12 L11 18" />
    <path d="M14 12 L16 18" />
  </>
);

const gDbHinge = (
  <>
    <circle cx="7" cy="6" r="1.6" />
    <path d="M7.5 7.5 L15 11" />
    <path d="M15 11 L20 10" />
    <path d="M15 11 L12 17" />
    <path d="M15 11 L17 17" />
    <line x1="18.5" y1="8.5" x2="18.5" y2="11.5" />
    <circle cx="18.5" cy="8" r="1" />
    <circle cx="18.5" cy="12" r="1" />
  </>
);

// -- Preset id -> glyph map (every SYSTEM_PRESETS id is listed explicitly) --
const PRESET_ICON: Record<string, JSX.Element> = {
  // Strength (bodyweight)
  pushup: gPushup,
  pullup: gPullup,
  squat: gSquat,
  lunge: gLunge,
  burpee: gBurpee,
  dip: gDip,

  // Core / Bụng
  plank: gPlank,
  crunch: gCrunch,
  situp: gCrunch,
  leg_raise: gLegRaise,
  bicycle_crunch: gTwist,
  mountain_climber: gMountainClimber,
  russian_twist: gTwist,
  side_plank: gSidePlank,
  reverse_crunch: gCrunch,
  v_up: gVUp,
  flutter_kick: gLegRaise,
  toe_touch: gCrunch,
  ab_wheel: gAbWheel,

  // Cardio
  running: gRunning,
  cycling: gCycling,
  jumping_jacks: gJumpingJacks,
  jump_rope: gJumpRope,

  // Mobility
  yoga: gYoga,
  stretching: gStretching,

  // Recovery
  walking: gWalking,
  foam_rolling: gFoamRolling,

  // Dumbbell (home training)
  db_bicep_curl: gDbCurl,
  db_hammer_curl: gDbCurl,
  db_tricep_ext: gDbTricep,
  db_tricep_kick: gDbTricep,
  db_shoulder_press: gDbOverheadPress,
  db_lateral_raise: gDbLateral,
  db_front_raise: gDbLateral,
  db_chest_press: gDbChestPress,
  db_chest_fly: gDbChestPress,
  db_bent_row: gDbRow,
  db_single_arm_row: gDbRow,
  db_goblet_squat: gSquat,
  db_lunge: gLunge,
  db_sumo_squat: gSquat,
  db_rdl: gDbHinge,
  db_deadlift: gDbHinge,
  db_hip_thrust: gDbHinge,
  db_arnold_press: gDbOverheadPress,
  db_upright_row: gDbLateral,
  db_reverse_fly: gDbLateral,
};

// Category fallback — used for custom exercises (or any id not in the map above).
const CATEGORY_ICON: Record<string, JSX.Element> = {
  strength: gPushup,
  core: gCrunch,
  cardio: gRunning,
  mobility: gYoga,
  recovery: gWalking,
  dumbbell: gDbCurl,
};

interface ExerciseIconProps {
  presetId: string;
  category?: string;
  size?: number;
  className?: string;
}

export default function ExerciseIcon({ presetId, category, size = 24, className }: ExerciseIconProps) {
  const content = PRESET_ICON[presetId] ?? (category ? CATEGORY_ICON[category] : undefined) ?? gDumbbell;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
