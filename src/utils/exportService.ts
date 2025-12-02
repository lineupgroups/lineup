import { jsPDF } from 'jspdf';
import { FirestoreDonation } from '../types/firestore';

/**
 * Exports data to CSV format
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle strings with commas, quotes, or newlines
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                // Handle dates/objects
                if (typeof value === 'object' && value !== null) {
                    if (value.seconds) { // Firestore timestamp
                        return new Date(value.seconds * 1000).toISOString();
                    }
                    return JSON.stringify(value).replace(/"/g, '""');
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Exports data to JSON format
 */
export const exportToJSON = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Exports donation summary to PDF
 */
export const exportDonationSummaryPDF = (donations: FirestoreDonation[], title: string = 'Donation Summary') => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(title, 14, 22);

    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Summary Stats
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const avgAmount = totalAmount / (donations.length || 1);

    doc.setFontSize(12);
    doc.text(`Total Donations: ${donations.length}`, 14, 45);
    doc.text(`Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`, 14, 52);
    doc.text(`Average Amount: ₹${avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 14, 59);

    // Table Header
    let yPos = 75;
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, 180, 8, 'F');
    doc.font = "helvetica";
    doc.setFont("helvetica", "bold");

    doc.text('Date', 16, yPos);
    doc.text('Donor', 50, yPos);
    doc.text('Project', 90, yPos);
    doc.text('Amount', 160, yPos);

    yPos += 10;
    doc.setFont("helvetica", "normal");

    // Table Rows
    donations.forEach((donation, index) => {
        // Check for page break
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }

        const date = donation.createdAt?.seconds
            ? new Date(donation.createdAt.seconds * 1000).toLocaleDateString()
            : 'N/A';

        const donor = donation.anonymous ? 'Anonymous' : (donation.donorName || 'Unknown');
        const project = (donation.projectTitle || 'Unknown Project').substring(0, 25) + (donation.projectTitle?.length > 25 ? '...' : '');
        const amount = `₹${donation.amount.toLocaleString('en-IN')}`;

        doc.text(date, 16, yPos);
        doc.text(donor, 50, yPos);
        doc.text(project, 90, yPos);
        doc.text(amount, 160, yPos);

        yPos += 8;
    });

    doc.save('donation-summary.pdf');
};
