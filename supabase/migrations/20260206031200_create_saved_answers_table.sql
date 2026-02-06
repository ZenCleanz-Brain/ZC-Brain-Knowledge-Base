CREATE TABLE IF NOT EXISTS saved_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  saved_by TEXT NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_answers_session_id ON saved_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_answers_saved_at ON saved_answers(saved_at DESC);

ALTER TABLE saved_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all operations" ON saved_answers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
