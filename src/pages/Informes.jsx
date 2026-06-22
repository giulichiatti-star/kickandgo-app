import { useEffect, useMemo, useState } from 'react'
import { listarPartidos, borrarPartido } from '../lib/partidos'
import { getPerfil } from '../lib/perfil'
import '../rivinf.css'

/* ── helpers ── */
function fechaCorta(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })
}
function fechaMini(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short' })
}
function resLabel(gf, gc) {
  if (gf > gc) return { l:'VICTORIA', c:'#34d399', bg:'rgba(52,211,153,0.12)' }
  if (gf < gc) return { l:'DERROTA',  c:'#f87171', bg:'rgba(248,113,113,0.12)' }
  return        { l:'EMPATE',   c:'#f59e0b', bg:'rgba(245,158,11,0.12)' }
}
function derivar(p) {
  const ev = Array.isArray(p.notas) ? p.notas : []
  const goles       = ev.filter(e => e.tipo === 'gol')
  const golesRival  = ev.filter(e => e.tipo === 'gol-rival')
  const amar        = ev.filter(e => (e.tipo||'').includes('amarilla'))
  const rojas       = ev.filter(e => (e.tipo||'').includes('roja'))
  const cambios     = ev.filter(e => (e.tipo||'').includes('cambio'))
  const tiros       = ev.filter(e => (e.tipo||'').includes('tiro'))
  const corners     = ev.filter(e => (e.tipo||'').includes('corner'))
  const asistencias = ev.filter(e => (e.tipo||'').includes('asist'))
  const momentos    = ev.filter(e => /gol|roja|amarilla|cambio/i.test(e.tipo||'')).slice(0,6)
  const cG = {}
  goles.forEach(g => { if (g.jugador) cG[g.jugador] = (cG[g.jugador]||0)+1 })
  const goleadores = Object.entries(cG).sort((a,b)=>b[1]-a[1]).slice(0,3)
  const cA = {}
  asistencias.forEach(g => { if (g.jugador) cA[g.jugador] = (cA[g.jugador]||0)+1 })
  const asistidores = Object.entries(cA).sort((a,b)=>b[1]-a[1])
  return { ev, goles, golesRival, amar, rojas, cambios, tiros, corners, asistencias, momentos, goleadores, asistidores }
}
function evIcon(tipo) {
  const t = (tipo||'').toLowerCase()
  if (t==='gol')              return { ico:'⚽', col:'#34d399' }
  if (t==='gol-rival')        return { ico:'⚽', col:'#f87171' }
  if (t.includes('amarilla')) return { ico:'🟨', col:'#f59e0b' }
  if (t.includes('roja'))     return { ico:'🟥', col:'#f87171' }
  if (t.includes('cambio'))   return { ico:'🔄', col:'#60a5fa' }
  if (t.includes('corner'))   return { ico:'🚩', col:'#a78bfa' }
  if (t.includes('tiro'))     return { ico:'🎯', col:'#a1a1aa' }
  if (t.includes('asist'))    return { ico:'🅰️', col:'#34d399' }
  return { ico:'•', col:'#a1a1aa' }
}
function calcImpacto(cambio, ev) {
  const min = parseInt(cambio.min)||0
  const after = ev.filter(e=>(parseInt(e.min)||0)>min)
  if (after.some(e=>e.tipo==='gol'))       return { l:'Positivo', c:'#34d399', ic:'↑' }
  if (after.some(e=>e.tipo==='gol-rival')) return { l:'Negativo', c:'#f87171', ic:'↓' }
  return { l:'Neutro', c:'#a1a1aa', ic:'—' }
}

/* ── Gauge SVG premium ── */
function Gauge({ val, col }) {
  const r = 50, circ = 2*Math.PI*r
  const off = circ - (Math.min(10,Math.max(0,val))/10)*circ
  const color = col || (val>=7 ? '#34d399' : val>=5.5 ? '#f59e0b' : '#f87171')
  return (
    <div className="relative mx-auto" style={{width:130,height:130}}>
      {/* glow background */}
      <div className="absolute rounded-full" style={{
        width:90,height:90,top:'50%',left:'50%',
        transform:'translate(-50%,-50%)',
        background:`radial-gradient(circle, ${color}18 0%, transparent 70%)`
      }}/>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#2e2e38" strokeWidth="10"/>
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          style={{transform:'rotate(-90deg)',transformOrigin:'65px 65px',filter:`drop-shadow(0 0 6px ${color}88)`}}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{fontSize:32,fontWeight:900,color:'#fff',lineHeight:1}}>{val.toFixed(1)}</span>
        <span style={{fontSize:8,textTransform:'uppercase',letterSpacing:'.5px',color:'#71717a',marginTop:3}}>global</span>
      </div>
    </div>
  )
}

/* ── Mini bar horizontal ── */
function MiniBar({ val, max, col }) {
  const pct = Math.min(100, (val/Math.max(max,1))*100)
  return (
    <div style={{height:3,background:'#2e2e38',borderRadius:2,overflow:'hidden',flex:1}}>
      <div style={{width:`${pct}%`,height:'100%',background:col,borderRadius:2,transition:'width .4s'}}/>
    </div>
  )
}

/* ── Íconos IA ── */
const IcoOk = () => (
  <span className="flex-shrink-0 flex items-center justify-center rounded-full font-black"
    style={{width:18,height:18,background:'#16a34a',color:'#fff',fontSize:9}}>✓</span>
)
const IcoWarn = () => (
  <span className="flex-shrink-0 flex items-center justify-center rounded-full font-black"
    style={{width:18,height:18,background:'#dc2626',color:'#fff',fontSize:10}}>!</span>
)

/* ── PlayerCard premium ── */
function PlayerCard({ tipo, col, nom, rate, stat, sub }) {
  const initials = nom ? nom.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() : '—'
  return (
    <div className="flex flex-col items-center text-center p-5">
      <div style={{fontSize:8,fontWeight:900,letterSpacing:'2px',textTransform:'uppercase',color:col,marginBottom:10}}>{tipo}</div>
      <div className="rounded-full flex items-center justify-center font-black mb-3"
        style={{
          width:54,height:54,
          background:`linear-gradient(135deg, ${col}33, ${col}11)`,
          border:`2px solid ${col}55`,
          color:col,fontSize:17,
          boxShadow:`0 0 16px ${col}30`
        }}>{initials}</div>
      <div style={{fontSize:30,fontWeight:900,color:col,lineHeight:1,textShadow:`0 0 20px ${col}60`}}>
        {rate>0?rate.toFixed(1):'—'}
      </div>
      <div style={{fontSize:13,fontWeight:700,color:'#fff',marginTop:6,marginBottom:2}}>{nom||'Sin datos'}</div>
      <div style={{fontSize:10,color:'#71717a'}}>
        {stat && stat!=='—' && <b style={{color:'#fff',fontSize:11,marginRight:4}}>{stat}</b>}{sub}
      </div>
    </div>
  )
}

/* ── Section header ── */
const SecH = ({ children, col }) => (
  <div className="flex items-center gap-2 mb-3">
    {col && <span className="rounded-full flex-shrink-0" style={{width:6,height:6,background:col}}/>}
    <span style={{fontSize:9,fontWeight:900,letterSpacing:'1.5px',textTransform:'uppercase',color:'#52525b'}}>{children}</span>
  </div>
)

/* ── Stat row con bars ── */
function StatRow({ label, left, right, isGoal, isWarn, maxVal=10 }) {
  const lc = isGoal&&left>0?'#34d399': isWarn&&left>0?'#f87171':'#fff'
  const rc = isGoal&&right>0?'#f87171':'#fff'
  return (
    <div className="py-1.5 border-t border-borde">
      <div style={{display:'grid',gridTemplateColumns:'32px 1fr 32px',gap:'0 8px',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:13,fontWeight:800,color:lc}}>{left}</span>
        <span style={{fontSize:10,color:'#52525b',textAlign:'center'}}>{label}</span>
        <span style={{fontSize:13,fontWeight:800,color:rc,textAlign:'right'}}>{right}</span>
      </div>
      {typeof left==='number' && (
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <MiniBar val={left} max={Math.max(left,typeof right==='number'?right:0,1)} col={lc}/>
          <MiniBar val={typeof right==='number'?right:0} max={Math.max(left,typeof right==='number'?right:0,1)} col={rc}/>
        </div>
      )}
    </div>
  )
}

export default function Informes() {
  const [partidos,setPartidos] = useState([])
  const [cargando,setCargando] = useState(true)
  const [error,setError]       = useState('')
  const [selId,setSelId]       = useState(null)
  const [tab,setTab]           = useState('informe')
  const [perfil,setPerfil]     = useState(null)
  const [borrando,setBorrando] = useState(false)

  useEffect(()=>{
    ;(async()=>{
      try {
        const [ps,p] = await Promise.all([listarPartidos(), getPerfil().catch(()=>null)])
        setPartidos(ps); setPerfil(p)
        if (ps.length) setSelId(ps[0].id)
      } catch(e){ setError(e.message) } finally { setCargando(false) }
    })()
  },[])

  async function eliminar() {
    if (!sel||!confirm(`¿Borrar vs ${sel.rival||'Rival'} (${sel.gf}-${sel.gc})?`)) return
    setBorrando(true)
    try {
      await borrarPartido(sel.id)
      const ps = partidos.filter(p=>p.id!==sel.id)
      setPartidos(ps); setSelId(ps[0]?.id||null)
    } catch(e){ setError(e.message) } finally { setBorrando(false) }
  }

  const sel = useMemo(()=>partidos.find(p=>p.id===selId)||partidos[0],[partidos,selId])
  const d   = useMemo(()=>sel?derivar(sel):null,[sel])

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>
  if (!partidos.length) return (
    <div>
      <h1 className="text-xl font-extrabold mb-1">Informes</h1>
      <div className="card p-8 text-center text-sm text-muted mt-4">
        Aún no hay partidos. Juega uno en <b className="text-cyan">En Vivo</b> y pulsa "Finalizar y guardar".
      </div>
    </div>
  )

  const rl  = resLabel(sel.gf,sel.gc)
  const val = Math.max(3,Math.min(9.5, 6+(sel.gf-sel.gc)*0.6))
  const vAt = Math.max(4,  Math.min(9.9, 5.5+sel.gf*0.7+d.tiros.length*0.1))
  const vMe = Math.max(4.5,Math.min(9,   6.5+(sel.gf-sel.gc)*0.15+d.corners.length*0.08))
  const vDe = Math.max(3,  Math.min(9.5, sel.gc===0?9.2:8.5-sel.gc*0.9))

  const positivos=[], amejorar=[]
  if (sel.gf>0)            positivos.push({t:`${sel.gf} gol${sel.gf>1?'es':''} marcado${sel.gf>1?'s':''}`, d:'Eficacia ofensiva demostrada.'})
  if (sel.gc===0)          positivos.push({t:'Portería a cero', d:'Solidez defensiva total.'})
  if (rl.l==='VICTORIA')   positivos.push({t:'Victoria conseguida', d:'El equipo gestionó bien el partido.'})
  if (d.asistencias.length) positivos.push({t:'Juego asociativo', d:`${d.asistencias.length} asistencia${d.asistencias.length>1?'s':''} registrada${d.asistencias.length>1?'s':''}.`})
  if (!positivos.length)   positivos.push({t:'Partido completado', d:'Registra eventos en En Vivo para análisis detallado.'})

  if (sel.gc>0)            amejorar.push({t:`${sel.gc} gol${sel.gc>1?'es':''} encajado${sel.gc>1?'s':''}`, d:'Revisar situaciones defensivas que derivaron en gol.'})
  if (d.rojas.length)      amejorar.push({t:'Tarjeta roja', d:`${d.rojas.length} expulsión${d.rojas.length>1?'es':''}. Inferioridad numérica.`})
  if (d.amar.length>=2)    amejorar.push({t:'Disciplina', d:`${d.amar.length} amarillas. Riesgo de sanciones.`})
  if (sel.gf===0)          amejorar.push({t:'Sin goles marcados', d:'Faltó contundencia. Trabajar definición.'})
  if (!amejorar.length)    amejorar.push({t:'Sin alertas', d:'Partido sin incidencias disciplinarias ni goles en contra.'})

  const jugCards = [
    d.goleadores[0]
      ? {tipo:'MEJOR RENDIMIENTO',col:'#34d399',nom:d.goleadores[0][0],rate:Math.min(9.9,7.5+d.goleadores[0][1]*0.5),stat:d.goleadores[0][1],sub:'goles'}
      : {tipo:'MEJOR RENDIMIENTO',col:'#34d399',nom:null,rate:0,stat:'—',sub:'sin datos'},
    d.asistidores[0]
      ? {tipo:'A DESTACAR',col:'#60a5fa',nom:d.asistidores[0][0],rate:7.6,stat:d.asistidores[0][1],sub:'asist.'}
      : {tipo:'A DESTACAR',col:'#60a5fa',nom:null,rate:0,stat:'—',sub:'sin datos'},
    d.rojas[0]
      ? {tipo:'A MEJORAR',col:'#f87171',nom:d.rojas[0].jugador||'—',rate:4.2,stat:'🟥',sub:'expulsado'}
      : d.amar.length>=2
        ? {tipo:'A MEJORAR',col:'#f59e0b',nom:d.amar[0]?.jugador||'—',rate:5.5,stat:d.amar.length,sub:'amarillas'}
        : {tipo:'A MEJORAR',col:'#f87171',nom:null,rate:0,stat:'—',sub:'sin datos'},
  ]

  return (
    <div>
      {error && <div className="text-xs text-rojo mb-2">{error}</div>}

      {/* Selector de partidos */}
      <div className="mb-3">
        <select
          className="input w-full"
          value={selId||''}
          onChange={e=>{ setSelId(e.target.value); setTab('informe') }}
        >
          {partidos.map(p=>{
            const r=resLabel(p.gf,p.gc)
            return (
              <option key={p.id} value={p.id}>
                {r.l} · {p.gf}-{p.gc} vs {p.rival||'Rival'} · {fechaMini(p.fecha)}
              </option>
            )
          })}
        </select>
      </div>

      {/* ── Scoreboard premium ── */}
      <div className="inf-scoreboard-wrap">
        <div className="inf-scoreboard-bar" style={{background:`linear-gradient(90deg, ${rl.c}80, ${rl.c}20, transparent)`}}/>
        <div className="inf-scoreboard-inner">
          {/* Equipo local */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {perfil?.escudo_url
              ? <img src={perfil.escudo_url} alt="" className="rounded-xl flex-shrink-0" style={{width:44,height:44,objectFit:'cover'}}/>
              : <div className="rounded-xl flex-shrink-0 flex items-center justify-center text-xl" style={{width:44,height:44,background:'rgba(45,212,191,0.12)',border:'1px solid rgba(45,212,191,0.2)'}}>🛡️</div>}
            <div>
              <div style={{fontSize:16,fontWeight:800,color:'#fff',letterSpacing:'-.2px'}}>{perfil?.club_nombre||'Nuestro equipo'}</div>
              <div style={{fontSize:10,color:'#52525b'}}>{sel.formacion||sel.local_visitante||'local'}</div>
            </div>
          </div>
          {/* Centro marcador */}
          <div className="text-center flex-shrink-0 px-4">
            <div style={{fontSize:40,fontWeight:900,letterSpacing:2,lineHeight:1,color:'#fff'}}>
              <span style={{color:sel.gf>sel.gc?'#34d399':sel.gf<sel.gc?'#fff':'#f59e0b'}}>{sel.gf}</span>
              <span style={{color:'#3f3f46',fontWeight:400,fontSize:32,margin:'0 6px'}}>-</span>
              <span style={{color:sel.gc>sel.gf?'#f87171':sel.gc<sel.gf?'#fff':'#f59e0b'}}>{sel.gc}</span>
            </div>
            <div style={{fontSize:9,fontWeight:900,letterSpacing:'2px',color:rl.c,marginTop:4,
              textShadow:`0 0 12px ${rl.c}80`}}>{rl.l}</div>
            <div style={{fontSize:9,color:'#52525b',marginTop:3}}>{fechaCorta(sel.fecha)} · {sel.local_visitante==='visitante'?'Fuera':'En casa'}</div>
          </div>
          {/* Rival */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end flex-row-reverse">
            <div className="rounded-xl flex-shrink-0 flex items-center justify-center text-xl" style={{width:44,height:44,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.15)'}}>⚫</div>
            <div className="text-right">
              <div style={{fontSize:16,fontWeight:800,color:'#fff',letterSpacing:'-.2px'}}>{sel.rival||'Rival'}</div>
              <div style={{fontSize:10,color:'#52525b'}}>{sel.local_visitante==='local'?'visitante':'local'}</div>
            </div>
          </div>
          <button onClick={eliminar} disabled={borrando}
            className="text-[11px] px-3 py-1.5 rounded-lg border transition flex-shrink-0"
            style={{borderColor:'rgba(239,68,68,0.25)',color:'#f87171',background:'transparent'}}>
            {borrando?'…':'🗑'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inf2-tabs mb-4">
        {[['informe','INFORME'],['datos','DATOS'],['ia','ANÁLISIS IA']].map(([id,lbl])=>(
          <div key={id} className={`inf2-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{lbl}</div>
        ))}
        <span className="ml-auto text-[11px] text-muted self-center pr-1">{d.ev.length} eventos</span>
      </div>

      {/* ══ INFORME ══ */}
      {tab==='informe' && <>

        {/* Fila 4 cols */}
        <div className="grid gap-3 mb-3 inf-grid4">

          {/* 1 — Valoración */}
          <div className="inf-box p-4">
            <SecH col="#34d399">Valoración del equipo</SecH>
            <Gauge val={val} col={val>=7?'#34d399':val>=5.5?'#f59e0b':'#f87171'}/>
            <div className="mt-3 space-y-1">
              {[
                {lbl:'Ataque',     v:vAt, col:vAt>=7?'#34d399':'#f59e0b'},
                {lbl:'Mediocampo', v:vMe, col:'#60a5fa'},
                {lbl:'Defensa',    v:vDe, col:vDe>=7?'#34d399':'#f87171'},
              ].map(({lbl,v,col})=>(
                <div key={lbl} className="flex items-center gap-2.5 py-1.5 border-t border-borde">
                  <span style={{width:6,height:6,borderRadius:'50%',background:col,flexShrink:0,display:'inline-block',boxShadow:`0 0 5px ${col}`}}/>
                  <span style={{fontSize:11,color:'#71717a',flex:1}}>{lbl}</span>
                  <div style={{width:56,height:4,background:'#2e2e38',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${(v/10)*100}%`,height:'100%',background:col,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:col,minWidth:28,textAlign:'right'}}>{v.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2 — Datos del partido */}
          <div className="inf-box p-4">
            <SecH col="#60a5fa">Datos del partido</SecH>
            <div style={{display:'grid',gridTemplateColumns:'28px 1fr 28px',gap:'0 6px',marginBottom:6}}>
              <span style={{fontSize:9,fontWeight:900,color:'#34d399'}}>NOS</span>
              <span/>
              <span style={{fontSize:9,fontWeight:900,color:'#f87171',textAlign:'right'}}>ELLOS</span>
            </div>
            {[
              [sel.gf,          'Goles',      sel.gc,  true,  false],
              [d.tiros.length,  'Tiros',      '—',     false, false],
              [d.amar.length,   'Amarillas',  '—',     false, true],
              [d.rojas.length,  'Rojas',      '—',     false, true],
              [d.cambios.length,'Cambios',    '—',     false, false],
              [d.corners.length,'Córners',    '—',     false, false],
            ].map(([l,c,r,isG,isW],i)=>(
              <StatRow key={i} label={c} left={l} right={r} isGoal={isG} isWarn={isW}
                maxVal={Math.max(typeof l==='number'?l:0,typeof r==='number'?r:0,1)}/>
            ))}
          </div>

          {/* 3 — Momentos clave */}
          <div className="inf-box p-4">
            <SecH col="#f59e0b">Momentos clave</SecH>
            {d.momentos.length===0
              ? <p style={{fontSize:11,color:'#52525b'}}>Sin eventos. Usa En Vivo para registrar jugadas.</p>
              : d.momentos.map((m,i)=>{
                  const {ico,col}=evIcon(m.tipo)
                  return (
                    <div key={i} className="flex gap-2.5 items-center py-1.5 border-t border-borde first:border-t-0">
                      <span style={{fontSize:10,color:'#52525b',fontWeight:700,minWidth:22}}>{m.min||'?'}'</span>
                      <span style={{
                        display:'inline-flex',alignItems:'center',justifyContent:'center',
                        width:22,height:22,borderRadius:6,
                        background:`${col}20`,fontSize:12,flexShrink:0
                      }}>{ico}</span>
                      <span style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:col}}>{m.label||m.tipo}</div>
                        {m.jugador&&<div style={{fontSize:10,color:'#52525b'}}>{m.jugador}</div>}
                      </span>
                    </div>
                  )
                })
            }
            {d.ev.length>6&&(
              <div style={{fontSize:10,color:'#2dd4bf',marginTop:8,cursor:'pointer'}} onClick={()=>setTab('datos')}>
                VER TODOS →
              </div>
            )}
          </div>

          {/* 4 — Análisis IA */}
          <div className="inf-box p-4">
            <SecH col="#a78bfa">Análisis IA</SecH>
            {/* Positivos */}
            <div style={{fontSize:8,fontWeight:900,letterSpacing:'1.5px',textTransform:'uppercase',color:'#34d399',marginBottom:8}}>
              ✓ LO POSITIVO
            </div>
            <div style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.15)',borderRadius:10,padding:'8px 10px',marginBottom:10}}>
              {positivos.slice(0,2).map((p,i)=>(
                <div key={i} className="flex gap-2 items-start mb-2 last:mb-0">
                  <IcoOk/>
                  <span>
                    <div style={{fontSize:11,fontWeight:700,color:'#fff'}}>{p.t}</div>
                    <div style={{fontSize:10,color:'#71717a',lineHeight:1.35}}>{p.d}</div>
                  </span>
                </div>
              ))}
            </div>
            {/* A mejorar */}
            <div style={{fontSize:8,fontWeight:900,letterSpacing:'1.5px',textTransform:'uppercase',color:'#f87171',marginBottom:8}}>
              ⚠ A MEJORAR
            </div>
            <div style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.15)',borderRadius:10,padding:'8px 10px'}}>
              {amejorar.slice(0,2).map((p,i)=>(
                <div key={i} className="flex gap-2 items-start mb-2 last:mb-0">
                  <IcoWarn/>
                  <span>
                    <div style={{fontSize:11,fontWeight:700,color:'#fff'}}>{p.t}</div>
                    <div style={{fontSize:10,color:'#71717a',lineHeight:1.35}}>{p.d}</div>
                  </span>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:'#2dd4bf',marginTop:8,cursor:'pointer'}} onClick={()=>setTab('ia')}>
              VER ANÁLISIS COMPLETO →
            </div>
          </div>
        </div>

        {/* ── Rendimiento jugadores ── */}
        <div className="inf-box mb-3" style={{overflow:'hidden'}}>
          <div className="p-4 pb-0"><SecH col="#60a5fa">Rendimiento jugadores</SecH></div>
          <div className="grid border-t border-borde inf-grid3-players" style={{borderColor:'#2e2e38'}}>
            {jugCards.map((jc,i)=>(
              <div key={i} style={{borderRight: i<2 ? '1px solid #2e2e38' : 'none'}}>
                <PlayerCard {...jc}/>
              </div>
            ))}
          </div>
        </div>

        {/* ── Fila inferior ── */}
        <div className="grid gap-3 inf-grid3">

          {/* Notas */}
          <div className="inf-box p-4">
            <SecH col="#94a3b8">Notas del entrenador</SecH>
            {sel.analisis_ia
              ? <blockquote style={{borderLeft:'3px solid #2dd4bf',paddingLeft:12,color:'#e2e8f0',margin:0,fontStyle:'italic',fontSize:12,lineHeight:1.6}}>"{sel.analisis_ia}"</blockquote>
              : <p style={{fontSize:11,color:'#52525b',margin:0}}>Sin notas para este partido.</p>}
            <div style={{marginTop:12,padding:'10px 12px',borderRadius:10,borderLeft:'3px solid #ef4444',background:'rgba(239,68,68,0.07)'}}>
              <div style={{fontSize:8,fontWeight:900,textTransform:'uppercase',letterSpacing:'1px',color:'#f87171',marginBottom:4}}>
                IA — Conclusión
              </div>
              <div style={{fontSize:11,lineHeight:1.5,color:'#fca5a5'}}>
                {rl.l==='VICTORIA'?`Victoria ${sel.gf}-${sel.gc}. Mantener el esquema y la intensidad mostrada.`
                 :rl.l==='DERROTA'?`Derrota ${sel.gf}-${sel.gc}. Sesión defensiva prioritaria en el próximo entreno.`
                 :`Empate ${sel.gf}-${sel.gc}. Trabajar definición y gestión del tiempo.`}
              </div>
            </div>
          </div>

          {/* Cambios */}
          <div className="inf-box p-4">
            <SecH col="#60a5fa">Cambios realizados</SecH>
            {d.cambios.length===0
              ? <p style={{fontSize:11,color:'#52525b',margin:0}}>Sin cambios registrados.</p>
              : <>
                <div style={{display:'grid',gridTemplateColumns:'32px 1fr auto',gap:'0 8px',fontSize:8,fontWeight:900,textTransform:'uppercase',letterSpacing:'1px',color:'#52525b',marginBottom:6}}>
                  <span>Min</span><span>Cambio</span><span>Impacto</span>
                </div>
                {d.cambios.map((c,i)=>{
                  const imp=calcImpacto(c,d.ev)
                  return (
                    <div key={i} style={{display:'grid',gridTemplateColumns:'32px 1fr auto',gap:'0 8px',padding:'6px 0',borderTop:'1px solid #2e2e38',fontSize:11,alignItems:'center'}}>
                      <span style={{color:'#52525b',fontWeight:700}}>{c.min||'?'}'</span>
                      <span style={{color:'#fff'}}>{c.label}{c.jugador?` · ${c.jugador}`:''}</span>
                      <span style={{fontWeight:800,fontSize:10,whiteSpace:'nowrap',color:imp.c,
                        background:`${imp.c}18`,padding:'2px 7px',borderRadius:5}}>
                        {imp.ic} {imp.l}
                      </span>
                    </div>
                  )
                })}
              </>}
          </div>

          {/* Próximo paso */}
          <div className="inf-box p-4 flex flex-col">
            <SecH col={rl.c}>Próximo paso recomendado</SecH>
            <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:6}}>
              {rl.l==='VICTORIA'?'Mantener la dinámica':rl.l==='DERROTA'?'Sesión defensiva correctiva':'Trabajo de finalización'}
            </div>
            <div style={{fontSize:11,color:'#71717a',lineHeight:1.5,marginBottom:12}}>
              {rl.l==='VICTORIA'?'Consolidar lo que funcionó. Revisión táctica y recuperación física.'
               :rl.l==='DERROTA'?`Reforzar coberturas. Revisar los ${sel.gc} goles concedidos con el grupo.`
               :'Ejercicios de definición y gestión de los últimos minutos.'}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              {[
                ['Duración','90 min'],
                ['Objetivo',rl.l==='DERROTA'?'Defensa':rl.l==='VICTORIA'?'Consolidar':'Finalización'],
                ['Ejercicios',rl.l==='DERROTA'?'4':'3'],
                ['Intensidad',rl.l==='DERROTA'?'Alta':'Media'],
              ].map(([k,v])=>(
                <div key={k} style={{borderRadius:8,padding:'8px 10px',background:'rgba(255,255,255,0.03)',border:'1px solid #2e2e38'}}>
                  <div style={{fontSize:8,color:'#52525b',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#fff',marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            <button className="mt-auto w-full rounded-xl py-2.5 text-[12px] font-black tracking-wide text-white border-0 cursor-pointer"
              style={{
                background:rl.l==='VICTORIA'
                  ?'linear-gradient(135deg,#16a34a,#059669)'
                  :rl.l==='DERROTA'
                  ?'linear-gradient(135deg,#dc2626,#b91c1c)'
                  :'linear-gradient(135deg,#d97706,#b45309)',
                boxShadow: rl.l==='VICTORIA'?'0 4px 16px rgba(22,163,74,0.35)'
                  :rl.l==='DERROTA'?'0 4px 16px rgba(220,38,38,0.35)'
                  :'0 4px 16px rgba(217,119,6,0.35)'
              }}>
              ⚡ CREAR SESIÓN CORRECTIVA CON IA
            </button>
          </div>
        </div>
      </>}

      {/* ══ DATOS ══ */}
      {tab==='datos' && (
        <div className="inf-box p-4" style={{maxWidth:540}}>
          <SecH col="#60a5fa">Timeline de eventos · {d.ev.length} registros</SecH>
          {d.ev.length===0
            ? <p style={{fontSize:12,color:'#52525b',textAlign:'center',padding:'24px 0'}}>Sin eventos. Registra jugadas en En Vivo.</p>
            : <div className="overflow-y-auto" style={{maxHeight:520}}>
              {d.ev.map((e,i)=>{
                const {ico,col}=evIcon(e.tipo)
                return (
                  <div key={i} className="flex items-center gap-2.5 py-2 border-t border-borde" style={{fontSize:12}}>
                    <span style={{fontSize:10,color:'#52525b',fontWeight:700,minWidth:28}}>{e.min||'?'}'</span>
                    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',
                      width:22,height:22,borderRadius:6,background:`${col}20`,fontSize:12}}>{ico}</span>
                    <span style={{fontWeight:600,color:col,flex:1}}>{e.label||e.tipo}{e.jugador?` · ${e.jugador}`:''}</span>
                  </div>
                )
              })}
            </div>}
        </div>
      )}

      {/* ══ IA ══ */}
      {tab==='ia' && (
        <div className="inf-box p-4" style={{maxWidth:600}}>
          <SecH col="#a78bfa">Análisis completo IA</SecH>
          <div style={{fontSize:12,color:'#71717a',lineHeight:1.7}}>
            <p>Resultado: <b style={{color:rl.c}}>{sel.gf}-{sel.gc} ({rl.l.toLowerCase()})</b> vs <b style={{color:'#fff'}}>{sel.rival||'el rival'}</b> · {sel.local_visitante||'local'}.</p>
            {d.goleadores.length>0&&<p style={{marginTop:8}}>Goleadores: {d.goleadores.map(([n,c])=>`${n} (${c})`).join(', ')}.</p>}
            <div style={{marginTop:16,paddingTop:12,borderTop:'1px solid #2e2e38',fontSize:9,fontWeight:900,letterSpacing:'1px',color:'#34d399'}}>✓ LO POSITIVO</div>
            {positivos.map((p,i)=><p key={i} style={{marginTop:6}}><b style={{color:'#fff'}}>{p.t}.</b> {p.d}</p>)}
            <div style={{marginTop:16,paddingTop:12,borderTop:'1px solid #2e2e38',fontSize:9,fontWeight:900,letterSpacing:'1px',color:'#f87171'}}>⚠ A MEJORAR</div>
            {amejorar.map((p,i)=><p key={i} style={{marginTop:6}}><b style={{color:'#fff'}}>{p.t}.</b> {p.d}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
