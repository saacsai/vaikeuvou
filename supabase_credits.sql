-- Motor de créditos: saldo do usuário, desbloqueio por convite (Ver quem vai
-- / Confirmados), e ledger de transações.
ALTER TABLE users  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_list_unlocked_at TIMESTAMPTZ;

-- Remove uma tabela antiga incompatível de uma tentativa anterior (vazia, seguro apagar)
DROP TABLE IF EXISTS credit_transactions;

CREATE TABLE IF NOT EXISTS credit_transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount            INTEGER NOT NULL,           -- positivo = compra, negativo = débito
  type              TEXT NOT NULL,              -- 'purchase' | 'debit'
  reason            TEXT NOT NULL,
  event_id          UUID REFERENCES events(id),
  stripe_session_id TEXT UNIQUE,                -- idempotência do webhook
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS credit_transactions_user_idx ON credit_transactions (user_id);

-- Increment/debit atômicos (evita race condition com saldo em dinheiro real)
CREATE OR REPLACE FUNCTION increment_user_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE users SET credits = credits + p_amount WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION debit_user_credits(p_user_id uuid, p_amount integer)
RETURNS boolean AS $$
DECLARE rows_affected integer;
BEGIN
  UPDATE users SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;
