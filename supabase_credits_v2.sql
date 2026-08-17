-- Bucket público pra upload de imagem de cabeçalho customizada (gate de 1 crédito)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-headers', 'event-headers', true)
ON CONFLICT (id) DO NOTHING;
