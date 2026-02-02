// ══════════════════════════════════════════
// HYROX SIM — Shared JavaScript
// ══════════════════════════════════════════

import { supabase } from './supabase-client.js'

// ── Intersection Observer for fade-in animations ──
export function initFadeIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
  }, { threshold: 0.15 })
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
}

// ── Hamburger Menu ──
export function initHamburger() {
  const hamburger = document.getElementById('hamburger')
  const mobileMenu = document.getElementById('mobileMenu')
  const mobileClose = document.getElementById('mobileClose')
  if (!hamburger || !mobileMenu) return

  function closeMenu() {
    hamburger.classList.remove('active')
    mobileMenu.classList.remove('open')
    document.body.style.overflow = ''
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active')
    mobileMenu.classList.toggle('open')
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : ''
  })

  if (mobileClose) mobileClose.addEventListener('click', closeMenu)

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMenu)
  })
}

// ── Auth State in Nav ──
export async function initAuthNav() {
  const { data: { session } } = await supabase.auth.getSession()
  const navRight = document.querySelector('.nav-right')
  const mobileMenu = document.getElementById('mobileMenu')

  if (!navRight) return

  if (session) {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single()

    const initial = (profile?.display_name || session.user.email)?.[0]?.toUpperCase() || '?'

    navRight.innerHTML = `
      <div class="nav-auth">
        <a href="dashboard.html" class="nav-avatar" title="Dashboard">${initial}</a>
        <button class="nav-logout" id="navLogout">Log Out</button>
      </div>
    `
    document.getElementById('navLogout')?.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = 'index.html'
    })

    // Update mobile menu
    if (mobileMenu) {
      const mobileClose = mobileMenu.querySelector('.mobile-close')
      const existingLinks = mobileMenu.innerHTML
      // Add dashboard link and logout at bottom of mobile menu
      const dashLink = document.createElement('a')
      dashLink.href = 'dashboard.html'
      dashLink.className = 'mobile-nav-link'
      dashLink.textContent = 'Dashboard'
      if (mobileClose && mobileClose.nextSibling) {
        mobileMenu.insertBefore(dashLink, mobileClose.nextSibling)
      }
    }
  } else {
    navRight.innerHTML = `
      <a href="login.html" class="nav-cta">Sign In</a>
    `
  }
}

// ── Toast Notifications ──
export function showToast(message, type = 'success', duration = 3000) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  requestAnimationFrame(() => {
    toast.classList.add('show')
  })

  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// ── Require Auth (redirect if not logged in) ──
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'login.html'
    return null
  }
  return session
}

// ── Get Current User Profile ──
export async function getCurrentProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return data
}

// ── Format Time Helpers ──
export function formatTimeMs(ms) {
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}

export function formatTimeSec(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
  }
  return `${mins}:${String(secs).padStart(2,'0')}`
}

// ── Initialize Common Elements ──
export function initPage() {
  initFadeIn()
  initHamburger()
  initAuthNav()
}
