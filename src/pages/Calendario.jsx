import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listarEntrenos } from '../lib/entrenamientos'
import { listarConvocatorias } from '../lib/convocatorias'
import '../calendario.css'

const DOWS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const fmtISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const startOfWeek = d => { const x=new Date(d); const dw=(x.getDay()+6)%7; x.setDate(x.getDate()-dw); x.setHours(0,0,0,0); return x }

export default function Calendario() {
  const [equipoId, setEquipoId] = useState(null)
  const [entrenos, setEntrenos] = useState([])
  const [convocatorias, setConvocatorias] = useState([])
  const [vista, setVista] = useState('mes')
  const HOY = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const [diaSel, setDiaSel] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [nota, setNota] = useState(null)

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u?.user) return
      const eqId = localStorage.getItem('equipo_activo') || null
      setEquipoId(eqId)
      try {
        const [e, c] = await Promise.all([
          listarEntrenos(eqId).catch(() => []),
          listarConvocatorias(eqId).catch(() => []),
        ])
        setEntrenos(e || [])
        setConvocatorias(c || [])
      } catch {}
    })()
  }, [])

  const eventosPorDia = useMemo(() => {
    const m = {}
    entrenos.forEach(e => {
      if (!e.fecha) return
      const k = String(e.fecha).slice(0,10)
      m[k] = m[k] || { entrenos: [], convocatorias: [] }
      m[k].entrenos.push(e)
    })
    convocatorias.forEach(c => {
      if (!c.fecha) return
      const k = String(c.fecha).slice(0,10)
      m[k] = m[k] || { entrenos: [], convocatorias: [] }
      m[k].convocatorias.push(c)
    })
    return m
  }, [entrenos, convocatorias])

  const nav = dir => {
    if (vista === 'mes') setCursor(c => new Date(c.getFullYear(), c.getMonth()+dir, 1))
    else if (vista === 'semana') setCursor(c => { const x=new Date(c); x.setDate(x.getDate()+7*dir); return x })
    else setDiaSel(d => { const x=new Date(d); x.setDate(x.getDate()+dir); return x })
  }
  const irHoy = () => { setCursor(new Date(HOY.getFullYear(), HOY.getMonth(), 1)); setDiaSel(new Date(HOY)) }
  const abrirDia = iso => { setDiaSel(new Date(iso+'T00:00:00')); setVista('dia') }

  const periodo = useMemo(() => {
    if (vista === 'mes') return cursor.toLocaleDateString('es', { month:'long', year:'numeric' })
    if (vista === 'semana') {
      const ini = startOfWeek(cursor)
      const fin = new Date(ini); fin.setDate(fin.getDate()+6)
      return `${ini.getDate()} – ${fin.getDate()} ${fin.toLocaleDateString('es',{month:'short'})} ${fin.getFullYear()}`
    }
    return diaSel.toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long' })
  }, [vista, cursor, diaSel])

  return (
    <div className="cal-page">
      <div className="cal-head">
        <div className="cal-title"><span className="cal-title-ico">📅</span>Calendario</div>
        <div className="cal-controls">
          <div className="cal-segm">
            {['mes','semana','dia'].map(v => (
              <button key={v} className={vista===v?'on':''} onClick={()=>setVista(v)}>
                {v==='mes'?'Mes':v==='semana'?'Semana':'Día'}
              </button>
            ))}
          </div>
          <div className="cal-nav">
            <button onClick={()=>nav(-1)}>‹</button>
            <span className="cal-periodo">{periodo}</span>
            <button onClick={()=>nav(1)}>›</button>
            <button onClick={irHoy}>Hoy</button>
          </div>
        </div>
      </div>

      <div className="cal-leg">
        <span><span className="d" style={{background:'#34d399'}}/>Entreno</span>
        <span><span className="d" style={{background:'#93c5fd'}}/>Convocatoria</span>
        <span>📝 Con nota</span>
      </div>

      {vista === 'mes' && <VistaMes cursor={cursor} hoy={HOY} sel={diaSel} eventos={eventosPorDia} onDia={abrirDia}/>}
      {vista === 'semana' && <VistaSemana cursor={cursor} hoy={HOY} eventos={eventosPorDia} onNota={setNota} onDia={abrirDia}/>}
      {vista === 'dia' && <VistaDia dia={diaSel} eventos={eventosPorDia} onNota={setNota}/>}

      {nota && (
        <div className="cal-modal-bg" onClick={e => { if (e.target.classList.contains('cal-modal-bg')) setNota(null) }}>
          <div className="cal-modal">
            <h3>{nota.titulo}</h3>
            <div className="sub">Nota adjunta</div>
            <div className="nota-body">{nota.texto}</div>
            <div className="close"><button onClick={()=>setNota(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function VistaMes({ cursor, hoy, sel, eventos, onDia }) {
  const y = cursor.getFullYear(), m = cursor.getMonth()
  const primero = new Date(y, m, 1)
  const ini = startOfWeek(primero)
  const celdas = []
  for (let i=0;i<42;i++){
    const d = new Date(ini); d.setDate(ini.getDate()+i)
    celdas.push(d)
  }
  return (
    <div className="mes-grid">
      <div className="mes-dow">{DOWS.map(x => <div key={x}>{x}</div>)}</div>
      <div className="mes-days">
        {celdas.map((d,i) => {
          const iso = fmtISO(d)
          const ev = eventos[iso] || {}
          const otro = d.getMonth() !== m
          const esHoy = fmtISO(d) === fmtISO(hoy)
          const esSel = fmtISO(d) === fmtISO(sel)
          const items = [
            ...(ev.entrenos||[]).map(e=>({tipo:'ent', t:e.objetivo || 'Entreno', nota:!!e.notas})),
            ...(ev.convocatorias||[]).map(c=>({tipo:'conv', t:'vs '+(c.rival||'—'), nota:!!c.notas})),
          ]
          return (
            <div key={i} className={`day-cell ${otro?'otro':''} ${esHoy?'hoy':''} ${esSel?'sel':''}`} onClick={()=>onDia(iso)}>
              <div className="dnum">{d.getDate()}</div>
              {items.slice(0,2).map((it,k) => (
                <div key={k} className={`pill ${it.tipo} ${it.nota?'nota':''}`} title={it.t}>{it.t}</div>
              ))}
              {items.length>2 && <div className="more">+{items.length-2} más</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VistaSemana({ cursor, hoy, eventos, onNota, onDia }) {
  const ini = startOfWeek(cursor)
  const dias = Array.from({length:7}, (_,i) => { const d = new Date(ini); d.setDate(ini.getDate()+i); return d })
  return (
    <div className="sem-grid">
      {dias.map((d,i) => {
        const iso = fmtISO(d)
        const ev = eventos[iso] || {}
        const esHoy = fmtISO(d) === fmtISO(hoy)
        return (
          <div key={i} className={`sem-col ${esHoy?'hoy':''}`}>
            <div className="sem-h" onClick={()=>onDia(iso)}>
              <span className="dow">{DOWS[i]}</span>
              <span className="dnum">{d.getDate()}</span>
            </div>
            {(ev.entrenos||[]).map((e,k) => (
              <div key={'e'+k} className="sem-item ent" onClick={()=>e.notas && onNota({titulo:`Entreno · ${iso}`, texto:e.notas})}>
                <div className="t">{e.objetivo || 'Entreno'} {e.notas && '📝'}</div>
                <div className="m">{(e.duracion||0)}min</div>
              </div>
            ))}
            {(ev.convocatorias||[]).map((c,k) => (
              <div key={'c'+k} className="sem-item conv" onClick={()=>c.notas && onNota({titulo:`vs ${c.rival} · ${iso}`, texto:c.notas})}>
                <div className="t">vs {c.rival} {c.notas && '📝'}</div>
                <div className="m">{c.formacion || ''}</div>
              </div>
            ))}
            {(!ev.entrenos?.length && !ev.convocatorias?.length) && <div className="sem-empty">Sin eventos</div>}
          </div>
        )
      })}
    </div>
  )
}

function VistaDia({ dia, eventos, onNota }) {
  const iso = fmtISO(dia)
  const ev = eventos[iso] || {}
  return (
    <div className="dia-wrap">
      <div className="dia-head">
        <div className="dnum">{dia.getDate()}</div>
        <div className="dow">{dia.toLocaleDateString('es',{weekday:'long', month:'long'})}</div>
      </div>

      <div className="dia-sec">
        <h4><span className="dot" style={{background:'#34d399'}}/>Entrenos</h4>
        {(ev.entrenos||[]).length === 0 && <div className="dia-empty">Sin entrenos este día</div>}
        {(ev.entrenos||[]).map((e,k) => (
          <div key={k} className="dia-item" onClick={()=>e.notas && onNota({titulo:`Entreno · ${iso}`, texto:e.notas})}>
            <div className="body">
              <div className="head">
                <div className="title">{e.objetivo || 'Entreno'}</div>
                {e.notas && <span className="nota-chip">📝 Nota</span>}
              </div>
              <div className="meta">
                <span>⏱ {e.duracion || 0} min</span>
                <span>🏋 {(e.ejercicios||[]).length} ejercicios</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dia-sec">
        <h4><span className="dot" style={{background:'#3b82f6'}}/>Convocatorias</h4>
        {(ev.convocatorias||[]).length === 0 && <div className="dia-empty">Sin partido este día</div>}
        {(ev.convocatorias||[]).map((c,k) => (
          <div key={k} className="dia-item" onClick={()=>c.notas && onNota({titulo:`vs ${c.rival} · ${iso}`, texto:c.notas})}>
            <div className="body">
              <div className="head">
                <div className="title">vs {c.rival || '—'}</div>
                {c.notas && <span className="nota-chip">📝 Nota</span>}
              </div>
              <div className="meta">
                <span>⚡ {c.formacion || '—'}</span>
                <span>👥 {(c.titulares?.length || 0) + (c.suplentes?.length || 0)} conv.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
