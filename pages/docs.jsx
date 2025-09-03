import Head from 'next/head'
import { useState } from 'react'

const CodeBlock = ({ children }) => (
  <pre style={{
    background: '#f4f4f4',
    padding: '1rem',
    borderRadius: 8,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  }}>
    <code>{children}</code>
  </pre>
)

export default function DocsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleTestClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('https://captcha.spyflow.tech/api/captcha/generateToken', { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.error || 'Falló la generación del token')
      }
      // Redirect to the production captcha page with the new token
      window.location.href = `https://captcha.spyflow.tech/captcha/${data.token}?successmsg=Prueba completada con éxito`
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const curlExample = `
curl -X POST "https://captcha.spyflow.tech/api/captcha/generateToken"
  `.trim()

  const fetchExample = `
fetch('https://captcha.spyflow.tech/api/captcha/generateToken', {
  method: 'POST'
})
.then(res => res.json())
.then(data => {
  if (data.token) {
    // Redirect the user to the captcha page
    window.location.href = \`https://captcha.spyflow.tech/captcha/\${data.token}\`
  }
})
  `.trim()

  return (
    <>
      <Head>
        <title>Documentación del Servicio de Captcha</title>
      </Head>
      <div style={{
        padding: '2rem 4rem',
        fontFamily: 'Inter, Arial, sans-serif',
        lineHeight: 1.7,
        color: '#2a3a4b',
        background: '#fcfdff'
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <header style={{ borderBottom: '1px solid #e0eafc', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#1976d2' }}>Documentación de Fixnur Captcha</h1>
            <p style={{ fontSize: '1.1rem', color: '#555' }}>Una guía para integrar el servicio de captcha de Fixnur en tus aplicaciones.</p>
          </header>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Prueba Interactiva</h2>
            <p>Haz clic en el botón de abajo para iniciar un flujo de captcha de prueba. Serás redirigido a la página del captcha para resolver el desafío.</p>
            <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#f4f7fc', borderRadius: 8, textAlign: 'center' }}>
              <button
                onClick={handleTestClick}
                disabled={loading}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Generando Token...' : 'Iniciar Prueba de Captcha'}
              </button>
              {error && (
                <p style={{ color: '#d32f2f', marginTop: '1rem' }}>
                  <strong>Error:</strong> {error}
                </p>
              )}
            </div>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Cómo Funciona</h2>
            <p>El servicio de Captcha de Fixnur está diseñado para proteger tus aplicaciones de bots de una manera sencilla. El flujo de integración consta de dos pasos:</p>
            <ol style={{ paddingLeft: '2rem', listStyle: 'decimal' }}>
                <li>Tu aplicación solicita un token de captcha a nuestra API.</li>
                <li>Rediriges al usuario a nuestra página de captcha con el token obtenido.</li>
                <li>El usuario resuelve el captcha, y nosotros nos encargamos de la verificación.</li>
            </ol>
             <p>Una vez que el captcha es resuelto, el token queda marcado como verificado. Tu aplicación puede entonces consultar el estado del token si es necesario (aunque el flujo principal no lo requiere).</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Guía de Integración</h2>

            <h3 style={{ fontSize: '1.5rem', color: '#1976d2', marginTop: '2rem' }}>Paso 1: Generar un Token de Captcha</h3>
            <p>Para iniciar el proceso, tu backend o frontend debe realizar una petición <code>POST</code> a nuestro endpoint para generar un token único.</p>
            <p><strong>Endpoint:</strong></p>
            <CodeBlock>POST https://captcha.spyflow.tech/api/captcha/generateToken</CodeBlock>

            <p><strong>Ejemplo con cURL:</strong></p>
            <CodeBlock>{curlExample}</CodeBlock>

            <p><strong>Ejemplo con JavaScript (fetch):</strong></p>
            <CodeBlock>{fetchExample}</CodeBlock>

            <p>La respuesta de la API será un objeto JSON que contiene el token:</p>
            <CodeBlock>{`
{
  "id": "a1b2c3d4-e5f6-...",
  "token": "abcdef123456...",
  "expiresAt": "2024-01-01T12:15:00Z"
}
            `.trim()}</CodeBlock>

            <h3 style={{ fontSize: '1.5rem', color: '#1976d2', marginTop: '2rem' }}>Paso 2: Redirigir al Usuario</h3>
            <p>Con el <code>token</code> obtenido, redirige al usuario a la siguiente URL:</p>
            <CodeBlock>https://captcha.spyflow.tech/captcha/&lt;TU_TOKEN_AQUI&gt;</CodeBlock>
            <p>Por ejemplo, si tu token es <code>abcdef123456</code>, la URL sería:</p>
            <CodeBlock>https://captcha.spyflow.tech/captcha/abcdef123456</CodeBlock>

            <h4 style={{ fontSize: '1.2rem', color: '#1976d2', marginTop: '2rem' }}>Parámetros Opcionales</h4>
            <p>Puedes añadir un mensaje de éxito personalizado que se mostrará al usuario después de resolver el captcha. Usa el parámetro de consulta <code>successmsg</code>.</p>
            <p><strong>Ejemplo:</strong></p>
            <CodeBlock>https://captcha.spyflow.tech/captcha/&lt;TU_TOKEN_AQUI&gt;?successmsg=¡Verificación completada! Ya puedes volver a la aplicación.</CodeBlock>
             <p>Una vez el usuario resuelve el captcha en nuestra página, el proceso ha finalizado. No se requiere ninguna acción adicional por parte de tu aplicación.</p>
          </section>

        </div>
      </div>
    </>
  )
}
