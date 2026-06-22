// Datos de la competición (Grup 6) — fuente única, usada por la página Rivales y el Asistente.
// Editables / importables de fcf.cat más adelante.
export const RIVALES_TABLA = [
  { pos: 1, ico: '🟢', nom: 'Vilassar Dalt-Giatsu, C.E. A', pj: 29, pg: 19, pe: 5, pp: 5, gf: 68, gc: 32, pts: 62, forma: ['V', 'V', 'E', 'V', 'V'] },
  { pos: 2, ico: '🔴', nom: 'Cabrils, C.E. B', pj: 29, pg: 18, pe: 4, pp: 7, gf: 61, gc: 38, pts: 58, forma: ['V', 'D', 'V', 'V', 'E'] },
  { pos: 3, ico: '🔵', nom: 'Fundació Esp. Montgat A', pj: 29, pg: 16, pe: 6, pp: 7, gf: 55, gc: 35, pts: 54, forma: ['E', 'V', 'V', 'D', 'V'] },
  { pos: 4, ico: '🛡️', nom: 'CF Arenys de Mar A', pj: 29, pg: 15, pe: 6, pp: 8, gf: 52, gc: 40, pts: 51, forma: ['V', 'D', 'V', 'E', 'V'], miEquipo: true },
  { pos: 5, ico: '🟡', nom: 'Malgrat, C.E. A', pj: 29, pg: 14, pe: 7, pp: 8, gf: 49, gc: 41, pts: 49, forma: ['D', 'V', 'E', 'V', 'D'] },
  { pos: 6, ico: '🔵', nom: 'Premia Dalt, C.D. A', pj: 29, pg: 13, pe: 6, pp: 10, gf: 44, gc: 43, pts: 45, forma: ['V', 'D', 'D', 'V', 'E'] },
  { pos: 7, ico: '⚪', nom: "Pla d'en Boet, Club Esp. A", pj: 29, pg: 12, pe: 7, pp: 10, gf: 43, gc: 42, pts: 43, forma: ['E', 'E', 'V', 'D', 'V'] },
  { pos: 8, ico: '🟠', nom: 'Masnou AT. A', pj: 29, pg: 12, pe: 5, pp: 12, gf: 40, gc: 45, pts: 41, forma: ['D', 'V', 'D', 'V', 'D'] },
  { pos: 9, ico: '🔴', nom: 'Tiana, C.C.E. A', pj: 29, pg: 11, pe: 6, pp: 12, gf: 38, gc: 46, pts: 39, forma: ['D', 'D', 'V', 'E', 'V'] },
  { pos: 10, ico: '🟢', nom: 'La Llantia, A.D A', pj: 29, pg: 10, pe: 7, pp: 12, gf: 40, gc: 49, pts: 37, forma: ['E', 'D', 'V', 'D', 'E'] },
  { pos: 11, ico: '🔵', nom: 'Sant Pol, AT. A', pj: 29, pg: 10, pe: 6, pp: 13, gf: 37, gc: 48, pts: 36, forma: ['V', 'D', 'D', 'E', 'D'] },
  { pos: 12, ico: '🟣', nom: 'Premià de Mar, C.F. A', pj: 29, pg: 9, pe: 7, pp: 13, gf: 35, gc: 50, pts: 34, forma: ['D', 'E', 'D', 'V', 'D'] },
  { pos: 13, ico: '🔴', nom: 'Masnou, C.D. A', pj: 29, pg: 8, pe: 7, pp: 14, gf: 33, gc: 53, pts: 31, forma: ['D', 'D', 'E', 'D', 'V'] },
  { pos: 14, ico: '🔵', nom: 'Mataronesa, U.D A', pj: 29, pg: 7, pe: 5, pp: 17, gf: 30, gc: 58, pts: 26, forma: ['D', 'D', 'D', 'E', 'D'] },
  { pos: 15, ico: '🟢', nom: 'Alella, C.F. A', pj: 29, pg: 5, pe: 6, pp: 18, gf: 27, gc: 62, pts: 21, forma: ['D', 'D', 'D', 'D', 'E'] },
  { pos: 16, ico: '🟡', nom: 'Sant Cebrià 2021 A', pj: 29, pg: 3, pe: 4, pp: 22, gf: 20, gc: 70, pts: 13, forma: ['D', 'D', 'D', 'D', 'D'] },
]

export const RIVALES_GOLEADORES = [
  { ini: 'MR', nom: 'Marc Roca', club: 'Vilassar Dalt', goles: 18, asist: 5, pj: 28 },
  { ini: 'JC', nom: 'Jordi Casas', club: 'Cabrils CE', goles: 16, asist: 3, pj: 26 },
  { ini: 'PV', nom: 'Pau Vilaró', club: 'CF Montgat', goles: 14, asist: 7, pj: 29 },
  { ini: 'DA', nom: 'David Anglès', club: 'CF Arenys de Mar', goles: 12, asist: 4, pj: 27, miEquipo: true },
  { ini: 'SR', nom: 'Sergi Ribas', club: 'Malgrat CE', goles: 11, asist: 2, pj: 25 },
  { ini: 'TF', nom: 'Tomàs Ferrer', club: 'CF Arenys de Mar', goles: 10, asist: 6, pj: 29, miEquipo: true },
  { ini: 'AB', nom: 'Arnau Bosch', club: 'Premia Dalt', goles: 9, asist: 1, pj: 27 },
  { ini: 'IG', nom: 'Ivan Guitart', club: "Pla d'en Boet", goles: 9, asist: 3, pj: 28 },
  { ini: 'NM', nom: 'Nil Martínez', club: 'Masnou AT', goles: 8, asist: 2, pj: 24 },
  { ini: 'JM', nom: 'Josep Mas', club: 'Tiana CCE', goles: 7, asist: 4, pj: 26 },
  { ini: 'RB', nom: 'Roger Boada', club: 'CF Arenys de Mar', goles: 7, asist: 2, pj: 22, miEquipo: true },
  { ini: 'XP', nom: 'Xavier Pons', club: 'Sant Pol AT', goles: 6, asist: 5, pj: 27 },
  { ini: 'MC', nom: 'Miquel Cortès', club: 'La Llantia AD', goles: 6, asist: 1, pj: 25 },
  { ini: 'EP', nom: 'Eric Puig', club: 'Premià de Mar', goles: 5, asist: 3, pj: 23 },
  { ini: 'HV', nom: 'Hèctor Vidal', club: 'Masnou CD', goles: 5, asist: 0, pj: 21 },
]
