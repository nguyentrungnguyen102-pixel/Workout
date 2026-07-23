import { ExerciseEntry, ExerciseCategory, WorkoutLog } from '../types/workout';

// MET-based minutes & calorie estimation.
//
// Replaces the old flat guesses (reps exercise = 3 min flat, calories =
// minutes * 7) with a Metabolic Equivalent of Task (MET) model:
//   kcal/min = MET * 3.5 * weightKg / 200
// This is the standard ACSM MET-to-kcal formula (kcal/min = MET * 3.5 *
// bodyweightKg / 200, derived from 1 MET = 3.5 ml O2/kg/min and ~5 kcal per
// liter of O2).
//
// MET values below are drawn from (or reasonably approximated from):
// Ainsworth BE, et al. "2011 Compendium of Physical Activities: a second
// update of codes and MET values." Med Sci Sports Exerc. 2011.
// Where an exercise has no direct Compendium entry (e.g. our app-specific
// bodyweight/dumbbell move names), the closest general Compendium category
// code is used and marked `// TODO verify` — these are defensible
// commonly-cited approximations, not exact table lookups.

// Last-resort fallback bodyweight (kg) when the user has no recorded body
// metric at all. Approximate average adult weight for VN context; used only
// so calorie math doesn't divide-by-zero / return 0 for brand-new users.
export const DEFAULT_WEIGHT_KG = 62;

// Tempo assumption for reps-based exercises: ~3 seconds per rep (roughly 1s
// concentric + 2s eccentric), a standard training-tempo assumption commonly
// used in strength-coaching literature (e.g. "2-0-1" to "2-1-2" tempo
// schemes average out to ~3s/rep for general calisthenics).
// TODO verify against a specific published tempo standard.
export const SEC_PER_REP = 3;

// Brief inter-set rest folded into reps-based exercise duration. Short
// because bodyweight/circuit-style sets in this app are usually supersetted
// or lightly rested, unlike heavy barbell lifting (which rests 2-5 min).
// TODO verify — this is an app-level assumption, not a cited standard.
export const REST_SEC_PER_SET = 20;

// Assumed easy-jog pace (km/h) used only when a `km`-unit exercise has a
// distance but no recorded duration. TODO verify vs typical VN recreational
// runner pace.
const ASSUMED_PACE_KMH = 8;

export const ENERGY_METHOD_NOTE =
  'kcal theo MET × cân nặng (Compendium of Physical Activities 2011)';

// MET values keyed by WorkoutPreset id. Values are METs at rest-multiple
// (1 MET = sitting quietly).
export const MET_TABLE: Record<string, number> = {
  // Strength (bodyweight) — Source: Compendium of Physical Activities 2011
  pushup: 3.8, // Compendium code ~02100 "calisthenics, push-ups, vigorous effort" family
  pullup: 5.0, // TODO verify — approximated from vigorous calisthenics/resistance codes
  squat: 5.0, // TODO verify — approximated from vigorous calisthenics codes
  lunge: 4.0, // TODO verify
  burpee: 8.0, // Source: Compendium "calisthenics, vigorous effort (e.g., burpees)" ~8.0
  dip: 5.0, // TODO verify

  // Core / Bụng
  plank: 3.3, // Source: Compendium "calisthenics, moderate effort" ~3.3-3.8
  crunch: 3.8, // Source: Compendium "calisthenics, general, moderate effort"
  situp: 3.8, // Source: Compendium "calisthenics, general, moderate effort"
  leg_raise: 3.8, // TODO verify
  bicycle_crunch: 4.0, // TODO verify
  mountain_climber: 8.0, // TODO verify — treated as vigorous calisthenics
  russian_twist: 4.0, // TODO verify
  side_plank: 3.3, // TODO verify — same family as plank
  reverse_crunch: 3.8, // TODO verify
  v_up: 4.0, // TODO verify
  flutter_kick: 4.0, // TODO verify
  toe_touch: 3.0, // TODO verify
  ab_wheel: 5.0, // TODO verify — more strength-loaded than a basic crunch

  // Cardio — Source: Compendium of Physical Activities 2011 (running/cycling codes)
  running: 9.8, // flat fallback (~6 mph); see runningMet() for pace-scaled value
  cycling: 7.0, // Compendium "bicycling, leisure, moderate effort" ballpark
  jumping_jacks: 8.0, // Source: Compendium "calisthenics, vigorous effort"
  jump_rope: 12.3, // Source: Compendium "rope jumping, moderate pace" ~12.3

  // Mobility
  yoga: 2.5, // Source: Compendium "yoga, Hatha" ballpark
  stretching: 2.3, // Source: Compendium "stretching, mild"

  // Recovery
  walking: 3.5, // Source: Compendium "walking, moderate pace (~3 mph)"
  foam_rolling: 2.5, // TODO verify — approximated as light self-myofascial-release activity

  // Dumbbell (home training) — Source: Compendium "resistance training
  // (weight lifting), light/moderate effort" (~3.5) vs "vigorous effort"
  // (~6.0). Per-exercise split below is a TODO-verify approximation, not a
  // per-exercise Compendium code (Compendium does not break resistance
  // training out by individual movement).
  db_bicep_curl: 3.5, // TODO verify
  db_hammer_curl: 3.5, // TODO verify
  db_tricep_ext: 3.5, // TODO verify
  db_tricep_kick: 3.5, // TODO verify
  db_shoulder_press: 4.0, // TODO verify
  db_lateral_raise: 3.5, // TODO verify
  db_front_raise: 3.5, // TODO verify
  db_chest_press: 4.0, // TODO verify
  db_chest_fly: 4.0, // TODO verify
  db_bent_row: 4.0, // TODO verify
  db_single_arm_row: 4.0, // TODO verify
  db_goblet_squat: 5.0, // TODO verify — compound lower-body move
  db_lunge: 4.5, // TODO verify
  db_sumo_squat: 5.0, // TODO verify
  db_rdl: 5.0, // TODO verify
  db_deadlift: 6.0, // TODO verify — heaviest compound lift in the list
  db_hip_thrust: 5.0, // TODO verify
  db_arnold_press: 4.0, // TODO verify
  db_upright_row: 4.0, // TODO verify
  db_reverse_fly: 3.5, // TODO verify

  // Dumbbell (home training) — Phase 9
  db_farmers_carry: 4.5, // TODO verify — loaded carry, similar family to walking with load
  db_renegade_row: 5.0, // TODO verify — plank hold + row, more demanding than a standing row
  db_pullover: 4.0, // TODO verify
  db_concentration_curl: 3.5, // TODO verify
  db_step_up: 5.0, // TODO verify — Compendium "step training" ballpark
  db_thruster: 6.0, // TODO verify — compound squat+press, treated like db_deadlift

  // Sport (outdoor/team sports) — TODO verify against Compendium sport codes
  sport_football: 7.0, // soccer, casual/competitive
  sport_swimming: 6.0, // laps, moderate effort
  sport_golf: 4.5, // walking course, carrying clubs
  sport_volleyball: 4.0, // recreational/non-competitive
  sport_basketball: 6.5, // playing a game, general
};

// Category-level fallback MET for any presetId not in MET_TABLE (e.g.
// user-created custom exercises). Broad approximations per Compendium
// category groupings — TODO verify per-category if custom exercises become
// common enough to matter.
export const CATEGORY_MET: Record<ExerciseCategory, number> = {
  strength: 5,
  core: 3.8,
  cardio: 8,
  mobility: 2.5,
  recovery: 3,
  dumbbell: 5,
  sport: 6,
};

// Running MET scales with pace when both distance (km) and duration are
// known; otherwise falls back to the flat MET_TABLE.running value.
// Source: Compendium of Physical Activities 2011 running codes (~12020-12050).
// TODO verify exact pace thresholds/METs against the Compendium's running
// entries (5/6/7/8/9 mph) — these are commonly-cited approximations.
function runningMet(ex: ExerciseEntry): number {
  if (ex.distance && ex.durationSeconds) {
    const kmh = ex.distance / (ex.durationSeconds / 3600);
    if (kmh < 8) return 8.3; // ~5 mph jog
    if (kmh < 9.7) return 9.8; // ~6 mph
    if (kmh < 11.3) return 11.0; // ~7 mph
    if (kmh < 12.9) return 11.8; // ~8 mph
    return 12.8; // ~9 mph+
  }
  return MET_TABLE.running;
}

export function metForExercise(ex: ExerciseEntry): number {
  if (ex.presetId === 'running') return runningMet(ex);
  const fromTable = MET_TABLE[ex.presetId];
  if (fromTable !== undefined) return fromTable;
  return CATEGORY_MET[ex.category] ?? CATEGORY_MET.strength;
}

// Minutes spent on one exercise entry.
//   - timed (minutes/seconds unit): durationSeconds / 60
//   - distance (km unit): durationSeconds/60 if recorded, else estimated
//     from distance at an assumed easy pace
//   - reps: sets * reps * SEC_PER_REP / 60, plus a small inter-set rest
// A 1-minute floor per exercise avoids near-zero durations from very light
// entries (e.g. a single set of a couple reps) dominating a workout's
// per-category breakdown.
export function exerciseMinutes(ex: ExerciseEntry): number {
  if (ex.unit === 'minutes' || ex.unit === 'seconds') {
    const mins = (ex.durationSeconds || 0) / 60;
    return Math.max(1, mins);
  }

  if (ex.unit === 'km') {
    if (ex.durationSeconds) return Math.max(1, ex.durationSeconds / 60);
    if (ex.distance) return Math.max(1, (ex.distance / ASSUMED_PACE_KMH) * 60);
    return 1;
  }

  // reps
  const sets = ex.sets || 1;
  const reps = ex.reps || 0;
  const activeSec = sets * reps * SEC_PER_REP;
  const restSec = Math.max(0, sets - 1) * REST_SEC_PER_SET;
  return Math.max(1, (activeSec + restSec) / 60);
}

export function exerciseKcal(ex: ExerciseEntry, weightKg: number): number {
  const met = metForExercise(ex);
  const minutes = exerciseMinutes(ex);
  const w = weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  return (met * 3.5 * w) / 200 * minutes;
}

// Total minutes for a whole logged workout. Back-compat: if the log already
// has a positive totalDurationMinutes (written at log time, possibly by an
// older version of logWorkout), that value is trusted rather than
// recomputed — mirrors the behavior of the older estimateLogMinutes().
export function logMinutes(log: WorkoutLog): number {
  if (typeof log.totalDurationMinutes === 'number' && log.totalDurationMinutes > 0) {
    return log.totalDurationMinutes;
  }
  const exercises = log.exercises || [];
  if (exercises.length === 0) return 0;
  return Math.max(1, Math.round(exercises.reduce((sum, e) => sum + exerciseMinutes(e), 0)));
}

// Total calories for a whole logged workout. If the caller has no known
// weight for the user (weightKg <= 0) and the log already carries a
// previously-computed caloriesEstimate, that historical estimate is trusted
// rather than silently recomputed against DEFAULT_WEIGHT_KG — avoids
// quietly rewriting old logs' numbers when just displaying them.
export function logKcal(log: WorkoutLog, weightKg: number): number {
  if (weightKg <= 0 && typeof log.caloriesEstimate === 'number' && log.caloriesEstimate > 0) {
    return log.caloriesEstimate;
  }
  const exercises = log.exercises || [];
  return Math.round(exercises.reduce((sum, e) => sum + exerciseKcal(e, weightKg), 0));
}
