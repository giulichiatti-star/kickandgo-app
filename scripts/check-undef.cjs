// Chequeo de variables no definidas (no-undef) en toda la app.
// Caza el bug de "pantalla en negro" por variable usada fuera de su scope
// (ej. props no pasadas a un subcomponente). El build de Vite NO detecta esto
// porque son errores de runtime. Correr antes de cada deploy: `npm run check`.
const { Linter } = require('eslint')
const fs = require('fs')
const path = require('path')

const linter = new Linter()
const globals = {}
;[
  'window','document','navigator','localStorage','sessionStorage','setTimeout',
  'clearTimeout','setInterval','clearInterval','console','CustomEvent','Blob',
  'URL','URLSearchParams','fetch','alert','confirm','prompt','FileReader','Audio',
  'Image','SpeechRecognition','webkitSpeechRecognition','requestAnimationFrame',
  'cancelAnimationFrame','Date','Math','JSON','Object','Array','String','Number',
  'Boolean','Promise','Map','Set','parseInt','parseFloat','isNaN','isFinite',
  'FormData','Notification','ServiceWorkerRegistration','atob','btoa',
  'structuredClone','crypto','performance','history','location','MediaRecorder',
  'AudioContext','webkitAudioContext','Event','MessageChannel','WebSocket',
  'TextEncoder','TextDecoder','process','globalThis','RegExp','Error','Symbol',
  'Intl','encodeURIComponent','decodeURIComponent','matchMedia',
].forEach((k) => { globals[k] = 'readonly' })

function walk(dir) {
  let out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out = out.concat(walk(p))
    else if (/\.jsx?$/.test(e.name)) out.push(p)
  }
  return out
}

let total = 0
for (const file of walk('src')) {
  const code = fs.readFileSync(file, 'utf8')
  const msgs = linter.verify(code, {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    env: { browser: true, es2022: true },
    globals,
    rules: { 'no-undef': 'error' },
  }).filter((m) => m.ruleId === 'no-undef')
  if (msgs.length) {
    total += msgs.length
    console.log(`\n${file}`)
    msgs.forEach((m) => console.log(`  L${m.line}: ${m.message}`))
  }
}

if (total) {
  console.log(`\n❌ ${total} variable(s) no definida(s) — arreglar antes de deployar`)
  process.exit(1)
}
console.log('✅ OK: cero no-undef en toda la app')
