// frontend/src/supabase.js

import { createClient } from '@supabase/supabase-js'

console.log("URL RECIBIDA:", import.meta.env.VITE_SUPABASE_URL);
console.log("KEY RECIBIDA:", import.meta.env.VITE_SUPABASE_ANON_KEY);

// Obtenemos las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Creamos y exportamos el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)