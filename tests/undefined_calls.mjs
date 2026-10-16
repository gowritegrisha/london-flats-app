#!/usr/bin/env node
/** Fail if app.js calls an identifier that is not declared/defined or a known global. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app.js');

const require = createRequire(import.meta.url);
let acorn;
try { acorn = require('acorn'); }
catch {
  try { acorn = require('/usr/share/nodejs/acorn/dist/acorn.js'); }
  catch { acorn = await import('acorn'); }
}
const parse = acorn.parse || acorn.default?.parse;
if (!parse) { console.error('acorn parse not found'); process.exit(2); }

const GLOBALS = new Set([
  'Array','Boolean','Date','Error','EvalError','Infinity','JSON','Map','Math','NaN','Number','Object',
  'Promise','Proxy','RangeError','ReferenceError','Reflect','RegExp','Set','String','Symbol','SyntaxError',
  'TypeError','URIError','WeakMap','WeakSet','BigInt','AbortController','Blob','DOMParser','FormData',
  'Image','IntersectionObserver','MutationObserver','URL','URLSearchParams','TextEncoder','TextDecoder',
  'FileReader','Headers','Request','Response','atob','btoa','clearInterval','clearTimeout','decodeURI',
  'decodeURIComponent','encodeURI','encodeURIComponent','escape','eval','fetch','isFinite','isNaN',
  'parseFloat','parseInt','queueMicrotask','setInterval','setTimeout','structuredClone','unescape',
  'requestAnimationFrame','cancelAnimationFrame','console','document','window','navigator','location',
  'history','localStorage','sessionStorage','performance','alert','confirm','prompt','devicePixelRatio',
  'Telegram','DBG','undefined','null','true','false','this','arguments','event','globalThis','self',
  'HTMLElement','Element','Node','CSS','Intl','crypto','OfflineAudioContext','webkitURL',
]);

const src = fs.readFileSync(APP, 'utf8');
const ast = parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true });

const declared = new Set();
function addDecl(name) { if (name) declared.add(name); }

function walk(node, fn, parent = null) {
  if (!node || typeof node !== 'object') return;
  fn(node, parent);
  for (const k of Object.keys(node)) {
    if (k === 'start' || k === 'end' || k === 'loc' || k === 'range') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => walk(c, fn, node));
    else if (v && typeof v === 'object' && v.type) walk(v, fn, node);
  }
}

walk(ast, (node) => {
  if (node.type === 'FunctionDeclaration' && node.id) addDecl(node.id.name);
  if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier') addDecl(node.id.name);
  if (node.type === 'ClassDeclaration' && node.id) addDecl(node.id.name);
  if (node.type === 'AssignmentExpression' && node.left?.type === 'MemberExpression'
      && node.left.object?.name === 'window' && node.left.property?.type === 'Identifier') {
    addDecl(node.left.property.name);
  }
});

const missing = [];
walk(ast, (node, parent) => {
  if (node.type !== 'CallExpression') return;
  let name = null;
  if (node.callee.type === 'Identifier') name = node.callee.name;
  // skip member calls like obj.foo(), console.log, tg.ready
  if (!name) return;
  if (declared.has(name) || GLOBALS.has(name)) return;
  // keywords wrongly seen as calls shouldn't appear
  if (['if','for','while','switch','catch','return','typeof','new','void','delete','await','yield'].includes(name)) return;
  const line = node.loc?.start?.line || '?';
  missing.push({ name, line });
});

if (missing.length) {
  console.error('undefined_calls: FAIL — called but not declared in app.js:');
  for (const m of missing) console.error(`  ${m.name} @ line ${m.line}`);
  process.exit(1);
}
console.log(`undefined_calls: OK (${declared.size} decls checked against ${APP})`);
