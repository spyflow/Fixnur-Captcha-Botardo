import { supabase } from '../../../../lib/supabaseClient'

export default async function handler(req, res) {
	const { token } = req.query

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	res.setHeader('Cache-Control', 'no-store')

	const { recaptchaToken } = req.body || {}
	if (!recaptchaToken) {
		return res.status(400).json({ error: 'Missing recaptchaToken' })
	}

	const secret = process.env.RECAPTCHA_SECRET_KEY
	if (!secret) {
		return res.status(500).json({ error: 'Missing server config: RECAPTCHA_SECRET_KEY' })
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

		// Optionally, enforce score/action for v3; for v2 checkbox it's enough that success=true
		const nowIso = new Date().toISOString()
		const { data, error } = await supabase
			.from('captcha_tokens')
			.update({ solved: true })
			.eq('token', token)
			.eq('solved', false)
			.gt('expires_at', nowIso)
			.select('id, solved, solved_at')
			.single()

		if (error || !data) {
			return res.status(404).json({ error: 'Token not found or already solved/expired' })
		}

		return res.status(200).json({ ok: true, solvedAt: data.solved_at })
	} catch (e) {
		return res.status(500).json({ error: 'Server error', details: e?.message || String(e) })
	}
}

