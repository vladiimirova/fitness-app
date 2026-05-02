ALTER TABLE "progress_entries"
ADD COLUMN IF NOT EXISTS "followed_nutrition" boolean NOT NULL DEFAULT false;

ALTER TABLE "progress_entries"
ADD COLUMN IF NOT EXISTS "completed_training" boolean NOT NULL DEFAULT false;
