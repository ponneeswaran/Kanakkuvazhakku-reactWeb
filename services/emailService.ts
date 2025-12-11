

// Simulated Email Service

const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

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
    console.log(`%c[EmailService] 📧 Backup requested for ${email}`, 'color: #0d9488; font-weight: bold; font-size: 14px; background: #f0fdfa; padding: 4px; border-radius: 4px;');
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `kanakku_backup_${date}.kbf`;
    
    const file = new File([encryptedData], filename, {
        type: 'text/plain',
    });

    const subject = "🔒 Kanakkuvazhakku Backup Data";
    const body = `Dear User,\n\nPlease find attached your secure, encrypted backup file from Kanakkuvazhakku.\n\nFilename: ${filename}\n\nTo Restore:\n1. Save this file to your device.\n2. Open Kanakkuvazhakku.\n3. Navigate to Account > Data Management.\n4. Select 'Import Backup' and choose this file.\n\nNote: This file is encrypted and can only be opened within the app.\n\nBest regards,\nKanakkuvazhakku Team`;

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
            // Fallback for Desktop/Unsupported Browsers: Download directly
            downloadFile(filename, encryptedData, 'text/plain');
            setTimeout(() => alert(`Backup file '${filename}' has been downloaded to your device.`), 500);
            return true;
        }
    } catch (error) {
        console.error("Error sharing backup:", error);
        // If user cancelled, we might not want to download. 
        // But if it failed for other reasons (e.g. permission), fallback to download.
        if ((error as Error).name !== 'AbortError') {
             downloadFile(filename, encryptedData, 'text/plain');
             setTimeout(() => alert(`Backup file '${filename}' has been downloaded to your device.`), 500);
             return true;
        }
        return false;
    }
}

export const sendExportEmail = async (email: string, csvData: string): Promise<boolean> => {
    console.log(`%c[EmailService] 📧 Export requested for ${email}`, 'color: #0d9488; font-weight: bold; font-size: 14px; background: #f0fdfa; padding: 4px; border-radius: 4px;');
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `kanakku_expenses_${date}.csv`;

    const file = new File([csvData], filename, {
        type: 'text/csv',
    });

    const subject = "📊 Kanakkuvazhakku Expense Report";
    const body = `Dear User,\n\nHere is your expense report in CSV format.\n\nYou can open this file in Excel, Google Sheets, or any spreadsheet software to analyze your spending.\n\nBest regards,\nKanakkuvazhakku Team`;

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
            // Fallback for Desktop: Download directly
            downloadFile(filename, csvData, 'text/csv');
            setTimeout(() => alert(`Expense report '${filename}' has been downloaded to your device.`), 500);
            return true;
        }
    } catch (error) {
        console.error("Error sharing export:", error);
         if ((error as Error).name !== 'AbortError') {
             downloadFile(filename, csvData, 'text/csv');
             setTimeout(() => alert(`Expense report '${filename}' has been downloaded to your device.`), 500);
             return true;
        }
        return false;
    }
}
