export default function Terminos() {
  const fecha = '29 de junio de 2026'
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 text-[13px] leading-relaxed">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Términos y Condiciones</h1>
        <p className="text-muted text-xs">Última actualización: {fecha}</p>
      </div>

      <Section titulo="1. Identificación del servicio">
        <p><b>KICK AND GO</b> es una aplicación web de gestión de equipos de fútbol amateur, operada por <b>[TU NOMBRE / EMPRESA]</b>, con contacto en <a href="mailto:kickandgoapp@gmail.com" className="text-cyan underline">kickandgoapp@gmail.com</a>.</p>
      </Section>

      <Section titulo="2. Aceptación de los términos">
        <p>Al crear una cuenta y usar KICK AND GO, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no debes usar el servicio.</p>
      </Section>

      <Section titulo="3. Descripción del servicio">
        <p>KICK AND GO ofrece herramientas para:</p>
        <ul className="list-disc list-inside space-y-1 text-muted mt-1">
          <li>Gestión de plantilla y jugadores</li>
          <li>Registro y análisis de partidos</li>
          <li>Planificación de entrenamientos y convocatorias</li>
          <li>Seguimiento de estadísticas, amonestaciones y lesiones</li>
          <li>Planificación de temporada</li>
        </ul>
      </Section>

      <Section titulo="4. Cuenta de usuario">
        <p>Eres responsable de mantener la confidencialidad de tus credenciales de acceso. KICK AND GO no se hace responsable de accesos no autorizados derivados de una contraseña comprometida por el usuario.</p>
        <p className="mt-2">Puedes eliminar tu cuenta en cualquier momento desde <b>Ajustes → Eliminar mi cuenta</b>. Todos tus datos serán borrados en un plazo máximo de 30 días.</p>
      </Section>

      <Section titulo="5. Planes y facturación">
        <p>KICK AND GO puede ofrecer planes de pago con acceso a funcionalidades adicionales. Los precios se muestran en la página de suscripción antes de confirmar el pago.</p>
        <p className="mt-2">El pago se procesa a través de <b>Stripe</b>, un proveedor de pagos externo seguro. KICK AND GO no almacena datos de tarjetas bancarias.</p>
      </Section>

      <Section titulo="6. Derecho de desistimiento">
        <p>De acuerdo con la legislación española y europea (RDL 1/2007), tienes derecho a cancelar tu suscripción en un plazo de <b>14 días naturales</b> desde la contratación, sin necesidad de justificación, y recibir el reembolso completo.</p>
        <p className="mt-2">Para ejercer este derecho, envía un email a <a href="mailto:kickandgoapp@gmail.com" className="text-cyan underline">kickandgoapp@gmail.com</a> indicando tu intención de desistimiento.</p>
      </Section>

      <Section titulo="7. Cancelación y reembolsos">
        <p>Puedes cancelar tu suscripción en cualquier momento. El acceso se mantiene hasta el fin del período pagado. No se realizan reembolsos parciales salvo en el período de desistimiento (14 días).</p>
      </Section>

      <Section titulo="8. Uso aceptable">
        <p>Queda prohibido:</p>
        <ul className="list-disc list-inside space-y-1 text-muted mt-1">
          <li>Usar el servicio para actividades ilegales</li>
          <li>Introducir datos falsos o de terceros sin su consentimiento</li>
          <li>Intentar acceder a datos de otros usuarios</li>
          <li>Realizar ingeniería inversa o copiar el software</li>
        </ul>
      </Section>

      <Section titulo="9. Propiedad intelectual">
        <p>El código, diseño y marca de KICK AND GO son propiedad de <b>[TU NOMBRE / EMPRESA]</b>. Los datos que introduces (jugadores, partidos, etc.) son tuyos y puedes exportarlos o eliminarlos en cualquier momento.</p>
      </Section>

      <Section titulo="10. Limitación de responsabilidad">
        <p>KICK AND GO se ofrece "tal cual". No garantizamos disponibilidad ininterrumpida. No somos responsables de pérdidas derivadas de decisiones tomadas basándose en los datos o estadísticas de la app.</p>
      </Section>

      <Section titulo="11. Modificaciones del servicio">
        <p>Podemos modificar o interrumpir el servicio con un preaviso de <b>30 días</b> por email. Si suben los precios, te avisaremos con al menos 30 días de antelación.</p>
      </Section>

      <Section titulo="12. Ley aplicable">
        <p>Estos términos se rigen por la legislación española. Cualquier disputa se someterá a los juzgados de <b>[TU CIUDAD]</b>, salvo que la ley de consumidores aplicable establezca otro fuero.</p>
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
