-- ══════════════════════════════════════════
-- HYROX SIM — Training Plan Seed Data
-- Run this in Supabase SQL Editor AFTER schema.sql
-- 4 real structured training plans
-- ══════════════════════════════════════════

INSERT INTO training_plans (title, description, duration_weeks, difficulty, target_audience, schedule) VALUES

-- ── Plan 1: 8-Week Beginner ──
('8-Week Beginner Program',
'Your first Hyrox race starts here. Build a solid foundation of running fitness, functional strength, and station familiarity. Three sessions per week with progressive overload — designed so you can finish your first race feeling strong.',
8, 'beginner', 'First-time Hyrox athletes or those returning after a long break',
'[
  {"week":1,"focus":"Foundation & Assessment","days":["Easy Run 3km","Rest","Strength: Bodyweight Circuit (3 rounds: 10 squats, 10 push-ups, 10 lunges, 30s plank)","Rest","Easy Run 2km + 500m Row","Rest","Mobility: Full Body Flow 20min"]},
  {"week":2,"focus":"Building Base","days":["Easy Run 4km","Rest","Strength: Goblet Squats 3x10, DB Row 3x10, Wall Balls 3x10, Farmers Carry 3x50m","Rest","Run 3km + SkiErg 500m","Rest","Mobility + Light Walk 30min"]},
  {"week":3,"focus":"Station Introduction","days":["Run 4km with 4x30s pickups","Rest","Strength: Deadlift 3x8, Push Press 3x8, KB Swings 3x15, Lunges 3x10ea","Rest","Mini Sim: 2 stations (SkiErg 500m + Row 500m) with 800m runs","Rest","Mobility: Hip & Ankle Focus"]},
  {"week":4,"focus":"Building Endurance","days":["Tempo Run 3km (comfortably hard)","Rest","Strength: Sled Push 4x25m, Sled Pull 4x25m, Wall Balls 4x15","Rest","Run 5km easy","Rest","Recovery: Foam Roll + Stretch"]},
  {"week":5,"focus":"Increasing Volume","days":["Run 5km with negative splits","Rest","Strength: Deadlift 4x6, Farmers Carry 4x100m, Sandbag Lunges 3x50m","Rest","Half Sim: 4 stations with 800m runs","Rest","Mobility + Easy Walk"]},
  {"week":6,"focus":"Race Specificity","days":["Intervals: 6x400m with 90s rest","Rest","Conditioning: AMRAP 15min (10 Wall Balls, 10 KB Swings, 200m Row)","Rest","Run 6km easy","Rest","Pre-Race Activation Routine"]},
  {"week":7,"focus":"Peak Week","days":["Run 4km + 4x200m strides","Rest","Full Sim Practice (all 8 stations, 400m runs)","Rest","Easy Run 3km","Rest","Mobility: Race Prep Flow"]},
  {"week":8,"focus":"Taper & Race","days":["Easy Run 3km + 4 strides","Rest","Light Strength: 2x8 squats, 2x8 push-ups, Wall Balls 2x10","Rest","Shake-out Run 2km","RACE DAY","Rest & Celebrate"]}
]'::jsonb),

-- ── Plan 2: 12-Week Race Prep Intermediate ──
('12-Week Race Prep Intermediate',
'A comprehensive 12-week program for athletes who have completed at least one Hyrox race and want to improve their time. Four to five sessions per week combining structured running, strength work, station-specific drills, and recovery.',
12, 'intermediate', 'Athletes with 1+ Hyrox race aiming to beat their PR',
'[
  {"week":1,"focus":"Testing & Baseline","days":["Tempo Run 5km","Strength: Deadlift 4x5, Back Squat 4x5","Rest","Conditioning: 20min AMRAP (Row 250m, 15 Wall Balls, 10 Burpees)","Run 8km easy","Mobility 30min","Rest"]},
  {"week":2,"focus":"Aerobic Base","days":["Intervals: 6x800m @ 5k pace, 2min rest","Strength: Sled Push 5x25m, Sled Pull 5x25m, Farmers Carry 4x100m","Rest","SkiErg intervals: 8x250m with 60s rest","Easy Run 6km","Mobility + Core","Rest"]},
  {"week":3,"focus":"Station Endurance","days":["Tempo Run 6km","Strength: DL 4x5, Bulgarian Split Squat 3x8ea, KB Swings 4x20","Rest","Half Sim: Stations 1-4 with 1km runs","Run 7km with 3x1min pickups","Mobility","Rest"]},
  {"week":4,"focus":"Deload","days":["Easy Run 5km","Light Strength: 3x8 at 60%","Rest","Easy Row 3km + Mobility","Run 4km easy","Full Rest","Rest"]},
  {"week":5,"focus":"Building Power","days":["Intervals: 8x400m @ mile pace, 90s rest","Strength: Heavy DL 5x3, Squat 5x3, Weighted Lunges 3x8ea","Rest","Conditioning: 5 rounds (400m run, 20 Wall Balls, 10 Burpee Broad Jumps)","Long Run 10km easy","Mobility","Rest"]},
  {"week":6,"focus":"Race Pace Work","days":["Race Pace Intervals: 4x1km @ goal Hyrox pace, 90s rest","Strength: Sled Work + Carries Focus","Rest","Back Half Sim: Stations 5-8 with 1km runs","Easy Run 6km","Yoga/Mobility","Rest"]},
  {"week":7,"focus":"Volume Week","days":["Intervals: 10x400m with 60s rest","Strength: Full Body Circuit 4 rounds","Rest","Full Sprint Sim (all stations, 400m runs)","Long Run 12km easy","Mobility","Rest"]},
  {"week":8,"focus":"Deload","days":["Easy Run 5km + strides","Light Station Work: SkiErg 500m, Row 500m","Rest","Easy Run 4km","Mobility 30min","Rest","Rest"]},
  {"week":9,"focus":"Peak Training","days":["Race Pace: 6x1km @ goal pace, 90s rest","Heavy Strength: DL 5x3, Squat 5x3","Rest","Conditioning: Chipper (1km Row, 50 WB, 40 KB, 30 BBJ, 20 Lunges)","Run 8km progressive","Mobility","Rest"]},
  {"week":10,"focus":"Simulation Week","days":["Intervals: 5x1km slightly faster than race pace","Strength: Station Specific (Sled, Carry, Lunges)","Rest","Full Hyrox Simulation @ Race Effort","Easy Run 5km","Full Mobility Session","Rest"]},
  {"week":11,"focus":"Sharpening","days":["Run 5km with 6x30s strides","Light Strength: 3x6 at 70%","Rest","Mini Sim: 4 stations, 800m runs @ race pace","Easy Run 4km","Mobility","Rest"]},
  {"week":12,"focus":"Taper & Race","days":["Easy Run 3km + 4 strides","Light Station Touch: SkiErg 250m, Row 250m, 10 WB","Rest","Shake-out 2km jog","Rest / Travel","RACE DAY","Rest & Recover"]}
]'::jsonb),

-- ── Plan 3: 4-Week Advanced Sharpening ──
('4-Week Advanced Sharpening Block',
'For experienced Hyrox athletes in the final 4 weeks before race day. High-intensity, race-specific sessions to sharpen your fitness and dial in your pacing. Not a base-building plan — come in fit.',
4, 'advanced', 'Experienced athletes within 4 weeks of race day',
'[
  {"week":1,"focus":"Intensity & Specificity","days":["Race Pace: 8x1km @ goal pace, 75s rest","Heavy Strength: DL 5x3, Squat 5x3, Heavy Sled 4x50m","Conditioning EMOM 24min","Rest","Full Hyrox Simulation @ 90-95% effort","Easy Run 5km","Mobility: Full Recovery Flow"]},
  {"week":2,"focus":"Peak Week","days":["Speed: 10x400m @ faster than race pace, 60s rest","Strength: Station Gauntlet (all 8 stations, no runs, max effort)","Rest","Race Pace Sim: All stations with 1km runs @ exact goal pace","Easy Run 6km + strides","Mobility + Foam Roll","Rest"]},
  {"week":3,"focus":"Controlled Sharpening","days":["Run 5km with 4x200m strides","Light Strength: 3x5 at 65%, Station Touch","Rest","Half Sim: Stations 1-4 with 1km runs @ race pace","Easy Run 4km","Mobility 30min","Rest"]},
  {"week":4,"focus":"Taper & Execute","days":["Easy Run 3km + 4 strides","Light Station Activation: SkiErg 250m, Row 250m, 5 WB","Rest","Shake-out 2km jog + Dynamic Warm-up Practice","Rest / Travel / Visualization","RACE DAY","Recovery"]}
]'::jsonb),

-- ── Plan 4: 6-Week Running Focus ──
('6-Week Running Focus Block',
'Running accounts for 50%+ of your Hyrox time. This block focuses specifically on improving your 1km repeat ability, lactate threshold, and running economy while maintaining station fitness.',
6, 'intermediate', 'Athletes whose running splits are holding them back',
'[
  {"week":1,"focus":"Assessment & Base","days":["Time Trial: 1km all-out (record baseline)","Strength: Lower Body (Squats, RDLs, Lunges)","Easy Run 6km","Rest","Intervals: 6x800m @ 5k pace, 2min rest","Station Maintenance: Quick SkiErg + Row","Mobility + Easy Walk"]},
  {"week":2,"focus":"Threshold Development","days":["Tempo Run: 2x15min at threshold, 3min jog between","Strength: Upper Body + Core","Easy Run 5km","Rest","Intervals: 8x400m @ mile pace, 90s rest","Conditioning: 15min AMRAP (200m Run, 10 WB, 10 KB Swings)","Mobility"]},
  {"week":3,"focus":"Race Pace Training","days":["Race Pace: 5x1km @ goal Hyrox pace, 90s rest","Strength: Full Body","Easy Run 7km","Rest","Fartlek Run: 30min (2min hard / 2min easy)","Station Work: Sled + Carry Focus","Recovery Run 3km + Stretch"]},
  {"week":4,"focus":"Deload","days":["Easy Run 5km + strides","Light Strength","Rest","Easy Run 4km","Mobility 30min","Light Station Touch","Rest"]},
  {"week":5,"focus":"Peak Running","days":["Race Pace: 8x1km @ goal pace, 75s rest","Strength: Lower Body Power","Easy Run 6km","Rest","Intervals: 6x600m @ 3k pace, 2min rest","Mini Sim: 4 stations with 1km runs","Mobility"]},
  {"week":6,"focus":"Integrate & Test","days":["Easy Run 4km + 4 strides","Light Strength","Rest","Full Sim with focus on running pacing","Time Trial: 1km all-out (compare to Week 1)","Mobility + Celebrate your improvement","Rest"]}
]'::jsonb);
