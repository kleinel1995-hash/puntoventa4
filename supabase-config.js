
const SUPABASE_URL = "https://tlpfgklildgymaunyejs.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_d9OYiTnEDPaULV0ZrewUnA_Gi_ybS_2";

const TABLE = "productos_pos";
const LIMITE_STOCK = 5;

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
