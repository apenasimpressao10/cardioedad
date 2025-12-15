
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dagglfeyevdvkcfnfkot.supabase.co';
const supabaseKey = 'sb_publishable_w7awhKr2IF1j2aDnaKbT8g_7AbTdnIE';

// In a real production app, use environment variables.
// Since this key was provided as public/publishable, we use it directly for the prototype.
export const supabase = createClient(supabaseUrl, supabaseKey);
