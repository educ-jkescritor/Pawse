const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://tcozndaljggxtvitejtd.supabase.co"
const supabaseKey = "sb_publishable_uHb1sGy4Cs298PDU2mHXTg_pN5nBlOA";

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
