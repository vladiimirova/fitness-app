CREATE TABLE IF NOT EXISTS "ai_programs" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "auth_users"("id"),
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
