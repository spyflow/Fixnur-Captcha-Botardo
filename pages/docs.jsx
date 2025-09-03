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
      const resp = await fetch('/api/captcha/generateToken', { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.error || 'Falló la generación del token')
      }
      window.location.href = `/captcha/${data.token}?successmsg=Prueba completada con éxito`
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const setupSql = `
-- Habilita la extensión pgcrypto si aún no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crea la tabla para almacenar los tokens de captcha
CREATE TABLE public.captcha_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
    solved BOOLEAN NOT NULL DEFAULT FALSE,
    solved_at TIMESTAMPTZ
);

-- Agrega un índice en el token para búsquedas rápidas
CREATE INDEX idx_captcha_tokens_token ON public.captcha_tokens(token);

-- Opcional: Agrega un índice en expires_at para limpiezas eficientes
CREATE INDEX idx_captcha_tokens_expires_at ON public.captcha_tokens(expires_at);

-- Habilita la Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.captcha_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Permite el acceso de lectura pública a los tokens (necesario para la página del captcha)
CREATE POLICY "Allow public read access to tokens"
ON public.captcha_tokens FOR SELECT
USING (true);

-- Política: Permite la inserción de nuevos tokens a través de la clave de servicio
CREATE POLICY "Allow insert for service_role"
ON public.captcha_tokens FOR INSERT
WITH CHECK (true);

-- Política: Permite la actualización de tokens a través de la clave de servicio
CREATE POLICY "Allow update for service_role"
ON public.captcha_tokens FOR UPDATE
USING (true)
WITH CHECK (true);
  `.trim()

  const curlExample = `
curl -X POST "https://<tu-dominio>/api/captcha/generateToken"
  `.trim()

  const fetchExample = `
fetch('/api/captcha/generateToken', {
  method: 'POST'
})
.then(res => res.json())
.then(data => {
  console.log(data.token)
  // Redirige al usuario a /captcha/<token>
  window.location.href = \`/captcha/\${data.token}\`
})
  `.trim()

  return (
    <>
      <Head>
        <title>Fixnur Captcha - Documentación</title>
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
            <p style={{ fontSize: '1.1rem', color: '#555' }}>Una solución de captcha auto-alojada usando Next.js, Supabase y Google reCAPTCHA v2.</p>
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
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Visión General</h2>
            <p>Este proyecto proporciona una forma de proteger tus formularios y acciones de bots. Funciona generando un token único, presentando al usuario un desafío de reCAPTCHA y verificando la solución tanto en el frontend como en el backend.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Configuración</h2>

            <h3 style={{ fontSize: '1.5rem', color: '#1976d2', marginTop: '2rem' }}>1. Configuración de Supabase</h3>
            <p>Necesitas un proyecto de Supabase para almacenar y gestionar los tokens de captcha. Ejecuta el siguiente script SQL en el editor de SQL de tu proyecto de Supabase para crear la tabla <code>captcha_tokens</code> y configurar las políticas de seguridad necesarias.</p>
            <CodeBlock>{setupSql}</CodeBlock>

            <h3 style={{ fontSize: '1.5rem', color: '#1976d2', marginTop: '2rem' }}>2. Variables de Entorno</h3>
            <p>Crea un archivo <code>.env.local</code> en la raíz de tu proyecto y añade las siguientes variables:</p>
            <CodeBlock>{`
# URL de tu proyecto de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<id-proyecto>.supabase.co

# Clave de ROL DE SERVICIO de Supabase (¡Mantenla secreta!)
# Usada para escribir en la base de datos desde el backend
SUPABASE_SERVICE_ROLE_KEY=<tu-clave-de-servicio>

# Clave del sitio de Google reCAPTCHA v2 (pública)
# Se usa en el frontend para renderizar el widget
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<tu-clave-del-sitio-recaptcha>

# Clave secreta de Google reCAPTCHA v2 (¡Mantenla secreta!)
# Usada en el backend para verificar la respuesta del usuario
RECAPTCHA_SECRET_KEY=<tu-clave-secreta-recaptcha>

# Un secreto fuerte y aleatorio para firmar cookies CSRF (¡Mantenlo secreto!)
# Puedes generar uno con: openssl rand -hex 32
CAPTCHA_HMAC_SECRET=<tu-secreto-hmac-aleatorio>

# (Opcional) Lista de nombres de host permitidos para la verificación de reCAPTCHA, separados por comas
# Por defecto: localhost,127.0.0.1
CAPTCHA_ALLOWED_HOSTNAMES=tudominio.com,www.tudominio.com
            `.trim()}</CodeBlock>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Flujo y Uso de la API</h2>
            <p>El proceso de captcha tiene dos pasos principales:</p>

            <h3 style={{ fontSize: '1.5rem', color: '#1976d2', marginTop: '2rem' }}>Paso 1: Generar un Token</h3>
            <p>Tu backend debe realizar una petición <code>POST</code> al endpoint <code>/api/captcha/generateToken</code>. Esto crea un nuevo registro de captcha en tu base de datos y devuelve un token.</p>
            <p><strong>Ejemplo con cURL:</strong></p>
            <CodeBlock>{curlExample}</CodeBlock>
            <p><strong>Ejemplo con JavaScript (fetch):</strong></p>
            <CodeBlock>{fetchExample}</CodeBlock>
            <p>La respuesta será un JSON con el token:</p>
            <CodeBlock>{`
{
  "id": "...",
  "token": "a1b2c3d4...",
  "expiresAt": "..."
}
            `.trim()}</CodeBlock>

            <h3 style={{ fontSize: '1.5rem', color: '#1976d2', marginTop: '2rem' }}>Paso 2: Resolver el Captcha</h3>
            <p>Una vez que tienes el token, redirige al usuario a la página del captcha: <code>/captcha/&lt;token&gt;</code>. Puedes pasar un mensaje de éxito opcional con el parámetro de consulta <code>successmsg</code>.</p>
            <p>Ejemplo de URL: <code>https://&lt;tu-dominio&gt;/captcha/a1b2c3d4?successmsg=¡Gracias! Tu captcha ha sido verificado.</code></p>
            <p>La página se encargará de mostrar el reCAPTCHA, verificarlo y marcar el token como resuelto en la base de datos.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #e0eafc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Cómo Probar (Manualmente)</h2>
            <p>Para probar tu integración manualmente, sigue estos pasos:</p>
            <ol style={{ paddingLeft: '2rem' }}>
              <li>Asegúrate de que tu aplicación Next.js esté corriendo (<code>npm run dev</code>).</li>
              <li>Usa una herramienta como cURL, Postman, o el snippet de 'fetch' en la consola de tu navegador para llamar al endpoint <code>/api/captcha/generateToken</code>.</li>
              <li>Copia el <code>token</code> de la respuesta.</li>
              <li>En tu navegador, ve a <code>http://localhost:3000/captcha/&lt;token-copiado&gt;</code>.</li>
              <li>Deberías ver el widget de reCAPTCHA. Resuélvelo.</li>
              <li>Si tienes éxito, el estado en la página debería cambiar a 'solved'.</li>
              <li>Puedes verificar en tu tabla <code>captcha_tokens</code> de Supabase que el registro correspondiente ahora tiene <code>solved</code> establecido en <code>true</code>.</li>
            </ol>
          </section>

        </div>
      </div>
    </>
  )
}
