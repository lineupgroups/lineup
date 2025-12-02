import { jsPDF } from 'jspdf';
import { DonationData } from '../lib/donationService';
import { format } from 'date-fns';

export const generateReceipt = (donation: DonationData, projectTitle: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(234, 88, 12); // Orange-600
    doc.text('Lineup', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Donation Receipt', pageWidth - 20, 20, { align: 'right' });

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 30, pageWidth - 20, 30);

    // Receipt Details
    doc.setFontSize(10);
    doc.setTextColor(50);

    const startY = 50;
    const lineHeight = 10;

    doc.text(`Receipt Number: ${donation.transactionId}`, 20, startY);
    doc.text(`Date: ${format(donation.backedAt.toDate(), 'MMMM d, yyyy')}`, 20, startY + lineHeight);
    doc.text(`Payment Reference: ${donation.paymentReference}`, 20, startY + lineHeight * 2);

    // Donor Details
    doc.setFontSize(14);
    doc.text('Donor Information', 20, startY + lineHeight * 4);
    doc.setFontSize(10);
    doc.text(`Name: ${donation.paymentDetails.name}`, 20, startY + lineHeight * 5);
    doc.text(`Email: ${donation.paymentDetails.email}`, 20, startY + lineHeight * 6);

    // Donation Details
    doc.setFontSize(14);
    doc.text('Donation Details', 20, startY + lineHeight * 8);

    // Table Header
    const tableTop = startY + lineHeight * 9;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, tableTop, pageWidth - 40, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Project', 25, tableTop + 7);
    doc.text('Amount', pageWidth - 25, tableTop + 7, { align: 'right' });

    // Table Content
    doc.setFont('helvetica', 'normal');
    doc.text(projectTitle, 25, tableTop + 20);
    doc.text(`₹${donation.amount.toLocaleString('en-IN')}`, pageWidth - 25, tableTop + 20, { align: 'right' });

    // Total
    doc.setDrawColor(200);
    doc.line(20, tableTop + 30, pageWidth - 20, tableTop + 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', pageWidth - 60, tableTop + 40);
    doc.text(`₹${donation.amount.toLocaleString('en-IN')}`, pageWidth - 25, tableTop + 40, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is a computer generated receipt and does not require a signature.', 20, footerY);
    doc.text('Thank you for supporting creators on Lineup!', 20, footerY + 10);
    doc.text('Lineup Inc. | support@lineup.com', 20, footerY + 20);

    // Save
    doc.save(`receipt_${donation.transactionId}.pdf`);
};
