alter table rsvps add column mp_payment_id text;
create unique index rsvps_mp_payment_id_idx on rsvps (mp_payment_id) where mp_payment_id is not null;

alter table users add column mp_access_token text;
alter table users add column mp_refresh_token text;
alter table users add column mp_user_id text;
