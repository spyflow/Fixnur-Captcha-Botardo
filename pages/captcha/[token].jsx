import { useEffect, useRef, useState } from 'react'

export default function CaptchaPage({ token, siteKey, successmsg }) {
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

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>
      {!siteKey ? (
        <>
          <h1>Configuración requerida</h1>
          <p>Falta configurar NEXT_PUBLIC_RECAPTCHA_SITE_KEY en el entorno.</p>
        </>
      ) : (
        <>
          <h1>Verificación</h1>
          <p>Completa el reCAPTCHA para continuar.</p>
          {mounted ? (
            <div ref={containerRef} />
          ) : (
            <div style={{ height: 78, background: '#fafafa', border: '1px solid #eee' }} />
          )}
          {successmsg
            ? (status === 'solved' && <p style={{ marginTop: 16 }}>{successmsg}</p>)
            : <p style={{ marginTop: 16 }}>Estado: {status}{error ? ` — ${error}` : ''}</p>
          }
        </>
      )}
    </main>
  )
}

export async function getServerSideProps(ctx) {
  const { token } = ctx.params
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null
  const successmsg = typeof ctx.query.successmsg === 'string' ? ctx.query.successmsg : null
  const hmacSecret = process.env.CAPTCHA_HMAC_SECRET || null
  if (hmacSecret) {
    const ua = ctx.req.headers['user-agent'] || ''
    const { createHmac } = await import('crypto')
    const sig = createHmac('sha256', hmacSecret)
      .update(`${token}.${ua}`)
      .digest('hex')
    const cookie = `captcha_csrf=${token}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
    ctx.res.setHeader('Set-Cookie', cookie)
  }
  return { props: { token, siteKey, successmsg } }
}
