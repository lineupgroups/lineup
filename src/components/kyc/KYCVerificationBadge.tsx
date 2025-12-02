import { CheckCircle, Shield } from 'lucide-react';
import { KYCStatus } from '../../types/kyc';

interface KYCVerificationBadgeProps {
    status?: KYCStatus;
    isCreatorVerified?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export default function KYCVerificationBadge({
    status,
    isCreatorVerified,
    size = 'md',
    showLabel = false,
    className = ''
}: KYCVerificationBadgeProps) {
    // Only show if creator is verified
    if (!isCreatorVerified || status !== 'approved') {
        return null;
    }

    const sizeClasses = {
        sm: {
            container: 'px-1.5 py-0.5 text-xs',
            icon: 'w-3 h-3',
            gap: 'gap-1',
        },
        md: {
            container: 'px-2 py-1 text-sm',
            icon: 'w-4 h-4',
            gap: 'gap-1.5',
        },
        lg: {
            container: 'px-3 py-1.5 text-base',
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
        bg-gradient-to-r from-green-500 to-emerald-500
        text-white
        rounded-full
        font-semibold
        shadow-sm
        ${className}
      `}
            title="KYC Verified Creator"
        >
            <CheckCircle className={`${sizeClasses[size].icon}`} />
            {showLabel && <span>KYC Verified</span>}
        </div>
    );
}

/**
 * Alternative shield-style badge
 */
export function KYCShieldBadge({
    size = 'md',
    className = ''
}: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            title="KYC Verified"
        >
            <Shield className={`${sizeClasses[size]} text-green-600 fill-green-100`} />
            <CheckCircle className={`absolute ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />
        </div>
    );
}

/**
 * Tooltip-style badge for profiles
 */
export function KYCProfileBadge({
    className = ''
}: {
    className?: string;
}) {
    return (
        <div className={`group relative inline-flex ${className}`}>
            {/* Badge Icon */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-300">
                <CheckCircle className="w-3 h-3" />
                <span>KYC Verified</span>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                KYC Verified Creator
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
            </div>
        </div>
    );
}
