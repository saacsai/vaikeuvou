-- Troca de data: primeira é grátis (ex: adiar um evento), da segunda em
-- diante custa crédito. Contador simples — nunca reseta.
ALTER TABLE events ADD COLUMN IF NOT EXISTS date_changes_count INT NOT NULL DEFAULT 0;
