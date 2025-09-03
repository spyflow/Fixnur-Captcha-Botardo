import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
	if (req.method !== 'GET' && req.method !== 'POST') {
		res.setHeader('Allow', 'GET, POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	const token =
		(req.method === 'GET' ? req.query?.token : req.body?.token) || ''

	if (!token || typeof token !== 'string') {
		return res.status(400).json({ error: 'Missing token' })
	}

	try {
		const { data, error } = await supabase
			.from('captcha_tokens')
			.select('solved')
			.eq('token', token)
			.single()

		if (error || !data) {
			// Not found => false
			return res.status(200).json(false)
		}

		// If solved is true, respond false; otherwise true
		return res.status(200).json(Boolean(data.solved))
	} catch (e) {
		return res.status(500).json({ error: 'Server error' })
	}
}

