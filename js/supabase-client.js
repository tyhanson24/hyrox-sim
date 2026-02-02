import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://yehktkkjjuyhlwpkmfgh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaGt0a2tqanV5aGx3cGttZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjc2NDUsImV4cCI6MjA4NTYwMzY0NX0.20CyazFHCr_V9RqG-noXCzGmlwaRV7_3MAyr_uRp9wQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
