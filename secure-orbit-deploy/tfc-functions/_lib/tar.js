// Minimal USTAR tar + gzip builder using only Web-standard APIs (TextEncoder,
// CompressionStream) so it runs in Deno without any external dependency.
// Verified by round-tripping through `tar -xzf` during development.

function writeStr(block, offset, str, len) {
  const bytes = new TextEncoder().encode(str);
  block.set(bytes.subarray(0, len), offset);
}

function buildHeader(name, size) {
  const block = new Uint8Array(512);
  writeStr(block, 0, name, 100);
  writeStr(block, 100, "0000644\0", 8); // mode
  writeStr(block, 108, "0000000\0", 8); // uid
  writeStr(block, 116, "0000000\0", 8); // gid
  writeStr(block, 124, `${size.toString(8).padStart(11, "0")}\0`, 12);
  const mtime = `${Math.floor(Date.now() / 1000).toString(8).padStart(11, "0")}\0`;
  writeStr(block, 136, mtime, 12);
  writeStr(block, 148, "        ", 8); // checksum placeholder
  writeStr(block, 156, "0", 1); // typeflag: regular file
  writeStr(block, 257, "ustar\0", 6); // magic
  writeStr(block, 263, "00", 2); // version

  let sum = 0;
  for (let i = 0; i < 512; i++) sum += block[i];
  writeStr(block, 148, `${sum.toString(8).padStart(6, "0")}\0 `, 8);
  return block;
}

function pad512(buf) {
  const rem = buf.length % 512;
  if (rem === 0) return buf;
  const padded = new Uint8Array(buf.length + (512 - rem));
  padded.set(buf);
  return padded;
}

/** @param {{name: string, content: string}[]} files */
export function buildTar(files) {
  const parts = [];
  for (const f of files) {
    const content = new TextEncoder().encode(f.content);
    parts.push(buildHeader(f.name, content.length), pad512(content));
  }
  parts.push(new Uint8Array(1024)); // two zero blocks mark end of archive

  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** @param {{name: string, content: string}[]} files */
export async function buildTarGz(files) {
  const tar = buildTar(files);
  const stream = new Blob([tar]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}
