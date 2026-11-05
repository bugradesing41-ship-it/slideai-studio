export type ExportImage = { name: string; bytes: Uint8Array };

const encoder = new TextEncoder();

function join(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function blobPart(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function imageDataBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function checksum(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function header(size: number, fields: [number, number, number][]) {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  for (const [offset, value, width] of fields) {
    if (width === 2) view.setUint16(offset, value, true);
    else view.setUint32(offset, value, true);
  }
  return bytes;
}

export function makeZip(files: ExportImage[]) {
  if (!files.length) throw new Error("No slides to export.");
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  let centralLength = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = file.bytes;
    const crc = checksum(data);
    const localHeader = header(30, [
      [0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2],
      [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, data.length, 4],
      [22, data.length, 4], [26, name.length, 2], [28, 0, 2],
    ]);
    local.push(localHeader, name, data);
    const centralHeader = header(46, [
      [0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2],
      [10, 0, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4],
      [20, data.length, 4], [24, data.length, 4], [28, name.length, 2],
      [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 4], [42, offset, 4],
    ]);
    central.push(centralHeader, name);
    centralLength += centralHeader.length + name.length;
    offset += localHeader.length + name.length + data.length;
  }
  const end = header(22, [
    [0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2],
    [10, files.length, 2], [12, centralLength, 4], [16, offset, 4], [20, 0, 2],
  ]);
  return new Blob([blobPart(join([...local, ...central, end]))], { type: "application/zip" });
}

export type PdfPage = { bytes: Uint8Array; width: number; height: number };

export function makePdf(pages: PdfPage[], pageWidth: number, pageHeight: number) {
  if (!pages.length) throw new Error("No slides to export.");
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const add = (part: Uint8Array) => { chunks.push(part); length += part.length; };
  const text = (value: string) => add(encoder.encode(value));
  const object = (id: number, body: Uint8Array[]) => {
    offsets[id] = length;
    text(id + " 0 obj\n");
    body.forEach(add);
    text("\nendobj\n");
  };
  const kids = pages.map((_, i) => (3 + i * 3) + " 0 R").join(" ");
  text("%PDF-1.4\n");
  object(1, [encoder.encode("<< /Type /Catalog /Pages 2 0 R >>")]);
  object(2, [encoder.encode("<< /Type /Pages /Kids [" + kids + "] /Count " + pages.length + " >>")]);
  pages.forEach((page, i) => {
    const id = 3 + i * 3;
    const content = encoder.encode("q\n" + pageWidth + " 0 0 " + pageHeight + " 0 0 cm\n/Im0 Do\nQ");
    object(id, [encoder.encode("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] /Resources << /XObject << /Im0 " + (id + 2) + " 0 R >> >> /Contents " + (id + 1) + " 0 R >>")]);
    object(id + 1, [encoder.encode("<< /Length " + content.length + " >>\nstream\n"), content, encoder.encode("\nendstream")]);
    object(id + 2, [encoder.encode("<< /Type /XObject /Subtype /Image /Width " + page.width + " /Height " + page.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + page.bytes.length + " >>\nstream\n"), page.bytes, encoder.encode("\nendstream")]);
  });
  const xref = length;
  text("xref\n0 " + offsets.length + "\n0000000000 65535 f \n");
  for (let i = 1; i < offsets.length; i++) text(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
  text("trailer\n<< /Size " + offsets.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
  return new Blob([blobPart(join(chunks))], { type: "application/pdf" });
}
