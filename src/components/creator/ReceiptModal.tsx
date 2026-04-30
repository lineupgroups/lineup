import { useState, useCallback } from 'react';
import { X, Download, FileText, Printer, CheckCircle, Building2, User, Calendar, CreditCard, Receipt as ReceiptIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface DonationItem {
    id: string;
    amount: number;
    projectTitle: string;
    projectId: string;
    date: Date;
    transactionId?: string;
}

interface Supporter {
    id: string;
    userId: string;
    displayName: string;
    anonymous: boolean;
}

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    supporter: Supporter;
    donation: DonationItem;
    creatorName?: string;
}

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Generate mock transaction ID if not provided
const generateTransactionId = (donationId: string): string => {
    const prefix = 'LU';
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = donationId.slice(0, 6).toUpperCase();
    return `${prefix}${timestamp}${randomPart}`;
};

// Generate receipt number
const generateReceiptNumber = (donationId: string, date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hash = donationId.slice(0, 8).toUpperCase();
    return `RCP-${year}${month}-${hash}`;
};

// Amount in words (Indian numbering system)
const amountInWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (amount === 0) return 'Zero Rupees Only';
    if (amount < 20) return ones[amount] + ' Rupees Only';
    if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 !== 0 ? ' ' + ones[amount % 10] : '') + ' Rupees Only';
    if (amount < 1000) return ones[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 !== 0 ? ' and ' + amountInWords(amount % 100).replace(' Rupees Only', '') : '') + ' Rupees Only';
    if (amount < 100000) return amountInWords(Math.floor(amount / 1000)).replace(' Rupees Only', '') + ' Thousand' + (amount % 1000 !== 0 ? ' ' + amountInWords(amount % 1000).replace(' Rupees Only', '') : '') + ' Rupees Only';
    if (amount < 10000000) return amountInWords(Math.floor(amount / 100000)).replace(' Rupees Only', '') + ' Lakh' + (amount % 100000 !== 0 ? ' ' + amountInWords(amount % 100000).replace(' Rupees Only', '') : '') + ' Rupees Only';
    return amountInWords(Math.floor(amount / 10000000)).replace(' Rupees Only', '') + ' Crore' + (amount % 10000000 !== 0 ? ' ' + amountInWords(amount % 10000000).replace(' Rupees Only', '') : '') + ' Rupees Only';
};

export default function ReceiptModal({
    isOpen,
    onClose,
    supporter,
    donation,
    creatorName = 'Project Creator'
}: ReceiptModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const receiptNumber = generateReceiptNumber(donation.id, donation.date);
    const transactionId = donation.transactionId || generateTransactionId(donation.id);

    // Handle PDF download
    const handleDownloadPDF = useCallback(async () => {
        setIsGenerating(true);

        try {
            // Dynamic import to reduce bundle size
            const { default: jsPDF } = await import('jspdf');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header with orange accent
            doc.setFillColor(249, 115, 22);
            doc.rect(0, 0, pageWidth, 8, 'F');

            // Logo placeholder
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('LINEUP', 14, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Crowdfunding Platform', 14, 32);

            // Receipt title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('DONATION RECEIPT', pageWidth - 14, 25, { align: 'right' });

            // Receipt number and date
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Receipt #: ${receiptNumber}`, pageWidth - 14, 32, { align: 'right' });
            doc.text(`Date: ${donation.date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })}`, pageWidth - 14, 38, { align: 'right' });

            // Divider
            doc.setDrawColor(229, 231, 235);
            doc.line(14, 48, pageWidth - 14, 48);

            // From/To Section
            let yPos = 60;

            // From (Creator)
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('FROM', 14, yPos);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(creatorName, 14, yPos + 7);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Project: ${donation.projectTitle}`, 14, yPos + 14);
            doc.text('via Lineup Platform', 14, yPos + 20);

            // To (Backer)
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('TO', pageWidth / 2 + 10, yPos);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(supporter.anonymous ? 'Anonymous Supporter' : supporter.displayName, pageWidth / 2 + 10, yPos + 7);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`User ID: ${supporter.userId.slice(0, 8)}...`, pageWidth / 2 + 10, yPos + 14);

            // Divider
            yPos = 95;
            doc.line(14, yPos, pageWidth - 14, yPos);

            // Amount Section (highlighted)
            yPos = 105;
            doc.setFillColor(254, 249, 243);
            doc.roundedRect(14, yPos, pageWidth - 28, 40, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('DONATION AMOUNT', 24, yPos + 12);

            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74);
            doc.text(formatCurrency(donation.amount), 24, yPos + 28);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`(${amountInWords(donation.amount)})`, 24, yPos + 36);

            // Transaction Details
            yPos = 160;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Transaction Details', 14, yPos);

            const details = [
                ['Transaction ID', transactionId],
                ['Payment Date', donation.date.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })],
                ['Project', donation.projectTitle],
                ['Payment Method', 'Online Payment'],
                ['Status', 'Successful']
            ];

            yPos += 10;
            doc.setFontSize(9);
            details.forEach(([label, value], index) => {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(label, 14, yPos + (index * 10));
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(value, 80, yPos + (index * 10));
            });

            // Note
            yPos = 230;
            doc.setFillColor(239, 246, 255);
            doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(59, 130, 246);
            doc.text('Note: This receipt is for your records. Lineup is a crowdfunding platform and does not', 20, yPos + 10);
            doc.text('provide tax exemption certificates. Please consult your tax advisor for tax-related queries.', 20, yPos + 17);

            // Footer
            yPos = 270;
            doc.setDrawColor(229, 231, 235);
            doc.line(14, yPos, pageWidth - 14, yPos);

            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, yPos + 8, { align: 'center' });
            doc.text('Lineup - Crowdfunding Platform | support@lineup.com | www.lineup.com', pageWidth / 2, yPos + 15, { align: 'center' });

            // Save
            doc.save(`Receipt_${receiptNumber}.pdf`);
            toast.success('Receipt downloaded successfully!');
        } catch (error) {
            console.error('Receipt generation error:', error);
            toast.error('Failed to generate receipt. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [donation, supporter, creatorName, receiptNumber, transactionId]);

    // Handle print
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="bg-[#111] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header - Hidden on print */}
                    <div className="flex items-center justify-between p-6 border-b border-neutral-800 print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
                                <ReceiptIcon className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-brand-white">Donation Receipt</h2>
                                <p className="text-sm text-neutral-500">Preview and download</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Receipt Preview */}
                    <div className="p-8 bg-brand-black print:bg-[#111] print:p-0">
                        <div className="bg-[#111] rounded-3xl shadow-sm border border-neutral-800 p-8 print:shadow-none print:border-none">
                            {/* Orange accent bar */}
                            <div className="h-2 bg-gradient-to-r from-brand-orange/100 to-amber-500 -mx-8 -mt-8 rounded-t-xl mb-6 print:rounded-none" />

                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-orange-500">LINEUP</h1>
                                    <p className="text-sm text-neutral-500">Crowdfunding Platform</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-bold text-brand-white">DONATION RECEIPT</h2>
                                    <p className="text-sm text-neutral-500">#{receiptNumber}</p>
                                    <p className="text-sm text-neutral-500">
                                        {donation.date.toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-neutral-800 my-6" />

                            {/* From/To */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1">From</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="w-4 h-4 text-neutral-600" />
                                        <p className="font-semibold text-brand-white">{creatorName}</p>
                                    </div>
                                    <p className="text-sm text-neutral-400">Project: {donation.projectTitle}</p>
                                    <p className="text-sm text-neutral-500">via Lineup Platform</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1">To</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-neutral-600" />
                                        <p className="font-semibold text-brand-white">
                                            {supporter.anonymous ? 'Anonymous Supporter' : supporter.displayName}
                                        </p>
                                    </div>
                                    <p className="text-sm text-neutral-500">User ID: {supporter.userId.slice(0, 8)}...</p>
                                </div>
                            </div>

                            {/* Amount Box */}
                            <div className="bg-gradient-to-r from-brand-orange/10 to-amber-50 rounded-3xl p-6 mb-8 border border-brand-orange/20">
                                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Donation Amount</p>
                                <p className="text-4xl font-bold text-green-400 mb-2">
                                    {formatCurrency(donation.amount)}
                                </p>
                                <p className="text-sm text-neutral-400 italic">
                                    ({amountInWords(donation.amount)})
                                </p>
                            </div>

                            {/* Transaction Details */}
                            <div className="mb-8">
                                <h3 className="font-semibold text-brand-white mb-4">Transaction Details</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-4 h-4 text-neutral-600" />
                                        <span className="text-sm text-neutral-400 w-32">Transaction ID</span>
                                        <span className="text-sm font-mono font-medium text-brand-white">{transactionId}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-neutral-600" />
                                        <span className="text-sm text-neutral-400 w-32">Payment Date</span>
                                        <span className="text-sm font-medium text-brand-white">
                                            {donation.date.toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-neutral-600" />
                                        <span className="text-sm text-neutral-400 w-32">Project</span>
                                        <span className="text-sm font-medium text-brand-white">{donation.projectTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-neutral-400 w-32">Status</span>
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                                            Successful
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Note */}
                            <div className="bg-blue-500/10 rounded-2xl p-4 mb-6 border border-blue-100">
                                <p className="text-xs text-blue-400">
                                    <strong>Note:</strong> This receipt is for your records. Lineup is a crowdfunding platform
                                    and does not provide tax exemption certificates. Please consult your tax advisor for
                                    tax-related queries.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-neutral-800 pt-4 text-center">
                                <p className="text-xs text-neutral-600">
                                    This is a computer-generated receipt and does not require a signature.
                                </p>
                                <p className="text-xs text-neutral-600 mt-1">
                                    Lineup - Crowdfunding Platform | support@lineup.com | www.lineup.com
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions - Hidden on print */}
                    <div className="flex items-center justify-end gap-3 p-6 bg-brand-black rounded-b-2xl print:hidden">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2.5 text-neutral-300 bg-[#111] border border-neutral-700 rounded-2xl hover:bg-brand-black transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
