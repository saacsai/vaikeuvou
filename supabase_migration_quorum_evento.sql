-- Quórum de evento: vagas mínimas/máximas + data de decisão de viabilização.
-- Obrigatório na criação, exceto quando o evento usa checkout externo
-- (organizador controla isso do lado dele, fora do nosso alcance).
alter table events
  add column if not exists vagas_minimas integer,
  add column if not exists vagas_maximas integer,
  add column if not exists data_viabilizacao date,
  add column if not exists viabilizacao_confirmada_em timestamptz,
  add column if not exists cancelado_em timestamptz;

-- Contador de clique no link externo (nível 1 de atribuição discutido —
-- clique, não conversão confirmada).
create table if not exists event_external_clicks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table event_external_clicks enable row level security;

create policy "qualquer um pode registrar clique"
  on event_external_clicks for insert
  with check (true);

create policy "dono do evento ve os proprios cliques"
  on event_external_clicks for select
  using (
    exists (
      select 1 from events
      where events.id = event_external_clicks.event_id
      and events.user_id = auth.uid()
    )
  );

-- RSVP atômico: trava a linha do evento (serializa concorrência na mesma
-- vaga), checa vagas_maximas, só então insere. Sem isso, duas pessoas
-- confirmando a última vaga ao mesmo tempo furam o limite.
create or replace function vkv_confirmar_rsvp(
  p_event_id uuid,
  p_user_name text,
  p_user_phone text,
  p_parent_rsvp_id uuid default null,
  p_pago boolean default false,
  p_valor_pago numeric default null,
  p_mp_payment_id text default null
) returns rsvps
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_count integer;
  v_rsvp rsvps;
begin
  perform 1 from events where id = p_event_id for update;

  select vagas_maximas into v_max from events where id = p_event_id;

  if v_max is not null then
    select count(*) into v_count from rsvps where event_id = p_event_id;
    if v_count >= v_max then
      raise exception 'evento_lotado' using errcode = 'P0001';
    end if;
  end if;

  insert into rsvps (event_id, user_name, user_phone, parent_rsvp_id, pago, valor_pago, mp_payment_id)
  values (p_event_id, p_user_name, p_user_phone, p_parent_rsvp_id, p_pago, p_valor_pago, p_mp_payment_id)
  returning * into v_rsvp;

  return v_rsvp;
end;
$$;
