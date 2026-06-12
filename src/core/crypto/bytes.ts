const HEX_ALPHABET = '0123456789abcdef';

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += HEX_ALPHABET[(byte >> 4) & 0x0f] + HEX_ALPHABET[byte & 0x0f];
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length.');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const next = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(next)) {
      throw new Error('Invalid hex string.');
    }
    bytes[i] = next;
  }

  return bytes;
}
