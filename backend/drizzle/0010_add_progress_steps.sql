ALTER TABLE "progress_entries"
ADD COLUMN IF NOT EXISTS "steps" integer NOT NULL DEFAULT 0;
