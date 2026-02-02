// ══════════════════════════════════════════
// HYROX SIM — Authentication Module
// ══════════════════════════════════════════

import { supabase } from './supabase-client.js'

export async function signUp(email, password, displayName, division) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, division }
    }
  })
  if (error) throw error

  // Update profile with division if signup succeeded
  if (data.user && division) {
    await supabase.from('profiles').update({ division }).eq('id', data.user.id)
  }

  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  })
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
