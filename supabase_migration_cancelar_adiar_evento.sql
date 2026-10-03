-- Cancelar/adiar evento (botões no painel, além do fluxo de quórum que já
-- existia). cancelado_em já existe (migration do quórum) — reaproveitado
-- como flag geral de cancelamento, não só da decisão de viabilização.
alter table events
  add column if not exists motivo_cancelamento text,
  add column if not exists adiado_em timestamptz,
  add column if not exists motivo_adiamento text,
  add column if not exists data_a_definir boolean not null default false;
