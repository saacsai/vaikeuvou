-- Controle de resposta automática no WhatsApp de OTP — evita responder de
-- novo pro mesmo número dentro de 24h, pra não parecer bot repetitivo numa
-- conversa de ida e volta.
CREATE TABLE IF NOT EXISTS whatsapp_autoreplies (
  phone         TEXT PRIMARY KEY,
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
