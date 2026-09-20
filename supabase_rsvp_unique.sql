-- Evita duplicar RSVP quando dois checkouts pro mesmo telefone são iniciados
-- em paralelo antes do primeiro pagamento confirmar (a checagem de "já
-- confirmado" só olha essa tabela, que só é escrita depois do webhook).
alter table rsvps add constraint rsvps_event_phone_unique unique (event_id, user_phone);
