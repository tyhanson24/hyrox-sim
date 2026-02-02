-- ══════════════════════════════════════════
-- HYROX SIM — Workout Seed Data
-- Run this in Supabase SQL Editor AFTER schema.sql
-- 28 real Hyrox-relevant workouts
-- ══════════════════════════════════════════

-- ── HYROX SIMULATIONS ──

INSERT INTO workouts (title, description, category, difficulty, duration_minutes, equipment, stations) VALUES
('Full Hyrox Simulation', 'Complete all 8 stations with 1km runs between each. The gold standard for race preparation.', 'hyrox_sim', 'advanced', 90, ARRAY['SkiErg','Rower','Sled','Sandbag','Wall Ball','Kettlebells'], '[
  {"name":"Run 1","distance":"1km","notes":"Start at comfortable pace, save energy"},
  {"name":"SkiErg","distance":"1000m","notes":"Long pulls, breathe on the recovery"},
  {"name":"Run 2","distance":"1km","notes":"Settle back into rhythm"},
  {"name":"Sled Push","distance":"50m","notes":"Stay low, short steps, drive through legs"},
  {"name":"Run 3","distance":"1km","notes":"Shake out the legs"},
  {"name":"Sled Pull","distance":"50m","notes":"Sit back, hand over hand, stay steady"},
  {"name":"Run 4","distance":"1km","notes":"Focus on form"},
  {"name":"Burpee Broad Jumps","distance":"80m","notes":"Controlled pace, cover max ground each jump"},
  {"name":"Run 5","distance":"1km","notes":"This is where the race starts"},
  {"name":"Rowing","distance":"1000m","notes":"26-28 strokes/min, legs drive first"},
  {"name":"Run 6","distance":"1km","notes":"Stay strong, keep cadence up"},
  {"name":"Farmers Carry","distance":"200m","notes":"Grip tight, brace core, dont stop"},
  {"name":"Run 7","distance":"1km","notes":"Almost there, keep pushing"},
  {"name":"Sandbag Lunges","distance":"100m","notes":"Long steps, stay upright"},
  {"name":"Run 8","distance":"1km","notes":"Last run, leave it all out there"},
  {"name":"Wall Balls","reps":"100 reps","notes":"Break into sets of 20-25, quick rest"}
]'::jsonb),

('Half Hyrox Simulation', 'Stations 1-4 with runs. Perfect mid-week intensity check without full race fatigue.', 'hyrox_sim', 'intermediate', 45, ARRAY['SkiErg','Sled'], '[
  {"name":"Run 1","distance":"1km"},
  {"name":"SkiErg","distance":"1000m"},
  {"name":"Run 2","distance":"1km"},
  {"name":"Sled Push","distance":"50m"},
  {"name":"Run 3","distance":"1km"},
  {"name":"Sled Pull","distance":"50m"},
  {"name":"Run 4","distance":"1km"},
  {"name":"Burpee Broad Jumps","distance":"80m"}
]'::jsonb),

('Back Half Simulation', 'Stations 5-8 with runs. The toughest half of race day — train where others break.', 'hyrox_sim', 'advanced', 50, ARRAY['Rower','Kettlebells','Sandbag','Wall Ball'], '[
  {"name":"Run 5","distance":"1km"},
  {"name":"Rowing","distance":"1000m"},
  {"name":"Run 6","distance":"1km"},
  {"name":"Farmers Carry","distance":"200m"},
  {"name":"Run 7","distance":"1km"},
  {"name":"Sandbag Lunges","distance":"100m"},
  {"name":"Run 8","distance":"1km"},
  {"name":"Wall Balls","reps":"100 reps"}
]'::jsonb),

('Hyrox Sprint Simulation', 'All 8 stations with 400m runs instead of 1km. Build station familiarity at higher intensity.', 'hyrox_sim', 'intermediate', 40, ARRAY['SkiErg','Rower','Sled','Sandbag','Wall Ball','Kettlebells'], '[
  {"name":"Run 1","distance":"400m"},
  {"name":"SkiErg","distance":"500m"},
  {"name":"Run 2","distance":"400m"},
  {"name":"Sled Push","distance":"25m"},
  {"name":"Run 3","distance":"400m"},
  {"name":"Sled Pull","distance":"25m"},
  {"name":"Run 4","distance":"400m"},
  {"name":"Burpee Broad Jumps","distance":"40m"},
  {"name":"Run 5","distance":"400m"},
  {"name":"Rowing","distance":"500m"},
  {"name":"Run 6","distance":"400m"},
  {"name":"Farmers Carry","distance":"100m"},
  {"name":"Run 7","distance":"400m"},
  {"name":"Sandbag Lunges","distance":"50m"},
  {"name":"Run 8","distance":"400m"},
  {"name":"Wall Balls","reps":"50 reps"}
]'::jsonb),

('Doubles Simulation', 'Full Hyrox Doubles format — partners alternate stations. Both athletes run every 1km.', 'hyrox_sim', 'intermediate', 70, ARRAY['SkiErg','Rower','Sled','Sandbag','Wall Ball','Kettlebells'], '[
  {"name":"Both Run 1","distance":"1km","notes":"Both partners run together"},
  {"name":"Partner A: SkiErg","distance":"1000m","notes":"Partner B rests/recovers"},
  {"name":"Both Run 2","distance":"1km"},
  {"name":"Partner B: Sled Push","distance":"50m"},
  {"name":"Both Run 3","distance":"1km"},
  {"name":"Partner A: Sled Pull","distance":"50m"},
  {"name":"Both Run 4","distance":"1km"},
  {"name":"Partner B: Burpee Broad Jumps","distance":"80m"},
  {"name":"Both Run 5","distance":"1km"},
  {"name":"Partner A: Rowing","distance":"1000m"},
  {"name":"Both Run 6","distance":"1km"},
  {"name":"Partner B: Farmers Carry","distance":"200m"},
  {"name":"Both Run 7","distance":"1km"},
  {"name":"Partner A: Sandbag Lunges","distance":"100m"},
  {"name":"Both Run 8","distance":"1km"},
  {"name":"Partner B: Wall Balls","reps":"100 reps"}
]'::jsonb);

-- ── CONDITIONING ──

INSERT INTO workouts (title, description, category, difficulty, duration_minutes, equipment, stations) VALUES
('The Furnace — 20 Min AMRAP', 'As many rounds as possible in 20 minutes. This metabolic conditioning workout mimics race-day intensity.', 'conditioning', 'intermediate', 20, ARRAY['Rower','Wall Ball','Kettlebells'], '[
  {"name":"Row","distance":"250m"},
  {"name":"Wall Balls","reps":"15 reps","notes":"20/14 lb ball"},
  {"name":"Kettlebell Swings","reps":"15 reps","notes":"24/16 kg"},
  {"name":"Burpees","reps":"10 reps"}
]'::jsonb),

('Station Blaster EMOM', 'Every minute on the minute for 24 minutes. 4 movements, 6 rounds each. Pacing is everything.', 'conditioning', 'advanced', 24, ARRAY['SkiErg','Wall Ball','Kettlebells'], '[
  {"name":"Minute 1: SkiErg","duration":"50 sec work","notes":"Max calories, 10 sec transition"},
  {"name":"Minute 2: Wall Balls","reps":"15 reps","notes":"Unbroken if possible"},
  {"name":"Minute 3: Kettlebell Swings","reps":"20 reps"},
  {"name":"Minute 4: Burpee Broad Jumps","reps":"8 reps","notes":"Repeat for 6 rounds"}
]'::jsonb),

('Hyrox MetCon — 5 Rounds', '5 rounds for time. A brutal conditioning piece that builds the engine you need on race day.', 'conditioning', 'advanced', 35, ARRAY['Rower','Sandbag','Wall Ball'], '[
  {"name":"Row","distance":"400m"},
  {"name":"Sandbag Over Shoulder","reps":"10 reps","notes":"Use Hyrox weight sandbag"},
  {"name":"Wall Balls","reps":"20 reps"},
  {"name":"Burpees","reps":"10 reps"},
  {"name":"Run","distance":"400m"}
]'::jsonb),

('Tabata Torture', '8 rounds of 20 sec work / 10 sec rest for 4 exercises. Pure intensity in 16 minutes.', 'conditioning', 'intermediate', 16, ARRAY['Kettlebells'], '[
  {"name":"Tabata 1: Kettlebell Swings","duration":"8x (20s on / 10s off)","notes":"4 minutes total"},
  {"name":"Tabata 2: Burpees","duration":"8x (20s on / 10s off)"},
  {"name":"Tabata 3: Mountain Climbers","duration":"8x (20s on / 10s off)"},
  {"name":"Tabata 4: Jump Squats","duration":"8x (20s on / 10s off)"}
]'::jsonb),

('Chipper — Race Day Prep', 'Complete all movements in order for time. A long grinding effort that builds mental toughness.', 'conditioning', 'advanced', 40, ARRAY['Rower','SkiErg','Sandbag','Wall Ball','Kettlebells'], '[
  {"name":"Row","distance":"1000m"},
  {"name":"Wall Balls","reps":"50 reps"},
  {"name":"Kettlebell Deadlifts","reps":"40 reps","notes":"2x24/16 kg"},
  {"name":"SkiErg","distance":"750m"},
  {"name":"Burpee Broad Jumps","distance":"40m"},
  {"name":"Sandbag Lunges","distance":"50m"},
  {"name":"Run","distance":"1600m"}
]'::jsonb),

('The 30-30 Interval Blitz', '30 seconds work, 30 seconds rest. 5 exercises, 4 rounds. Simple but savage.', 'conditioning', 'beginner', 20, ARRAY[], '[
  {"name":"Jump Squats","duration":"30s work / 30s rest"},
  {"name":"Push-ups","duration":"30s work / 30s rest"},
  {"name":"Mountain Climbers","duration":"30s work / 30s rest"},
  {"name":"Burpees","duration":"30s work / 30s rest"},
  {"name":"Plank Hold","duration":"30s work / 30s rest","notes":"Repeat 4 rounds"}
]'::jsonb);

-- ── STRENGTH ──

INSERT INTO workouts (title, description, category, difficulty, duration_minutes, equipment, stations) VALUES
('Sled Strength Builder', 'Heavy sled work paired with lunges and carries. Build the raw power needed for stations 2, 3, 6, and 7.', 'strength', 'intermediate', 35, ARRAY['Sled','Kettlebells','Sandbag'], '[
  {"name":"Heavy Sled Push","distance":"4x25m","rest":"90 sec","notes":"Heavier than race weight"},
  {"name":"Heavy Sled Pull","distance":"4x25m","rest":"90 sec"},
  {"name":"Farmers Carry","distance":"3x100m","rest":"60 sec","notes":"Heaviest you can hold"},
  {"name":"Sandbag Bear Hug Carry","distance":"3x50m","rest":"60 sec"},
  {"name":"Walking Lunges","reps":"3x20 each leg","rest":"60 sec","notes":"Bodyweight or loaded"}
]'::jsonb),

('Hyrox Deadlift Day', 'Deadlift-focused strength session to build posterior chain power for sled work, carries, and lunges.', 'strength', 'intermediate', 40, ARRAY['Barbell','Kettlebells'], '[
  {"name":"Conventional Deadlift","reps":"5x5","rest":"2-3 min","notes":"Work up to 80% 1RM"},
  {"name":"Romanian Deadlift","reps":"3x10","rest":"90 sec","notes":"Focus on hamstring stretch"},
  {"name":"Kettlebell Swings","reps":"4x20","rest":"60 sec","notes":"Hip hinge power"},
  {"name":"Single-Leg RDL","reps":"3x8 each","rest":"60 sec"},
  {"name":"Back Extensions","reps":"3x15","rest":"45 sec"}
]'::jsonb),

('Upper Body Station Prep', 'Build pulling and pushing endurance for SkiErg, sled pull, and wall balls.', 'strength', 'intermediate', 35, ARRAY['Pull-up Bar','Dumbbells','Wall Ball'], '[
  {"name":"Pull-ups","reps":"4x8-12","rest":"90 sec","notes":"Strict or banded"},
  {"name":"Dumbbell Push Press","reps":"4x10","rest":"90 sec"},
  {"name":"Bent Over Row","reps":"4x10","rest":"60 sec"},
  {"name":"Wall Ball Shots","reps":"3x25","rest":"60 sec","notes":"Race-weight ball"},
  {"name":"Tricep Dips","reps":"3x12","rest":"60 sec"},
  {"name":"Face Pulls","reps":"3x15","rest":"45 sec"}
]'::jsonb),

('Legs & Lunges Power Session', 'Lower body strength with emphasis on lunge capacity and single-leg stability.', 'strength', 'advanced', 45, ARRAY['Barbell','Dumbbells','Sandbag'], '[
  {"name":"Back Squat","reps":"5x5","rest":"2-3 min","notes":"80-85% 1RM"},
  {"name":"Bulgarian Split Squat","reps":"3x8 each","rest":"90 sec","notes":"Loaded with dumbbells"},
  {"name":"Sandbag Lunges","distance":"4x50m","rest":"90 sec","notes":"Race weight sandbag"},
  {"name":"Step-ups","reps":"3x10 each","rest":"60 sec","notes":"20-24 inch box"},
  {"name":"Calf Raises","reps":"3x20","rest":"45 sec"},
  {"name":"Wall Sit","duration":"3x45 sec","rest":"30 sec"}
]'::jsonb),

('Grip & Core Fortress', 'Grip endurance and core stability — the hidden keys to Hyrox performance.', 'strength', 'intermediate', 30, ARRAY['Kettlebells','Pull-up Bar'], '[
  {"name":"Dead Hang","duration":"4x max hold","rest":"60 sec","notes":"Track your time"},
  {"name":"Farmers Carry","distance":"4x100m","rest":"60 sec"},
  {"name":"Plank","duration":"3x60 sec","rest":"30 sec"},
  {"name":"Pallof Press","reps":"3x10 each side","rest":"45 sec"},
  {"name":"Kettlebell Suitcase Carry","distance":"3x50m each hand","rest":"45 sec"},
  {"name":"Hanging Knee Raises","reps":"3x12","rest":"45 sec"}
]'::jsonb);

-- ── RUNNING ──

INSERT INTO workouts (title, description, category, difficulty, duration_minutes, equipment, stations) VALUES
('Hyrox Race Pace Intervals', '8x1km at your target Hyrox race pace with 90 second rest. Simulate the running demands of race day.', 'running', 'advanced', 55, ARRAY[], '[
  {"name":"Warm-up Jog","distance":"1km","notes":"Easy pace"},
  {"name":"Interval 1","distance":"1km","rest":"90 sec","notes":"Target Hyrox race pace"},
  {"name":"Interval 2","distance":"1km","rest":"90 sec"},
  {"name":"Interval 3","distance":"1km","rest":"90 sec"},
  {"name":"Interval 4","distance":"1km","rest":"90 sec"},
  {"name":"Interval 5","distance":"1km","rest":"90 sec"},
  {"name":"Interval 6","distance":"1km","rest":"90 sec"},
  {"name":"Interval 7","distance":"1km","rest":"90 sec"},
  {"name":"Interval 8","distance":"1km","rest":"90 sec"},
  {"name":"Cool-down","distance":"1km","notes":"Easy jog"}
]'::jsonb),

('Tempo Run — Threshold Builder', 'Sustained tempo effort to build your lactate threshold. Key for maintaining pace across 8km of race running.', 'running', 'intermediate', 40, ARRAY[], '[
  {"name":"Warm-up","distance":"1.5km","notes":"Easy jog"},
  {"name":"Tempo Block 1","distance":"3km","notes":"Comfortably hard pace — you can speak in short phrases"},
  {"name":"Recovery Jog","distance":"500m","notes":"Very easy"},
  {"name":"Tempo Block 2","distance":"2km","notes":"Same pace as block 1"},
  {"name":"Cool-down","distance":"1.5km","notes":"Easy jog + stretch"}
]'::jsonb),

('400m Repeats — Speed Work', 'Fast 400m repeats to build leg speed and VO2max. Faster legs = faster transitions on race day.', 'running', 'intermediate', 35, ARRAY[], '[
  {"name":"Warm-up Jog","distance":"1.5km"},
  {"name":"Dynamic Stretching","duration":"5 min","notes":"Leg swings, high knees, butt kicks"},
  {"name":"400m Repeat 1","distance":"400m","rest":"90 sec","notes":"85-90% effort"},
  {"name":"400m Repeat 2","distance":"400m","rest":"90 sec"},
  {"name":"400m Repeat 3","distance":"400m","rest":"90 sec"},
  {"name":"400m Repeat 4","distance":"400m","rest":"90 sec"},
  {"name":"400m Repeat 5","distance":"400m","rest":"90 sec"},
  {"name":"400m Repeat 6","distance":"400m","rest":"90 sec"},
  {"name":"400m Repeat 7","distance":"400m","rest":"2 min"},
  {"name":"400m Repeat 8","distance":"400m","rest":"done"},
  {"name":"Cool-down","distance":"1.5km","notes":"Easy jog"}
]'::jsonb),

('Easy Aerobic Base Run', 'Low intensity long run to build aerobic capacity. The foundation of all Hyrox running performance.', 'running', 'beginner', 45, ARRAY[], '[
  {"name":"Easy Run","distance":"6-8km","notes":"Conversational pace — you should be able to hold a full conversation. Heart rate Zone 2. This is NOT a race."},
  {"name":"Cool-down Walk","duration":"5 min"},
  {"name":"Static Stretching","duration":"5 min","notes":"Quads, hamstrings, calves, hip flexors"}
]'::jsonb),

('Negative Split Long Run', 'Start easy, finish strong. Train your body to accelerate when it matters most — just like the back half of a Hyrox race.', 'running', 'intermediate', 50, ARRAY[], '[
  {"name":"Warm-up","distance":"1km","notes":"Very easy jog"},
  {"name":"Km 1-3","distance":"3km","notes":"Easy pace — 30 sec slower than race pace"},
  {"name":"Km 4-6","distance":"3km","notes":"Moderate — 15 sec slower than race pace"},
  {"name":"Km 7-8","distance":"2km","notes":"Race pace"},
  {"name":"Km 9-10","distance":"2km","notes":"10-15 sec faster than race pace"},
  {"name":"Cool-down","distance":"1km","notes":"Easy jog"}
]'::jsonb);

-- ── MOBILITY ──

INSERT INTO workouts (title, description, category, difficulty, duration_minutes, equipment, stations) VALUES
('Hyrox Recovery Flow', 'Full-body mobility session targeting the areas most stressed during Hyrox training — hips, thoracic spine, ankles, and shoulders.', 'mobility', 'beginner', 25, ARRAY['Foam Roller'], '[
  {"name":"Foam Roll Quads","duration":"2 min each","notes":"Slow rolls, pause on tender spots"},
  {"name":"Foam Roll IT Band","duration":"2 min each"},
  {"name":"Foam Roll Thoracic Spine","duration":"2 min","notes":"Arms crossed over chest"},
  {"name":"90/90 Hip Stretch","duration":"90 sec each side","notes":"Sit tall, lean forward gently"},
  {"name":"Pigeon Pose","duration":"90 sec each side"},
  {"name":"Couch Stretch","duration":"60 sec each side","notes":"Hip flexor + quad stretch"},
  {"name":"Thread the Needle","reps":"8 each side","notes":"Thoracic rotation"},
  {"name":"Deep Squat Hold","duration":"2 min","notes":"Heels down, chest up"},
  {"name":"Calf Stretch (Wall)","duration":"60 sec each","notes":"Straight leg + bent knee versions"}
]'::jsonb),

('Pre-Race Activation', 'Dynamic warm-up routine to perform before any simulation or race. Activates all major muscle groups and primes the nervous system.', 'mobility', 'beginner', 15, ARRAY[], '[
  {"name":"Light Jog","duration":"3 min","notes":"Get blood flowing"},
  {"name":"Leg Swings (Forward/Back)","reps":"10 each leg"},
  {"name":"Leg Swings (Side to Side)","reps":"10 each leg"},
  {"name":"Walking Lunges with Twist","reps":"8 each side"},
  {"name":"Inchworms","reps":"6 reps","notes":"Walk hands out to push-up, walk feet to hands"},
  {"name":"Hip Circles","reps":"8 each direction each leg"},
  {"name":"Arm Circles","reps":"10 forward, 10 backward"},
  {"name":"A-Skips","distance":"20m","notes":"Drive knees, stay light on feet"},
  {"name":"B-Skips","distance":"20m"},
  {"name":"Build-up Sprints","reps":"3x40m","notes":"50%, 70%, 85% effort"}
]'::jsonb),

('Ankle & Hip Mobility for Runners', 'Targeted mobility work for the two joints that limit most Hyrox athletes — ankles and hips.', 'mobility', 'beginner', 20, ARRAY[], '[
  {"name":"Ankle Circles","reps":"10 each direction each foot"},
  {"name":"Wall Ankle Stretch","duration":"60 sec each","notes":"Knee drives over toes toward wall"},
  {"name":"Banded Ankle Dorsiflexion","reps":"15 each side","notes":"Use resistance band if available"},
  {"name":"Half Kneeling Hip Flexor Stretch","duration":"90 sec each side"},
  {"name":"Frog Stretch","duration":"2 min","notes":"Widen knees, rock gently forward and back"},
  {"name":"Single Leg Glute Bridge","reps":"10 each side","notes":"3 sec hold at top"},
  {"name":"Cossack Squat","reps":"8 each side","notes":"Slow and controlled"},
  {"name":"Deep Squat Ankle Rocks","duration":"90 sec","notes":"Shift weight side to side in deep squat"}
]'::jsonb);
