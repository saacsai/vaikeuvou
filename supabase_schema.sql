-- ============================================================
-- vaikeuvou.app — Schema inicial
-- Rodar no Supabase SQL Editor
-- ============================================================

-- Tabela de Eventos
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(160) UNIQUE NOT NULL,
  event_date    TIMESTAMP WITH TIME ZONE NOT NULL,
  location      TEXT,
  description   TEXT,
  bg_image_url  TEXT,
  max_depth     INT DEFAULT 2,        -- 1: Privado, 2: Amigos, 999: Aberto
  creator_phone VARCHAR(20) NOT NULL,
  edit_token    UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de RSVPs (confirmações + árvore viral)
CREATE TABLE rsvps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name      VARCHAR(100) NOT NULL,
  user_phone     VARCHAR(20) NOT NULL,
  parent_rsvp_id UUID REFERENCES rsvps(id),   -- NULL = convidado direto do criador
  depth_level    INT NOT NULL DEFAULT 1,       -- calculado via trigger
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: calcula depth_level automaticamente a partir do pai
CREATE OR REPLACE FUNCTION set_rsvp_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_rsvp_id IS NULL THEN
    NEW.depth_level := 1;
  ELSE
    SELECT depth_level + 1 INTO NEW.depth_level
    FROM rsvps WHERE id = NEW.parent_rsvp_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_rsvp_depth
BEFORE INSERT ON rsvps
FOR EACH ROW EXECUTE FUNCTION set_rsvp_depth();

-- Carteira de créditos (identificada por telefone do criador)
CREATE TABLE creator_credits (
  creator_phone   VARCHAR(20) PRIMARY KEY,
  credits_balance INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ledger de transações de crédito (auditável)
CREATE TABLE credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_phone VARCHAR(20) NOT NULL,
  type          VARCHAR(20) NOT NULL,   -- 'purchase' | 'consumption'
  amount        INT NOT NULL,           -- positivo p/ compra, negativo p/ consumo
  reference     VARCHAR(255),           -- stripe_payment_intent_id ou ação consumida
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- events: leitura pública, escrita só via Edge Function (service_role)
CREATE POLICY "events_select_public" ON events FOR SELECT TO anon USING (true);

-- rsvps: leitura pública (mostrar quem confirmou), escrita só via Edge Function
CREATE POLICY "rsvps_select_public" ON rsvps FOR SELECT TO anon USING (true);

-- creator_credits e credit_transactions: sem acesso público
-- (só service_role via Edge Function lê/escreve)
