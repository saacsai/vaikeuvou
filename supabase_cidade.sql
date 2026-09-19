-- Campo cidade nos eventos — estruturado (slug), não inferido de `location`
-- (que é texto livre de endereço). É a chave usada pra casar evento com
-- categoria de cidade no blog.vaikeuvou.app e, no futuro, pra uma página
-- pública tipo vaikeuvou.app/bertioga listando eventos daquela praça.
-- Opcional — só preenchido em eventos ligados a um QG/destino turístico,
-- eventos sociais comuns ficam null.
alter table events add column if not exists cidade text;
