-- Polls: allow voters to pick multiple options in the same poll

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'poll_votes_poll_id_voter_id_key'
      AND conrelid = 'public.poll_votes'::regclass
  ) THEN
    ALTER TABLE public.poll_votes
    DROP CONSTRAINT poll_votes_poll_id_voter_id_key;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'poll_votes_poll_id_option_id_voter_id_key'
      AND conrelid = 'public.poll_votes'::regclass
  ) THEN
    ALTER TABLE public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_option_id_voter_id_key
    UNIQUE (poll_id, option_id, voter_id);
  END IF;
END;
$$;
