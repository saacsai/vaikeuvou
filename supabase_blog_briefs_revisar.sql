-- Adiciona o tipo 'Revisar' à fila editorial: pauta de revisão de um post já
-- publicado (título = título exato do post existente no WordPress; ideias
-- centrais = o que precisa mudar). Quem processa tem que ler o post original
-- antes de reformular, não escrever do zero como nos outros tipos.
alter table blog_briefs drop constraint if exists blog_briefs_tipo_check;
alter table blog_briefs add constraint blog_briefs_tipo_check
  check (tipo in ('VaikeuFui', 'Tendeu', 'ProntoFalei', 'VamoAi', 'Revisar'));
