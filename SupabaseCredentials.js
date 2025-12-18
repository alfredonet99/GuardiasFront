import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://fastrdjgttfnqkggxhmu.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhc3RyZGpndHRmbnFrZ2d4aG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTM5OTMsImV4cCI6MjA3MTgyOTk5M30.nYT9qKQ3P_pPIIL2HLVz-nzoivTsvTpwlVm5IU9S0to";

export const supabase = createClient(supabaseUrl, supabaseKey);