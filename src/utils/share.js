import { serialize, parse, toSheetState } from './toml'

const SHARE_PARAM = 's'
const MAX_SHARE_BYTES = 512 * 1024

async function gzipCompress(str) {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

async function gzipDecompress(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return await new Response(stream).text()
}

function bytesToBase64Url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(str) {
  const pad = (4 - (str.length % 4)) % 4
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function encodeShareData(state) {
  const toml = serialize(state)
  const bytes = await gzipCompress(toml)
  return bytesToBase64Url(bytes)
}

export async function decodeShareData(encoded) {
  const bytes = base64UrlToBytes(encoded)
  if (bytes.length > MAX_SHARE_BYTES) throw new Error('Share payload too large')
  const toml = await gzipDecompress(bytes)
  return toSheetState(parse(toml))
}

export function buildShareUrl(encoded) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${SHARE_PARAM}=${encoded}`
}

export function readShareFromLocation() {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return null
  const raw = hash.slice(1)
  const params = new URLSearchParams(raw)
  return params.get(SHARE_PARAM)
}

export function clearShareFromLocation() {
  const { origin, pathname, search } = window.location
  window.history.replaceState(null, '', `${origin}${pathname}${search}`)
}
