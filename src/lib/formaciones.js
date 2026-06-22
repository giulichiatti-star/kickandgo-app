// Formaciones compartidas (cancha vertical, portería propia abajo). Coord [x%, y%].
// Slot 0 = portero. Luego defensas, medios, delanteros.
export const FORM_11 = {
  '4-3-3': [[50,90],[16,72],[38,75],[62,75],[84,72],[28,52],[50,48],[72,52],[22,24],[50,20],[78,24]],
  '4-4-2': [[50,90],[16,72],[38,74],[62,74],[84,72],[16,50],[38,52],[62,52],[84,50],[38,22],[62,22]],
  '4-2-3-1': [[50,90],[16,72],[38,74],[62,74],[84,72],[38,56],[62,56],[24,38],[50,34],[76,38],[50,18]],
  '3-5-2': [[50,90],[28,74],[50,76],[72,74],[12,52],[32,54],[50,48],[68,54],[88,52],[38,22],[62,22]],
  '5-3-2': [[50,90],[12,74],[31,75],[50,77],[69,75],[88,74],[28,50],[50,48],[72,50],[38,24],[62,24]],
}
export const FORM_9 = {
  '3-3-2': [[50,90],[22,72],[50,74],[78,72],[22,48],[50,46],[78,48],[38,22],[62,22]],
  '3-2-3': [[50,90],[22,72],[50,74],[78,72],[35,50],[65,50],[22,24],[50,22],[78,24]],
  '2-4-2': [[50,90],[33,73],[67,73],[15,50],[38,50],[62,50],[85,50],[38,22],[62,22]],
  '2-3-3': [[50,90],[33,73],[67,73],[24,50],[50,48],[76,50],[22,24],[50,22],[78,24]],
  '3-1-3-1': [[50,90],[22,73],[50,75],[78,73],[50,56],[24,36],[50,34],[76,36],[50,18]],
}
export const FORM_7 = {
  '2-3-1': [[50,90],[33,70],[67,70],[22,48],[50,46],[78,48],[50,22]],
  '3-2-1': [[50,90],[25,70],[50,72],[75,70],[35,46],[65,46],[50,22]],
  '2-2-2': [[50,90],[33,72],[67,72],[33,48],[67,48],[33,24],[67,24]],
  '1-3-2': [[50,90],[50,74],[25,50],[50,48],[75,50],[35,24],[65,24]],
  '3-1-2': [[50,90],[25,72],[50,74],[75,72],[50,48],[35,24],[65,24]],
}

export function formacionesPara(tipo) {
  return tipo === '7' ? FORM_7 : tipo === '9' ? FORM_9 : FORM_11
}
export function formacionDefecto(tipo) {
  return tipo === '7' ? '2-3-1' : tipo === '9' ? '3-3-2' : '4-3-3'
}

// Ordena titulares GK → DEF → MED → DEL para encajar en los slots
export function ordenarTitulares(tits) {
  const rank = { POR: 0, DEF: 1, MED: 2, DEL: 3 }
  return [...tits].sort((a, b) => (rank[a.cat] ?? 2) - (rank[b.cat] ?? 2))
}

// Devuelve puntos {id,num,nombre,gk,x,y} colocando titulares según la formación
export function colocarTitulares(tits, tipo, formacion) {
  const coords = (formacionesPara(tipo)[formacion]) || Object.values(formacionesPara(tipo))[0]
  // En F7 solo 7 en campo, en F11 solo 11 — recortar al nº de slots
  const ord = ordenarTitulares(tits).slice(0, coords.length)
  return ord.map((j, i) => ({
    id: j.id, num: j.dorsal, nombre: j.nombre, gk: i === 0,
    x: coords[i] ? coords[i][0] : 50,
    y: coords[i] ? coords[i][1] : 50,
  }))
}

export function nTitulares(tipo) { return tipo === '7' ? 7 : tipo === '9' ? 9 : 11 }
export function nSuplentes(tipo) { return tipo === '7' ? 5 : tipo === '9' ? 7 : 9 }
