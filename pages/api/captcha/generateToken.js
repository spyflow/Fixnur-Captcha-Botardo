import { randomBytes } from 'crypto'
import { supabase } from '../../../lib/supabaseClient'

// Generate a cryptographically-strong, URL-safe token
function generateToken(bytes = 32) {
	// Hex avoids base64 padding and URL issues; 32 bytes -> 64 hex chars
	return randomBytes(bytes).toString('hex')
}

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	res.setHeader('Cache-Control', 'no-store')

	// Gather some optional context
	const ipRaw = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString()
	const ip = ipRaw.split(',')[0].trim() || null
	const userAgent = (req.headers['user-agent'] || null)

	// Optional: allow custom TTL via minutes param; otherwise DB default (15m)
	// const ttlMinutes = Number(req.query.ttl) || null
	// const expires_at = ttlMinutes ? new Date(Date.now() + ttlMinutes * 60_000).toISOString() : undefined

	// Try a few times in the unlikely event of a token collision
	const maxAttempts = 3
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const token = generateToken()

		const insertPayload = {
			token,
			ip_address: ip,
			user_agent: userAgent,
			// expires_at, // uncomment if you want the API to set it explicitly
		}

		const { data, error } = await supabase
			.from('captcha_tokens')
			.insert(insertPayload)
			.select('id, token, expires_at')
			.single()

		if (!error) {
			return res.status(201).json({
				id: data.id,
				token: data.token,
				expiresAt: data.expires_at,
			})
		}

		// If unique violation on token, retry; otherwise return error
		const isUniqueViolation =
			typeof error.message === 'string' && /duplicate key|unique constraint/i.test(error.message)

		if (!isUniqueViolation || attempt === maxAttempts) {
			return res.status(500).json({ error: 'Failed to create token', details: error.message || error })
		}
	}

	// Should never reach here
	return res.status(500).json({ error: 'Unexpected error' })
}

