import { supabase } from '../../../../lib/supabaseClient'
import { createHmac, timingSafeEqual } from 'crypto'

export default async function handler(req, res) {


	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	res.setHeader('Cache-Control', 'no-store')


		const { recaptchaToken } = req.body || {}
		const token = req.query.token
		if (!token || typeof token !== 'string') {
			return res.status(400).json({ error: 'Missing token in query' })
		}
		if (!recaptchaToken) {
			return res.status(400).json({ error: 'Missing recaptchaToken' })
		}

	const secret = process.env.RECAPTCHA_SECRET_KEY
	if (!secret) {
		return res.status(500).json({ error: 'Missing server config: RECAPTCHA_SECRET_KEY' })
	}

		// CSRF-style cookie check to ensure the user visited our captcha page
		const csrfCookie = req.cookies?.['captcha_csrf']
		const hmacSecret = process.env.CAPTCHA_HMAC_SECRET
		if (!hmacSecret) {
			return res.status(500).json({ error: 'Missing server config: CAPTCHA_HMAC_SECRET' })
		}
		if (!csrfCookie || typeof csrfCookie !== 'string') {
			return res.status(403).json({ error: 'Missing captcha cookie' })
		}
		const [cookieToken, cookieSig] = csrfCookie.split('.')
		if (cookieToken !== token || !cookieSig) {
			return res.status(403).json({ error: 'Invalid captcha cookie' })
		}
		const userAgent = (req.headers['user-agent'] || '')
		const expectedSig = createHmac('sha256', hmacSecret)
			.update(`${token}.${userAgent}`)
			.digest('hex')
		try {
			const a = Buffer.from(cookieSig, 'hex')
			const b = Buffer.from(expectedSig, 'hex')
			if (a.length !== b.length || !timingSafeEqual(a, b)) {
				return res.status(403).json({ error: 'Invalid captcha cookie signature' })
			}
		} catch {
			return res.status(403).json({ error: 'Invalid captcha cookie format' })
		}

	// Optional: send user IP
		const ipRaw = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString()
	const remoteip = ipRaw.split(',')[0].trim() || undefined

	try {
		const params = new URLSearchParams({
			secret,
			response: recaptchaToken,
		})
		if (remoteip) params.append('remoteip', remoteip)

		const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: params.toString(),
		})
			const verify = await verifyResp.json()

			if (!verify.success) {
			return res.status(400).json({ error: 'reCAPTCHA failed', details: verify['error-codes'] || null })
		}

			// Enforce expected hostname from Google verify response
				const allowedHostnames = (process.env.CAPTCHA_ALLOWED_HOSTNAMES || 'localhost,127.0.0.1')
				.split(',')
				.map(h => h.trim().toLowerCase())
				.filter(Boolean)
			const hostname = (verify.hostname || '').toLowerCase()
			if (hostname && !allowedHostnames.includes(hostname)) {
				return res.status(400).json({ error: 'reCAPTCHA hostname mismatch', hostname })
			}

				// Load row first to avoid DB clock skew issues
				const { data: row, error: selErr } = await supabase
					.from('captcha_tokens')
					.select('id, solved, expires_at')
					.eq('token', token)
					.single()

				if (selErr || !row) {
					return res.status(404).json({ error: 'Token not found' })
				}
				if (row.solved) {
					return res.status(409).json({ error: 'Token already solved' })
				}
				const expired = row.expires_at && new Date(row.expires_at).getTime() <= Date.now()
				if (expired) {
					return res.status(410).json({ error: 'Token expired' })
				}

				const { data: upd, error: updErr } = await supabase
					.from('captcha_tokens')
					.update({ solved: true })
					.eq('id', row.id)
					.eq('solved', false)
					.select('id, solved_at')
					.single()

				if (updErr || !upd) {
					return res.status(409).json({ error: 'Failed to mark solved' })
				}

				// Clear CSRF cookie after success
				res.setHeader('Set-Cookie', 'captcha_csrf=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
				return res.status(200).json({ ok: true, solvedAt: upd.solved_at })
	} catch (e) {
		return res.status(500).json({ error: 'Server error', details: e?.message || String(e) })
	}
}

