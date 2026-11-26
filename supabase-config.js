
const SUPABASE_URL = "https://tlpfgklildgymaunyejs.supabase.co";

const SUPABASE_KEY = "PEGA_AQUI_TU_CLAVE_SB_PUBLISHABLE";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
