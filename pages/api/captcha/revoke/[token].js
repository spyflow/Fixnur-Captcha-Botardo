import { supabase } from '../../../../lib/supabaseClient'

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}
	const { token } = req.body || {}
	if (!token || typeof token !== 'string') {
		return res.status(400).json({ error: 'Missing token' })
	}
	try {
		const { data, error } = await supabase
			.from('captcha_tokens')
			.update({ solved: false, solved_at: null })
			.eq('token', token)
			.eq('solved', true)
			.select('id, solved')
			.single()
		if (error || !data) {
			return res.status(404).json({ error: 'Token not found or not solved' })
		}
		return res.status(200).json({ ok: true })
	} catch (e) {
		return res.status(500).json({ error: 'Server error' })
	}
}
