"use client"

// Simple passphrase vault using PBKDF2 + AES-GCM
export type VaultBlob = {
  v: 1
  salt_b64: string
  iv_b64: string
  cipher_b64: string
}

function b64encode(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function b64decode(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array | ArrayBuffer,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const saltU8 = salt instanceof Uint8Array ? salt : new Uint8Array(salt)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )
  const saltAB = saltU8.buffer.slice(
    saltU8.byteOffset,
    saltU8.byteOffset + saltU8.byteLength,
  ) as ArrayBuffer
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltAB, iterations: 150_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function encryptPrivateKeyPkcs8B64(
  pkcs8b64: string,
  passphrase: string,
): Promise<VaultBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const data = b64decode(pkcs8b64)
  const dataBuf = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataBuf,
  )
  return {
    v: 1,
    salt_b64: b64encode(salt.buffer),
    iv_b64: b64encode(iv.buffer),
    cipher_b64: b64encode(cipher),
  }
}

export async function decryptPrivateKeyPkcs8B64(
  vault: VaultBlob,
  passphrase: string,
): Promise<string> {
  const saltU8 = b64decode(vault.salt_b64)
  const salt = saltU8.buffer.slice(
    saltU8.byteOffset,
    saltU8.byteOffset + saltU8.byteLength,
  ) as ArrayBuffer
  const ivU8 = b64decode(vault.iv_b64)
  const iv = ivU8.buffer.slice(
    ivU8.byteOffset,
    ivU8.byteOffset + ivU8.byteLength,
  ) as ArrayBuffer
  const key = await deriveKey(passphrase, salt)
  const cipher = b64decode(vault.cipher_b64)
  const cipherBuf = cipher.buffer.slice(
    cipher.byteOffset,
    cipher.byteOffset + cipher.byteLength,
  ) as ArrayBuffer
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBuf,
  )
  return b64encode(plain)
}
