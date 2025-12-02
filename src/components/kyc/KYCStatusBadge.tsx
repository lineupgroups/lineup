import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { KYCStatus } from '../../types/kyc';

interface KYCStatusBadgeProps {
    status: KYCStatus;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function KYCStatusBadge({
    status,
    className = '',
    showLabel = true,
    size = 'md'
}: KYCStatusBadgeProps) {
    const getStatusConfig = (status: KYCStatus) => {
        switch (status) {
            case 'not_started':
                return {
                    icon: HelpCircle,
                    label: 'Not Started',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    iconColor: 'text-gray-500',
                    borderColor: 'border-gray-200',
                };
            case 'submitted':
                return {
                    icon: Clock,
                    label: 'Pending Review',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    iconColor: 'text-yellow-600',
                    borderColor: 'border-yellow-200',
                };
            case 'under_review':
                return {
                    icon: AlertCircle,
                    label: 'Under Review',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800',
                    iconColor: 'text-blue-600',
                    borderColor: 'border-blue-200',
                };
            case 'approved':
                return {
                    icon: CheckCircle,
                    label: 'Approved',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    iconColor: 'text-green-600',
                    borderColor: 'border-green-200',
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    label: 'Rejected',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    iconColor: 'text-red-600',
                    borderColor: 'border-red-200',
                };
            default:
                return {
                    icon: HelpCircle,
                    label: 'Unknown',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    iconColor: 'text-gray-500',
                    borderColor: 'border-gray-200',
                };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1 text-xs',
            icon: 'w-3 h-3',
            gap: 'gap-1',
        },
        md: {
            container: 'px-3 py-1.5 text-sm',
            icon: 'w-4 h-4',
            gap: 'gap-1.5',
        },
        lg: {
            container: 'px-4 py-2 text-base',
            icon: 'w-5 h-5',
            gap: 'gap-2',
        },
    };

    return (
        <div
            className={`
        inline-flex items-center
        ${sizeClasses[size].container}
        ${sizeClasses[size].gap}
        ${config.bgColor}
        ${config.textColor}
        border ${config.borderColor}
        rounded-full
        font-medium
        ${className}
      `}
            title={config.label}
        >
            <Icon className={`${sizeClasses[size].icon} ${config.iconColor}`} />
            {showLabel && <span>{config.label}</span>}
        </div>
    );
}

/**
 * Status badge with more details - for status pages
 */
export function DetailedKYCStatusBadge({
    status,
    submittedAt,
    reviewedAt,
    rejectionReason
}: {
    status: KYCStatus;
    submittedAt?: Date;
    reviewedAt?: Date;
    rejectionReason?: string;
}) {
    const getStatusConfig = (status: KYCStatus) => {
        switch (status) {
            case 'not_started':
                return {
                    icon: HelpCircle,
                    title: 'KYC Not Started',
                    description: 'Complete your KYC verification to become a creator',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    iconColor: 'text-gray-500',
                    titleColor: 'text-gray-900',
                };
            case 'submitted':
            case 'under_review':
                return {
                    icon: Clock,
                    title: 'KYC Under Review',
                    description: submittedAt
                        ? `Submitted on ${submittedAt.toLocaleDateString()}`
                        : 'Your documents are being reviewed by our team',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-yellow-900',
                };
            case 'approved':
                return {
                    icon: CheckCircle,
                    title: 'KYC Approved',
                    description: reviewedAt
                        ? `Approved on ${reviewedAt.toLocaleDateString()}`
                        : 'Your account is verified. You can now create projects!',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-900',
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    title: 'KYC Rejected',
                    description: rejectionReason || 'Your documents were rejected. Please resubmit with correct information.',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-900',
                };
            default:
                return {
                    icon: HelpCircle,
                    title: 'Unknown Status',
                    description: 'Please contact support',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    iconColor: 'text-gray-500',
                    titleColor: 'text-gray-900',
                };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <div className={`p-4 rounded-lg border-2 ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-white ${config.iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className={`font-semibold ${config.titleColor} mb-1`}>
                        {config.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {config.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
