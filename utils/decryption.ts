(function() {
    // The hardcoded key from utils/security.ts
    const SECRET_KEY = "kanakku_offline_secret_key";
    
    // Create a hidden file input to select the .kbf file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kbf';
    
    input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        const file = target.files[0];

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                if (!event.target || typeof event.target.result !== 'string') return;
                
                const base64Content = event.target.result;
                
                // 1. Decode Base64
                const binary = atob(base64Content.trim());
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                
                // 2. Prepare Key
                const textEncoder = new TextEncoder();
                const textDecoder = new TextDecoder();
                const keyBytes = textEncoder.encode(SECRET_KEY);
                
                // 3. XOR Decrypt
                const decryptedBytes = new Uint8Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) {
                    decryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
                }
                
                // 4. Decode to String
                const jsonString = textDecoder.decode(decryptedBytes);
                
                // --- NEW: Print Raw JSON String ---
                console.log("📜 RAW JSON STRING START --------------------------------");
                console.log(jsonString);
                console.log("📜 RAW JSON STRING END ----------------------------------");
                
                // 5. Parse JSON
                const data = JSON.parse(jsonString);
                
                console.log("✅ Decryption Successful!");
                console.log("👇 Parsed Data Object:");
                console.log(data);
                
                alert("Decrypted successfully! Check the Console tab to view the raw JSON string and data.");
            } catch (err) {
                console.error("❌ Decryption Failed:", err);
                alert("Failed to decrypt the file. It might be corrupted or use a different key.");
            }
        };
        reader.readAsText(file);
    };
    
    // Trigger the file picker
    input.click();
})();
