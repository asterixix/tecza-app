"use client";

// Crypto utilities for end-to-end encryption
export class MessageEncryption {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  // Generate a new AES-GCM key
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // Export key to base64
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  // Import key from base64
  static async importKey(keyData: string): Promise<CryptoKey> {
    const raw = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Wrap key with user's public key (for key exchange)
  static async wrapKey(key: CryptoKey, publicKey: CryptoKey): Promise<string> {
    const wrapped = await crypto.subtle.wrapKey(
      "raw",
      key,
      publicKey,
      { name: "RSA-OAEP" }
    );
    return btoa(String.fromCharCode(...new Uint8Array(wrapped)));
  }

  // Unwrap key with user's private key
  static async unwrapKey(wrappedKey: string, privateKey: CryptoKey): Promise<CryptoKey> {
    const raw = Uint8Array.from(atob(wrappedKey), c => c.charCodeAt(0));
    return await crypto.subtle.unwrapKey(
      "raw",
      raw,
      privateKey,
      { name: "RSA-OAEP" },
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Encrypt text message
  static async encryptText(text: string, key: CryptoKey): Promise<{ cipher: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      this.encoder.encode(text)
    );
    
    return {
      cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  // Decrypt text message
  static async decryptText(cipher: string, iv: string, key: CryptoKey): Promise<string> {
    const cipherData = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));
    const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivData },
      key,
      cipherData
    );
    
    return this.decoder.decode(decrypted);
  }

  // Encrypt file/media
  static async encryptFile(file: ArrayBuffer, key: CryptoKey): Promise<{ cipher: ArrayBuffer; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      file
    );
    
    return {
      cipher: encrypted,
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  // Decrypt file/media
  static async decryptFile(cipher: ArrayBuffer, iv: string, key: CryptoKey): Promise<ArrayBuffer> {
    const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    return await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivData },
      key,
      cipher
    );
  }

  // Generate RSA key pair for key exchange
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["wrapKey", "unwrapKey"]
    );
  }

  // Export public key
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  // Import public key
  static async importPublicKey(keyData: string): Promise<CryptoKey> {
    const raw = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      "spki",
      raw,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["wrapKey"]
    );
  }
}
