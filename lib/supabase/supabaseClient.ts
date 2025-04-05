import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

if(supabaseUrl === undefined || supabaseKey === undefined) {
    throw new Error('Missing Supabase credentials')
}
export const supabase = createClient(supabaseUrl, supabaseKey)

export const signOut = async () => {
    await supabase.auth.signOut()
}