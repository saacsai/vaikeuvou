alter table users
  add column if not exists pode_criar_post boolean not null default false;
