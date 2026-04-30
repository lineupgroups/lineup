import logoImage from '../../assets/logo.png';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    tagline?: string;
    textColor?: string;
    taglineColor?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
};

const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
};

const taglineSizeClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-sm',
};

export default function Logo({
    size = 'md',
    showText = true,
    tagline = 'For the Idea Nation™',
    textColor = 'text-brand-white',
    taglineColor = 'text-brand-orange',
    className = '',
}: LogoProps) {
    return (
        <div className={`flex items-center space-x-2.5 ${className}`}>
            {/* Logo Image */}
            <div className={`${sizeClasses[size]} rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900`}>
                <img
                    src={logoImage}
                    alt="Lineup Logo"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Text */}
            {showText && (
                <div className="flex flex-col -space-y-1">
                    <h1 className={`${textSizeClasses[size]} font-black tracking-tighter ${textColor} italic`}>
                        LINEUP
                    </h1>
                    {tagline && (
                        <p className={`${taglineSizeClasses[size]} ${taglineColor} font-bold uppercase tracking-[0.15em] opacity-90`}>
                            {tagline}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// Logo only version (icon only, no text)
export function LogoIcon({
    size = 'md',
    className = ''
}: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}) {
    return (
        <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 ${className}`}>
            <img
                src={logoImage}
                alt="Lineup Logo"
                className="w-full h-full object-cover"
            />
        </div>
    );
}

// For footer/dark backgrounds
export function LogoDark({
    size = 'md',
    showText = true,
    tagline = 'For the Idea Nation™',
    className = '',
}: Omit<LogoProps, 'textColor' | 'taglineColor'>) {
    return (
        <Logo
            size={size}
            showText={showText}
            tagline={tagline}
            textColor="text-white"
            taglineColor="text-orange-400"
            className={className}
        />
    );
}
