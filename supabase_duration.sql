-- Duração do evento (minutos) — pré-requisito pra travar bloco de tempo
-- no 168 no futuro (início + fim, não só início). Opções fixas na UI:
-- 1h/2h/3h/Período (4h)/Dia inteiro (8h). Nullable — "não informar".
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
