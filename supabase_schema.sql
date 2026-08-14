-- ============================================================
-- vaikeuvou.app — Schema completo (estado atual)
-- Rodar no Supabase SQL Editor (projeto lntgfqbuqfiukgnhdvxe)
-- ============================================================

-- USUÁRIOS (auth própria via OTP WhatsApp)
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20) UNIQUE NOT NULL,
  name       TEXT,
  avatar_url TEXT,
  email      TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP para login
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20) NOT NULL,
  code       VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessões com sliding expiry (72h)
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EVENTOS
CREATE TABLE IF NOT EXISTS events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255) NOT NULL,
  slug                VARCHAR(160) UNIQUE NOT NULL,
  event_date          TIMESTAMP WITH TIME ZONE NOT NULL,
  location            TEXT,
  description         TEXT,
  bg_image_url        TEXT,
  external_url        TEXT,
  external_url_label  TEXT,
  video_url           TEXT,
  max_depth           INT DEFAULT 2,
  creator_phone       VARCHAR(20) NOT NULL,
  user_id             UUID REFERENCES users(id),
  edit_token          UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSVPs (confirmações + árvore viral)
CREATE TABLE IF NOT EXISTS rsvps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name      VARCHAR(100) NOT NULL,
  user_phone     VARCHAR(20) NOT NULL,
  parent_rsvp_id UUID REFERENCES rsvps(id),
  depth_level    INT NOT NULL DEFAULT 1,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: depth_level calculado pelo pai
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

DROP TRIGGER IF EXISTS trg_set_rsvp_depth ON rsvps;
CREATE TRIGGER trg_set_rsvp_depth
BEFORE INSERT ON rsvps
FOR EACH ROW EXECUTE FUNCTION set_rsvp_depth();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_public" ON events FOR SELECT TO anon USING (true);
CREATE POLICY "rsvps_select_public"  ON rsvps  FOR SELECT TO anon USING (true);

-- ============================================================
-- Storage: avatars (publico)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select_public" ON storage.objects
FOR SELECT TO anon USING (bucket_id = 'avatars');
