import { MuscleGroupSlug } from '../logic/muscleGroups';

/**
 * Bundled exercise library. Seeded into SQLite on schema v2 migration so the
 * app has a usable workout catalog with zero network. Wger fetches *augment*
 * this set — they never replace it.
 *
 * IDs use the `seed:<slug>` namespace; the adapter uses `wger:<id>`. Both
 * live in the same `exercises` table, keyed by id.
 */

export interface SeedExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroupSlug;
  description: string;
}

export const SEED_EXERCISES: ReadonlyArray<SeedExercise> = [
  // Chest
  { id: 'seed:bench-press', name: 'Barbell Bench Press', muscleGroup: 'chest',
    description: 'Lie flat, grip slightly wider than shoulders. Lower bar to mid-chest with control. Drive up without flaring elbows past 75°.' },
  { id: 'seed:incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'chest',
    description: 'Bench at 30°. Keep wrists stacked over elbows. Press up and slightly inward. Squeeze at the top.' },
  { id: 'seed:pushup', name: 'Push-Up', muscleGroup: 'chest',
    description: 'Hands under shoulders, body in a straight line. Lower until chest nearly touches floor. Push through the palms.' },
  { id: 'seed:cable-fly', name: 'Cable Chest Fly', muscleGroup: 'chest',
    description: 'High pulleys, slight forward step. Soft elbows, sweep down and across. Pause at full contraction.' },

  // Back
  { id: 'seed:deadlift', name: 'Conventional Deadlift', muscleGroup: 'back',
    description: 'Bar over mid-foot. Hinge with neutral spine, lats engaged. Drive the floor away. Lock out hips and knees together.' },
  { id: 'seed:pullup', name: 'Pull-Up', muscleGroup: 'back',
    description: 'Hang with arms fully extended. Pull elbows down and back until chin clears the bar. Avoid kipping.' },
  { id: 'seed:bent-row', name: 'Barbell Bent-Over Row', muscleGroup: 'back',
    description: 'Hinge to ~45°, flat back. Pull bar to lower ribs. Squeeze shoulder blades. Lower under control.' },
  { id: 'seed:lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back',
    description: 'Grip just outside shoulders. Pull bar to upper chest leading with elbows. Resist on the way up.' },

  // Shoulders
  { id: 'seed:ohp', name: 'Overhead Press', muscleGroup: 'shoulders',
    description: 'Bar on front delts, elbows slightly ahead. Press up while moving head through. Lock out overhead, ribs down.' },
  { id: 'seed:lateral-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'shoulders',
    description: 'Slight bend in elbows. Lead with the pinky. Stop at shoulder height. Lower slowly — no swinging.' },
  { id: 'seed:face-pull', name: 'Face Pull', muscleGroup: 'shoulders',
    description: 'Rope at face height. Pull toward forehead, externally rotating. Drives rear delts and rotator cuff.' },

  // Biceps
  { id: 'seed:db-curl', name: 'Dumbbell Curl', muscleGroup: 'biceps',
    description: 'Elbows pinned. Curl with supinated grip. Squeeze at top, lower slowly to full extension.' },
  { id: 'seed:hammer-curl', name: 'Hammer Curl', muscleGroup: 'biceps',
    description: 'Neutral grip throughout. Targets brachialis and forearms alongside biceps.' },
  { id: 'seed:preacher-curl', name: 'Preacher Curl', muscleGroup: 'biceps',
    description: 'Triceps pressed into pad. Curl through full range. Avoid swinging at the top.' },

  // Triceps
  { id: 'seed:tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps',
    description: 'Elbows pinned to ribs. Extend fully, brief hold, return slowly.' },
  { id: 'seed:skullcrusher', name: 'Lying Tricep Extension', muscleGroup: 'triceps',
    description: 'Bar above forehead. Hinge at elbows only. Lower toward forehead, extend fully without flaring.' },
  { id: 'seed:close-bench', name: 'Close-Grip Bench Press', muscleGroup: 'triceps',
    description: 'Shoulder-width grip. Tuck elbows. Strong tricep emphasis with chest assistance.' },

  // Legs
  { id: 'seed:back-squat', name: 'Back Squat', muscleGroup: 'legs',
    description: 'Bar on traps, feet shoulder-width. Brace, sit between hips, knees track over toes. Drive through mid-foot.' },
  { id: 'seed:rdl', name: 'Romanian Deadlift', muscleGroup: 'legs',
    description: 'Soft knees, hinge from hips. Bar slides down thighs. Stretch the hamstrings, drive hips forward to stand.' },
  { id: 'seed:lunge', name: 'Walking Lunge', muscleGroup: 'legs',
    description: 'Long step, drop back knee toward floor. Push off front heel. Alternate legs each step.' },
  { id: 'seed:leg-press', name: 'Leg Press', muscleGroup: 'legs',
    description: 'Feet shoulder-width on platform. Lower until knees ~90°. Press through whole foot, do not lock out.' },
  { id: 'seed:calf-raise', name: 'Standing Calf Raise', muscleGroup: 'legs',
    description: 'Rise onto balls of feet, full stretch at the bottom, hold the contraction at the top.' },

  // Cardio
  { id: 'seed:treadmill-incline', name: 'Incline Treadmill Walk', muscleGroup: 'cardio',
    description: '10–15° incline at brisk walking pace. Low impact, sustainable Zone 2 work.' },
  { id: 'seed:rowing', name: 'Rowing Machine', muscleGroup: 'cardio',
    description: 'Drive with legs first, then hinge back, then pull arms. Reverse on the recovery. Steady stroke rate ~22–26 spm.' },
  { id: 'seed:jumping-jacks', name: 'Jumping Jacks', muscleGroup: 'cardio',
    description: 'Full-body warm-up. 60 seconds on, 30 seconds off, repeat 5 rounds.' },
  { id: 'seed:burpee', name: 'Burpee', muscleGroup: 'cardio',
    description: 'Squat, kick back to plank, push-up, jump feet in, jump up. High intensity.' },
];
