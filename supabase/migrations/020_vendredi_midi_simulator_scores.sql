-- Vendredi Midi Simulator: personal best scores + leaderboard

CREATE TABLE IF NOT EXISTS public.vendredi_midi_scores (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  player_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  best_duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (best_duration_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendredi_midi_scores_best_score
  ON public.vendredi_midi_scores(best_score DESC, updated_at ASC);

DROP TRIGGER IF EXISTS update_vendredi_midi_scores_updated_at ON public.vendredi_midi_scores;
CREATE TRIGGER update_vendredi_midi_scores_updated_at
BEFORE UPDATE ON public.vendredi_midi_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_vendredi_midi_best_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.best_score < OLD.best_score THEN
    NEW.best_score := OLD.best_score;
    NEW.best_duration_ms := GREATEST(OLD.best_duration_ms, NEW.best_duration_ms);
  ELSIF NEW.best_score = OLD.best_score THEN
    NEW.best_duration_ms := GREATEST(OLD.best_duration_ms, NEW.best_duration_ms);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vendredi_midi_best_score_trigger ON public.vendredi_midi_scores;
CREATE TRIGGER enforce_vendredi_midi_best_score_trigger
BEFORE UPDATE ON public.vendredi_midi_scores
FOR EACH ROW EXECUTE FUNCTION public.enforce_vendredi_midi_best_score();

ALTER TABLE public.vendredi_midi_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendredi scores are viewable by approved members" ON public.vendredi_midi_scores;
CREATE POLICY "Vendredi scores are viewable by approved members"
ON public.vendredi_midi_scores
FOR SELECT
TO authenticated
USING (public.is_approved_member());

DROP POLICY IF EXISTS "Members can create their own vendredi score row" ON public.vendredi_midi_scores;
CREATE POLICY "Members can create their own vendredi score row"
ON public.vendredi_midi_scores
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_member()
  AND player_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Members can update only their own vendredi score row" ON public.vendredi_midi_scores;
CREATE POLICY "Members can update only their own vendredi score row"
ON public.vendredi_midi_scores
FOR UPDATE
TO authenticated
USING (
  public.is_approved_member()
  AND player_id = (select auth.uid())
)
WITH CHECK (
  public.is_approved_member()
  AND player_id = (select auth.uid())
);
