-- =====================================================================
-- Назначить пользователя администратором.
--
-- 1. Сначала создайте пользователя: Supabase → Authentication → Users →
--    "Add user" → "Create new user" (почта + пароль, галочка "Auto Confirm User").
-- 2. Замените адрес ниже на почту этого пользователя.
-- 3. Supabase → SQL Editor → вставьте этот текст → Run.
--
-- Пароль здесь НЕ указывается и нигде в коде не хранится.
-- =====================================================================

insert into public.admins (user_id)
select id from auth.users where email = 'E-MAIL-DES-ADMINS@example.com'
on conflict (user_id) do nothing;

-- Проверка: должна появиться одна строка с этой почтой.
select u.email, a.created_at
from public.admins a join auth.users u on u.id = a.user_id;
