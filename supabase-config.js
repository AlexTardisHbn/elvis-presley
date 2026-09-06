// ----------------------------------------------------------------
// CONFIGURATION SUPABASE
// Remplace les deux valeurs ci-dessous par celles de TON projet Supabase
// (Dashboard Supabase > Project Settings > API)
// ----------------------------------------------------------------
const SUPABASE_URL = "https://TON-PROJET.supabase.co";
const SUPABASE_ANON_KEY = "TA_CLE_ANON_PUBLIC";

// L'anon key est publique par design : elle n'autorise que ce que tes
// règles RLS (Row Level Security) permettent. Ne jamais mettre ici
// la "service_role key", qui donne un accès total à la base.
