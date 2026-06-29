export default function Privacidad() {
  const fecha = '21 de junio de 2026'
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 text-[13px] leading-relaxed">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Política de Privacidad</h1>
        <p className="text-muted text-xs">Última actualización: {fecha}</p>
      </div>

      <Section titulo="1. Responsable del tratamiento">
        <p><b>KICK AND GO</b> es el responsable del tratamiento de los datos personales recogidos a través de esta aplicación.</p>
        <p className="mt-2">Puedes contactarnos en: <a href="mailto:kickandgoapp@gmail.com" className="text-cyan underline">kickandgoapp@gmail.com</a></p>
      </Section>

      <Section titulo="2. Datos que recogemos">
        <ul className="list-disc list-inside space-y-1 text-muted">
          <li>Dirección de correo electrónico (para autenticación)</li>
          <li>Nombre del entrenador y nombre del club (introducidos por el usuario)</li>
          <li>Datos del equipo: jugadores, partidos, entrenamientos, tarjetas, lesiones (introducidos por el usuario)</li>
          <li>Escudo del club, si se sube una imagen</li>
        </ul>
        <p className="mt-2">No recogemos datos de menores de 16 años. No recogemos datos sensibles.</p>
      </Section>

      <Section titulo="3. Finalidad del tratamiento">
        <p>Los datos se utilizan exclusivamente para:</p>
        <ul className="list-disc list-inside space-y-1 text-muted mt-1">
          <li>Prestarte el servicio de gestión de equipo de fútbol</li>
          <li>Permitirte acceder a tu cuenta</li>
          <li>Generar estadísticas e informes internos de tu equipo</li>
        </ul>
        <p className="mt-2">No usamos tus datos para publicidad, perfilado comercial ni los compartimos con terceros para marketing.</p>
      </Section>

      <Section titulo="4. Base jurídica">
        <p>El tratamiento se basa en el <b>consentimiento del usuario</b> al registrarse y aceptar esta política, y en la ejecución del contrato de servicio (suscripción).</p>
      </Section>

      <Section titulo="5. Conservación de datos">
        <p>Conservamos tus datos mientras mantengas una cuenta activa. Si solicitas la eliminación de tu cuenta, borraremos todos tus datos en un plazo máximo de <b>30 días</b>.</p>
      </Section>

      <Section titulo="6. Proveedores de servicios (subencargados)">
        <ul className="list-disc list-inside space-y-1 text-muted">
          <li><b>Supabase Inc.</b> — almacenamiento de datos (servidores en EU/US, con cláusulas contractuales estándar)</li>
          <li><b>Vercel Inc.</b> — hosting de la aplicación (puede registrar IPs de forma anonimizada)</li>
        </ul>
        <p className="mt-2">Ningún proveedor recibe acceso a tus datos más allá de lo necesario para la prestación técnica del servicio.</p>
      </Section>

      <Section titulo="7. Tus derechos">
        <p>Como usuario tienes derecho a:</p>
        <ul className="list-disc list-inside space-y-1 text-muted mt-1">
          <li><b>Acceso</b>: saber qué datos tenemos sobre ti</li>
          <li><b>Rectificación</b>: corregir datos incorrectos (desde Ajustes)</li>
          <li><b>Supresión</b>: eliminar tu cuenta y todos tus datos (desde Ajustes → Eliminar mi cuenta)</li>
          <li><b>Portabilidad</b>: solicitar una copia de tus datos</li>
          <li><b>Oposición</b>: oponerte a cualquier tratamiento</li>
        </ul>
        <p className="mt-2">Para ejercer cualquier derecho, escríbenos a <a href="mailto:kickandgoapp@gmail.com" className="text-cyan underline">kickandgoapp@gmail.com</a>.</p>
        <p className="mt-2">También puedes presentar una reclamación ante la <b>AEPD</b> (Agencia Española de Protección de Datos): <span className="text-muted">aepd.es</span>.</p>
      </Section>

      <Section titulo="8. Cookies">
        <p>Esta aplicación no utiliza cookies de rastreo ni publicidad. Únicamente se utilizan cookies técnicas estrictamente necesarias para mantener la sesión iniciada.</p>
      </Section>

      <Section titulo="9. Seguridad">
        <p>Tus datos se almacenan de forma cifrada. Cada usuario solo puede acceder a sus propios datos mediante políticas de seguridad a nivel de base de datos (Row Level Security).</p>
      </Section>

      <Section titulo="10. Cambios en esta política">
        <p>Si realizamos cambios relevantes, te lo comunicaremos por email con al menos 15 días de antelación.</p>
      </Section>

      <div className="text-[11px] text-muted border-t border-borde pt-4">
        KICK AND GO · {fecha}
      </div>
    </div>
  )
}

function Section({ titulo, children }) {
  return (
    <div>
      <h2 className="text-sm font-bold mb-2 text-white">{titulo}</h2>
      <div className="text-muted">{children}</div>
    </div>
  )
}
