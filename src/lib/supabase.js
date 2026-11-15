// Подключение к Supabase. Значения берутся из файла .env (см. .env.example).
// Здесь используется ТОЛЬКО публичный ключ (anon / publishable).
// Секретный ключ service_role в этом проекте не нужен и не должен здесь появляться.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// true, если .env заполнен (иначе форма честно сообщит, что отправка недоступна)
export const supabaseKonfiguriert =
  typeof url === 'string' && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url) && !url.includes('IHR-PROJEKT') &&
  typeof key === 'string' && key.length > 20;

export const supabase = supabaseKonfiguriert
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
