-- Campos extras de perfil: bio e instagram vão na assinatura do convite,
-- vibe fica interno (uso futuro: gerador de imagem por IA)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vibe TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;
