-- Remove calendar/events feature (replaced by external iCloud calendar)
DROP TABLE IF EXISTS public.events CASCADE;
DROP TYPE IF EXISTS public.event_type;
