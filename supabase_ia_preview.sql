-- Preview/aprovação da imagem gerada por IA: cobra ao gerar, só vira a capa
-- do convite quando a pessoa aprova; recusar devolve o crédito e libera o
-- arquivo do Storage. event_id fica nulo quando gerada ainda em /criar,
-- antes do convite existir.
CREATE TABLE IF NOT EXISTS ai_image_generations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES events(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_image_generations_user_idx ON ai_image_generations (user_id);
