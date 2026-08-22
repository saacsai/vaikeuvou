-- Check-in "Eu fui": confirmação real de presença, separada da confirmação
-- de intenção (BORA). Coleta sempre roda; a visualização no dashboard
-- reaproveita o desbloqueio pago já existente (guest_list_unlocked_at).

ALTER TABLE events ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_reminder_sent_at TIMESTAMPTZ;

ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS checkin_lat NUMERIC;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS checkin_lng NUMERIC;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS checkin_verified BOOLEAN NOT NULL DEFAULT false;
