-- Apply confirmed branch WhatsApp routing and continuous 24-hour service.
update public.ambiiflora_branch_settings
set whatsapp = case branch_id
  when 'tranquila' then '2348101702422'
  when 'tranquila-nest' then '2348133509133'
  else whatsapp
end,
open = '08:00',
close = '08:00',
updated_at = now()
where branch_id in ('tranquila', 'tranquila-nest');

insert into public.ambiiflora_branch_settings (branch_id, whatsapp, open, close, paused)
values
  ('tranquila', '2348101702422', '08:00', '08:00', false),
  ('tranquila-nest', '2348133509133', '08:00', '08:00', false)
on conflict (branch_id) do update set
  whatsapp = excluded.whatsapp,
  open = excluded.open,
  close = excluded.close,
  updated_at = now();
