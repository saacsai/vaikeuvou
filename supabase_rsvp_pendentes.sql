-- external_reference da Mercado Pago tem limite de 64 caracteres — não cabe
-- o JSON com event_id/nome/telefone codificado. Guarda os dados aqui e usa
-- só o id (uuid) como referência; o webhook busca de volta por esse id.
-- Não aparece em nenhuma lista de convidados — é só uma ponte técnica.
create table rsvp_pendentes (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  user_name      text not null,
  user_phone     text not null,
  parent_rsvp_id uuid,
  created_at     timestamptz not null default now()
);
