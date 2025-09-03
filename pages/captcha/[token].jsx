import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

export default function CaptchaPage({ token, siteKey, successmsg, valid }) {
  const containerRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !siteKey || !containerRef.current || rendered) return

    const onVerify = async (recaptchaToken) => {
      setStatus('verifying')
      setError(null)
      try {
        const resp = await fetch(`/api/captcha/solve/${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recaptchaToken }),
        })
        const json = await resp.json()
        if (!resp.ok) throw new Error(json.error || 'Verification failed')
        setStatus('solved')
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    }

    function renderWidget() {
      if (!window.grecaptcha || !window.grecaptcha.render) return
      if (!containerRef.current || rendered) return
      window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
      })
      setRendered(true)
    }

    // Load reCAPTCHA script if not present
    if (typeof window !== 'undefined') {
      if (!document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
        s.async = true
        s.defer = true
        s.onload = () => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(renderWidget)
          } else {
            renderWidget()
          }
        }
        document.body.appendChild(s)
      } else {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(renderWidget)
        } else {
          setTimeout(renderWidget, 300)
        }
      }
    }
  }, [mounted, siteKey, token, rendered])

  // SVGs for favicon (blue for light, white for dark)
  const faviconLight =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path d="M24 4L40 10V22C40 33.0457 32.0457 41 24 44C15.9543 41 8 33.0457 8 22V10L24 4Z" fill="#1976d2"/>
        <path d="M24 8V40" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="5" fill="#fff"/>
      </svg>
    `)
  const faviconDark =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path d="M24 4L40 10V22C40 33.0457 32.0457 41 24 44C15.9543 41 8 33.0457 8 22V10L24 4Z" fill="#fff"/>
        <path d="M24 8V40" stroke="#1976d2" stroke-width="3" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="5" fill="#1976d2"/>
      </svg>
    `)
  return (
    <>
      <Head>
          <title>Fixnur Captcha</title>
          <link rel="icon" id="dynamic-favicon" href={faviconLight} />
          <script dangerouslySetInnerHTML={{
            __html: `
              function setFavicon() {
                var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var favicon = document.getElementById('dynamic-favicon');
                if (favicon) {
                  favicon.href = isDark ? '${faviconDark}' : '${faviconLight}';
                }
              }
              setFavicon();
              window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setFavicon);
            `
          }} />
        </Head>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)',
          fontFamily: 'Inter, Arial, sans-serif',
        }}>
        <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: 32,
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L40 10V22C40 33.0457 32.0457 41 24 44C15.9543 41 8 33.0457 8 22V10L24 4Z" fill="#1976d2"/>
            <path d="M24 8V40" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="5" fill="#fff"/>
          </svg>
          <h1 style={{ fontWeight: 700, fontSize: 28, margin: '8px 0 0', color: '#2a3a4b' }}>
            Fixnur Captcha
          </h1>
        </div>
        {!valid ? (
          <>
            <h2 style={{ color: '#d32f2f', fontSize: 20, margin: '24px 0 8px' }}>Token inválido</h2>
            <p style={{ color: '#555', marginBottom: 0 }}>El token no existe o ya fue eliminado.</p>
          </>
        ) : !siteKey ? (
          <>
            <h2 style={{ color: '#d32f2f', fontSize: 20, margin: '24px 0 8px' }}>Configuración requerida</h2>
            <p style={{ color: '#555', marginBottom: 0 }}>Falta configurar NEXT_PUBLIC_RECAPTCHA_SITE_KEY en el entorno.</p>
          </>
        ) : (
          <>
            <h2 style={{ fontWeight: 600, fontSize: 20, margin: '24px 0 8px', color: '#1976d2' }}>Verificación</h2>
            <p style={{ color: '#555', marginBottom: 24 }}>Completa el reCAPTCHA para continuar.</p>
            <div style={{ margin: '0 auto', maxWidth: 300 }}>
              {mounted ? (
                <div ref={containerRef} />
              ) : (
                <div style={{ height: 78, background: '#fafafa', border: '1px solid #eee', borderRadius: 8 }} />
              )}
            </div>
            <p style={{ marginTop: 24, fontSize: 16, color: status === 'solved' ? '#388e3c' : '#555' }}>
              {successmsg
                ? (status === 'solved' ? successmsg : ' ')
                : <>Estado: {status}{error ? ` — ${error}` : ''}</>}
            </p>
          </>
        )}
      </div>
      </div>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const { token } = ctx.params
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null
  const successmsg = typeof ctx.query.successmsg === 'string' ? ctx.query.successmsg : null
  // Check token existence via internal API
  let valid = false
  try {
    const existUrl = `/api/captcha/exist/${encodeURIComponent(token)}`

    console.log('[captcha] exist check start', { token, existUrl })
    const resp = await fetch(existUrl)
    if (resp.ok) {
      let parsedAs = 'unknown'
      try {
        const json = await resp.json()
        valid = json === true
        parsedAs = 'json'
      } catch {
        const text = (await resp.text()).trim()
        valid = text === 'true'
        parsedAs = 'text'
      }
      console.log('[captcha] exist check result', { token, status: resp.status, parsedAs, valid })
    } else {
      valid = false
      console.warn('[captcha] exist check non-200', { token, status: resp.status })
    }
  } catch {
    valid = false
    console.error('[captcha] exist check error', { token })
  }
  const hmacSecret = process.env.CAPTCHA_HMAC_SECRET || null
  if (hmacSecret && valid) {
    const ua = ctx.req.headers['user-agent'] || ''
    const { createHmac } = await import('crypto')
    const sig = createHmac('sha256', hmacSecret)
      .update(`${token}.${ua}`)
      .digest('hex')
    const cookie = `captcha_csrf=${token}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
    ctx.res.setHeader('Set-Cookie', cookie)
  }
  return { props: { token, siteKey, successmsg, valid } }
}
