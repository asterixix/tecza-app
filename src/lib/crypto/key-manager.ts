"use client";

// Minimal key manager: prefers WebCrypto with sessionStorage fallback; avoids IndexedDB by default for multi-device
export class KeyManager {
  private static privKeyCache: CryptoKey | null = null;

  static async getOrCreateKeyPair(): Promise<{ publicKey: string; privateKey: CryptoKey }>{
    if (this.privKeyCache) {
      const pub = sessionStorage.getItem("rsa_pub_spki_b64");
      if (pub) return { publicKey: pub, privateKey: this.privKeyCache };
    }
    const pair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["wrapKey", "unwrapKey"]
    );
    const spki = await crypto.subtle.exportKey("spki", pair.publicKey);
    const publicKey = btoa(String.fromCharCode(...new Uint8Array(spki)));
    this.privKeyCache = pair.privateKey;
    sessionStorage.setItem("rsa_pub_spki_b64", publicKey);
    return { publicKey, privateKey: pair.privateKey };
  }

  static async setPrivateKeyFromPkcs8(b64: string) {
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    this.privKeyCache = await crypto.subtle.importKey(
      "pkcs8",
      raw,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["unwrapKey"]
    );
  }

  static getPrivateKey(): CryptoKey | null {
    return this.privKeyCache;
  }

  static async exportPrivateKeyPkcs8B64(): Promise<string> {
    if (!this.privKeyCache) throw new Error("No private key in memory");
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", this.privKeyCache);
    return btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  }
}
