export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}
	const token = req.query.token
	if (!token || typeof token !== 'string') {
		return res.status(400).json({ error: 'Missing token' })
	}
	return res.status(200).json({ ok: true })
}
