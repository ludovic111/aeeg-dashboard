-- Add Grok-generated markdown summary for meeting agendas
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS agenda_ai_summary TEXT;
