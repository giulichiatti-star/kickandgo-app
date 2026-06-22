-- Tabla lesiones
create table if not exists lesiones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  jugador_id    uuid not null references jugadores(id) on delete cascade,
  tipo          text not null default '',
  zona          text not null default '',
  gravedad      text not null default 'leve', -- leve | moderada | grave
  fecha_inicio  date not null,
  fecha_alta    date,
  notas         text default '',
  alta          boolean not null default false,
  creado        timestamptz default now()
);

alter table lesiones enable row level security;

drop policy if exists "lesiones propias" on lesiones;
create policy "lesiones propias" on lesiones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices
create index if not exists lesiones_user_id_idx on lesiones(user_id);
create index if not exists lesiones_jugador_id_idx on lesiones(jugador_id);
