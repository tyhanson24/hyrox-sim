-- ══════════════════════════════════════════
-- HYROX SIM — Database Schema
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ══════════════════════════════════════════

-- ── Profiles (extends Supabase auth.users) ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  division TEXT CHECK (division IN ('men_open','women_open','men_pro','women_pro','men_doubles','women_doubles','mixed_doubles')),
  target_time_seconds INTEGER,
  age_group TEXT,
  active_plan_id UUID,
  plan_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can view profiles for leaderboard" ON profiles FOR SELECT USING (true);

-- ── Auto-create profile on signup ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Workouts (library) ──
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('hyrox_sim','conditioning','strength','running','mobility')),
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  duration_minutes INTEGER,
  stations JSONB,
  equipment TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workouts are public" ON workouts FOR SELECT USING (true);

-- ── Workout Logs ──
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER,
  notes TEXT,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  source TEXT CHECK (source IN ('web','watch','manual')) DEFAULT 'web',
  data JSONB
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own logs" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own logs" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- ── Simulation Results ──
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_time_ms INTEGER NOT NULL,
  splits JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  source TEXT CHECK (source IN ('web','watch')) DEFAULT 'web'
);

ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sim results for leaderboard" ON simulation_results FOR SELECT USING (true);
CREATE POLICY "Users insert own sims" ON simulation_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own sims" ON simulation_results FOR DELETE USING (auth.uid() = user_id);

-- ── Race Results ──
CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  race_name TEXT NOT NULL,
  race_date DATE NOT NULL,
  location TEXT,
  division TEXT,
  overall_time_seconds INTEGER NOT NULL,
  overall_rank INTEGER,
  age_group_rank INTEGER,
  splits JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own races" ON race_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own races" ON race_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own races" ON race_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own races" ON race_results FOR DELETE USING (auth.uid() = user_id);

-- ── Training Plans ──
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  target_audience TEXT,
  schedule JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON training_plans FOR SELECT USING (true);

-- ── Contact Submissions ──
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON contact_submissions FOR INSERT WITH CHECK (true);

-- ── Health Metrics (synced from iOS HealthKit) ──
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'resting_hr', 'vo2_max', 'hrv', 'hr_recovery',
    'sleep_hours', 'weight', 'running_distance', 'steps', 'active_calories'
  )),
  value NUMERIC NOT NULL,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recorded_at, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_user ON health_metrics(user_id, metric_type, recorded_at DESC);

ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own health data" ON health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own health data" ON health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own health data" ON health_metrics FOR UPDATE USING (auth.uid() = user_id);
