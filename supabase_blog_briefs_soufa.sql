-- Adiciona o tipo 'SouFa' (5º pilar #SouFã, post-âncora de destino) à fila
-- editorial — mesmo padrão de disparo manual do VaikeuFui/Tendeu/ProntoFalei.
alter table blog_briefs drop constraint if exists blog_briefs_tipo_check;
alter table blog_briefs add constraint blog_briefs_tipo_check
  check (tipo in ('VaikeuFui', 'Tendeu', 'ProntoFalei', 'VamoAi', 'Revisar', 'SouFa'));
