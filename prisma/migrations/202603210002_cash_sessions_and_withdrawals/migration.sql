CREATE TABLE IF NOT EXISTS "cash_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "opening_amount" DECIMAL(10,2) NOT NULL,
  "opening_notes" TEXT,
  "opened_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "closing_amount" DECIMAL(10,2),
  "closing_notes" TEXT,
  "closed_at" TIMESTAMPTZ,
  "expected_cash" DECIMAL(10,2),
  "cash_sales_total" DECIMAL(10,2),
  "card_sales_total" DECIMAL(10,2),
  "expenses_total" DECIMAL(10,2),
  "withdrawals_total" DECIMAL(10,2)
);

CREATE INDEX IF NOT EXISTS "idx_cash_sessions_user" ON "cash_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_cash_sessions_status" ON "cash_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_cash_sessions_opened_at" ON "cash_sessions"("opened_at");

CREATE TABLE IF NOT EXISTS "cash_withdrawals" (
  "id" SERIAL PRIMARY KEY,
  "session_id" INTEGER NOT NULL REFERENCES "cash_sessions"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_cash_withdrawals_session" ON "cash_withdrawals"("session_id");
CREATE INDEX IF NOT EXISTS "idx_cash_withdrawals_created_at" ON "cash_withdrawals"("created_at");

ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "cash_session_id" INTEGER REFERENCES "cash_sessions"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_sales_cash_session" ON "sales"("cash_session_id");

ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "cash_session_id" INTEGER REFERENCES "cash_sessions"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_expenses_cash_session" ON "expenses"("cash_session_id");