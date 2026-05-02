CREATE TABLE IF NOT EXISTS "progress_entries" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "auth_users"("id"),
  "entry_date" date NOT NULL,
  "weight" numeric(6, 1) NOT NULL,
  "waist" numeric(6, 1) NOT NULL,
  "completed_workouts" integer NOT NULL,
  "energy" integer NOT NULL,
  "sleep_hours" numeric(4, 1) NOT NULL,
  "mood" integer NOT NULL,
  "notes" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
