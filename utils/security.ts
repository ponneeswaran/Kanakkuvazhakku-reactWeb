
// Simple XOR + Base64 encryption for client-side demo purposes.
// Handles Unicode correctly by encoding to UTF-8 bytes first.
// In a production environment, use Web Crypto API (SubtleCrypto).

const SECRET_KEY = "kanakku_offline_secret_key";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    // Encode to UTF-8 bytes to handle all unicode characters (Tamil, Emojis, etc.)
    const bytes = textEncoder.encode(jsonString);
    const keyBytes = textEncoder.encode(SECRET_KEY);
    
    const encryptedBytes = new Uint8Array(bytes.length);
    
    // XOR Encryption on bytes
    for (let i = 0; i < bytes.length; i++) {
      encryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert Uint8Array to binary string for btoa
    // Using a loop prevents stack overflow with large data
    let binary = '';
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(encryptedBytes[i]);
    }
    
    return btoa(binary);
  } catch (e) {
    console.error("Encryption failed", e);
    return "";
  }
};

export const decryptData = (encryptedString: string): any => {
  try {
    if (!encryptedString) return null;
    
    const binary = atob(encryptedString);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    
    // XOR Decryption
    const keyBytes = textEncoder.encode(SECRET_KEY);
    const decryptedBytes = new Uint8Array(bytes.length);
    
    for (let i = 0; i < bytes.length; i++) {
        decryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    const jsonString = textDecoder.decode(decryptedBytes);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};
