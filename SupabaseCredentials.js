import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ztbplugqqtemidsmbmoy.supabase.co";
// "https://fastrdjgttfnqkggxhmu.supabase.co";

const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0YnBsdWdxcXRlbWlkc21ibW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjY2NTEsImV4cCI6MjA3MTkwMjY1MX0.zTiTnJrpMCamu_9VXdXfo5FMX-qiOpna3giwLHHp_x8";
//"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhc3RyZGpndHRmbnFrZ2d4aG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTM5OTMsImV4cCI6MjA3MTgyOTk5M30.nYT9qKQ3P_pPIIL2HLVz-nzoivTsvTpwlVm5IU9S0to";

export const supabase = createClient(supabaseUrl, supabaseKey);
