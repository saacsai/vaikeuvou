-- Núcleo de evento pago (rateio/ticket) — ver
-- ~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md pro racional completo.
--
-- valor: preço por pessoa em reais (null = evento continua grátis, comportamento
--   inalterado). Confirmar presença (BORA) num evento com valor > 0 passa a exigir
--   pagamento antes de confirmar.
-- descricao_pacote / programacao: texto livre — o que está incluso, roteiro/horários
--   do evento. Opcionais, fazem mais sentido em evento pago mas não são exclusivos dele.
-- comissao_percentual: quanto o vaikeuvou retém sobre cada venda desse evento
--   especificamente. Default 15, editável por evento (parceiro pode negociar %
--   diferente com o Luciano/Sandro).
alter table events
  add column if not exists valor numeric(10,2),
  add column if not exists descricao_pacote text,
  add column if not exists programacao text,
  add column if not exists comissao_percentual numeric(5,2) not null default 15;

-- Rastreamento de pagamento por confirmação — cada rsvp de evento pago vira uma
-- transação. pago=false até o webhook do Stripe confirmar; rsvp só é considerado
-- "de verdade" confirmado, pro caso pago, quando pago=true (ver /api/rsvp/checkout
-- e /api/webhooks/stripe-evento).
alter table rsvps
  add column if not exists pago boolean not null default false,
  add column if not exists valor_pago numeric(10,2),
  add column if not exists stripe_session_id text;

create unique index if not exists rsvps_stripe_session_id_idx
  on rsvps (stripe_session_id) where stripe_session_id is not null;
