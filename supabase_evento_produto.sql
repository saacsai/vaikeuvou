-- Evento "pago com produtos" — upsell opcional de troca (ex: "leve 10 latinhas
-- + 10 PET e ganhe fila preferencial"), NÃO trava o BORA como evento pago em
-- dinheiro. Confirmar presença continua funcionando normal (como grátis);
-- quem confirma só ganha uma opção extra de marcar que vai levar o produto
-- pedido em troca da vantagem oferecida. O organizador confirma o
-- recebimento de verdade no dia, pela lista de convidados.
--
-- Mesma lógica de inferência já usada pro evento pago (valor preenchido =
-- pago): produto_descricao preenchido = evento oferece essa troca. Sem
-- coluna de "tipo" nova — evita estado redundante que possa divergir.

alter table events
  add column if not exists produto_descricao text,
  add column if not exists produto_vantagem text;

alter table rsvps
  add column if not exists vai_levar_produto boolean not null default false,
  add column if not exists produto_confirmado boolean not null default false,
  add column if not exists produto_confirmado_em timestamptz;

-- vkv_confirmar_rsvp ganha o parâmetro novo no final, com default — não
-- quebra nenhuma chamada existente (checkout pago, RSVP grátis antigo).
create or replace function vkv_confirmar_rsvp(
  p_event_id uuid,
  p_user_name text,
  p_user_phone text,
  p_parent_rsvp_id uuid default null,
  p_pago boolean default false,
  p_valor_pago numeric default null,
  p_mp_payment_id text default null,
  p_vai_levar_produto boolean default false
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

  insert into rsvps (event_id, user_name, user_phone, parent_rsvp_id, pago, valor_pago, mp_payment_id, vai_levar_produto)
  values (p_event_id, p_user_name, p_user_phone, p_parent_rsvp_id, p_pago, p_valor_pago, p_mp_payment_id, p_vai_levar_produto)
  returning * into v_rsvp;

  return v_rsvp;
end;
$$;
