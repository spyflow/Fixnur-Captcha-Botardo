import { supabase } from '../../../../lib/supabaseClient'

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}
	const token = req.query.token
	if (!token || typeof token !== 'string') {
		return res.status(400).json({ error: 'Missing token' })
	}
	try {
		const { data, error } = await supabase
			.from('captcha_tokens')
			.select('id, solved')
			.eq('token', token)
			.single()

		if (error || !data) {
			return res.status(200).json({ valid: false, solved: false })
		}

		res.status(200).json({ valid: true, solved: data.solved })
	} catch (e) {
		res.status(200).json({ valid: false, solved: false })
	}
}
