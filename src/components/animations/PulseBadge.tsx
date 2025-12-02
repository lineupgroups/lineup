import { Check } from 'lucide-react';

interface PulseBadgeProps {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'success' | 'warning' | 'info' | 'primary';
    pulse?: boolean;
}

export default function PulseBadge({
    children,
    icon,
    variant = 'success',
    pulse = true
}: PulseBadgeProps) {
    const variantStyles = {
        success: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200',
        primary: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const pulseStyles = {
        success: 'animate-pulse-green',
        warning: 'animate-pulse-yellow',
        info: 'animate-pulse-blue',
        primary: 'animate-pulse-orange'
    };

    return (
        <div className="relative inline-flex">
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${variantStyles[variant]} ${pulse ? pulseStyles[variant] : ''
                    }`}
            >
                {icon || <Check className="w-4 h-4" />}
                {children}
            </span>
            {pulse && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variant === 'success' ? 'bg-green-400' :
                            variant === 'warning' ? 'bg-yellow-400' :
                                variant === 'info' ? 'bg-blue-400' :
                                    'bg-orange-400'
                        }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${variant === 'success' ? 'bg-green-500' :
                            variant === 'warning' ? 'bg-yellow-500' :
                                variant === 'info' ? 'bg-blue-500' :
                                    'bg-orange-500'
                        }`}></span>
                </span>
            )}

            <style>{`
                @keyframes pulse-green {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
                    }
                }
                @keyframes pulse-yellow {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(234, 179, 8, 0);
                    }
                }
                @keyframes pulse-blue {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
                    }
                }
                @keyframes pulse-orange {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
                    }
                }
                .animate-pulse-green {
                    animation: pulse-green 2s ease-in-out infinite;
                }
                .animate-pulse-yellow {
                    animation: pulse-yellow 2s ease-in-out infinite;
                }
                .animate-pulse-blue {
                    animation: pulse-blue 2s ease-in-out infinite;
                }
                .animate-pulse-orange {
                    animation: pulse-orange 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
