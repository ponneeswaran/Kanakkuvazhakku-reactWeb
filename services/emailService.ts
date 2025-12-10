
// Simulated Email Service

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
    // In a real app, this would call a backend endpoint.
    // For this offline-first demo, we simulate the network request and log the OTP.
    console.log(`%c[EmailService] 📧 Sending OTP to ${email}: ${otp}`, 'color: #0d9488; font-weight: bold; font-size: 14px; background: #f0fdfa; padding: 4px; border-radius: 4px;');
    
    // Simulate network delay for OTP only (since it's an alert, not a sensitive API call like navigator.share)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Show alert for testing purposes in deployed environments where console might not be accessible
    alert(`[DEMO EMAIL SERVICE]\n\n To: ${email}\n OTP: ${otp}\n\n(This is a simulation for the offline demo)`);
    
    return true;
  };

export const sendBackupEmail = async (email: string, encryptedData: string): Promise<boolean> => {
    console.log(`%c[EmailService] 📧 Opening Email App for Backup to ${email}`, 'color: #0d9488; font-weight: bold; font-size: 14px; background: #f0fdfa; padding: 4px; border-radius: 4px;');
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `kanakku_backup_${date}.kbf`;
    
    // Create a file object from the encrypted string
    const file = new File([encryptedData], filename, {
        type: 'text/plain',
    });

    const subject = "🔒 Kanakkuvazhakku Backup Data";
    const body = `Dear User,

Please find attached your secure, encrypted backup file from Kanakkuvazhakku.

Filename: ${filename}

To Restore:
1. Save this file to your device.
2. Open Kanakkuvazhakku.
3. Navigate to Account > Data Management.
4. Select 'Import Backup' and choose this file.

Note: This file is encrypted and can only be opened within the app.

Best regards,
Kanakkuvazhakku Team`;

    const shareData = {
        title: subject,
        text: body,
        files: [file]
    };

    try {
        // Attempt to share the file (works on most Mobile Browsers: Chrome Android, Safari iOS, etc.)
        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return true;
        } else {
            // Fallback for browsers that don't support file sharing via Web API (e.g. Desktop)
            // We cannot attach a client-side file to a mailto: link due to browser security.
            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            
            alert("Your browser does not support automatically attaching files via the Share menu. We have opened your email draft, but you cannot attach the file because downloading is disabled in this mode.");
            return false;
        }
    } catch (error) {
        console.error("Error sharing backup:", error);
        // If user cancelled the share sheet, we consider it 'handled' but return false
        if ((error as Error).name !== 'AbortError') {
             alert("Failed to open email app. Please try again.");
        }
        return false;
    }
}

export const sendExportEmail = async (email: string, csvData: string): Promise<boolean> => {
    console.log(`%c[EmailService] 📧 Opening Email App for Export to ${email}`, 'color: #0d9488; font-weight: bold; font-size: 14px; background: #f0fdfa; padding: 4px; border-radius: 4px;');
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `kanakku_expenses_${date}.csv`;

    // Create a file object from the CSV string
    const file = new File([csvData], filename, {
        type: 'text/csv',
    });

    const subject = "📊 Kanakkuvazhakku Expense Report";
    const body = `Dear User,

Here is your expense report in CSV format.

You can open this file in Excel, Google Sheets, or any spreadsheet software to analyze your spending.

Best regards,
Kanakkuvazhakku Team`;

    const shareData = {
        title: subject,
        text: body,
        files: [file]
    };

    try {
        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return true;
        } else {
            // Fallback
            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            
            alert("Your browser does not support automatically attaching files via the Share menu. We have opened your email draft, but you cannot attach the file because downloading is disabled in this mode.");
            return false;
        }
    } catch (error) {
        console.error("Error sharing export:", error);
         if ((error as Error).name !== 'AbortError') {
             alert("Failed to open email app. Please try again.");
        }
        return false;
    }
}
