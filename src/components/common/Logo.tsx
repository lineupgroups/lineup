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
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
};

const taglineSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
};

export default function Logo({
    size = 'md',
    showText = true,
    tagline = 'For the Idea Nation™',
    textColor = 'text-gray-900',
    taglineColor = 'text-orange-600',
    className = '',
}: LogoProps) {
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            {/* Logo Image */}
            <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0`}>
                <img
                    src={logoImage}
                    alt="Lineup Logo"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Text */}
            {showText && (
                <div>
                    <h1 className={`${textSizeClasses[size]} font-bold ${textColor}`}>Lineup</h1>
                    {tagline && (
                        <p className={`${taglineSizeClasses[size]} ${taglineColor} font-medium`}>
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
