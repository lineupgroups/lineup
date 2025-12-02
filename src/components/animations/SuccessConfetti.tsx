import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface SuccessConfettiProps {
    show: boolean;
    duration?: number;
    onComplete?: () => void;
}

export default function SuccessConfetti({
    show,
    duration = 5000,
    onComplete
}: SuccessConfettiProps) {
    const { width, height } = useWindowSize();
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (show) {
            setIsActive(true);
            const timer = setTimeout(() => {
                setIsActive(false);
                if (onComplete) {
                    onComplete();
                }
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onComplete]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.3}
                colors={['#f97316', '#ea580c', '#dc2626', '#fb923c', '#fdba74']}
            />
        </div>
    );
}
