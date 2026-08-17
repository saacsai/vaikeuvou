-- Registro de aceite explícito dos Termos de Uso e Política de Privacidade
-- (LGPD) — carimbado uma vez, na primeira criação de convite, não repete
-- depois disso.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
