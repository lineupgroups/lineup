import React, { useState } from 'react';
import { ChevronDown, Users, Rocket, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserMode } from '../../types/auth';

interface RoleSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export default function RoleSwitcher({ className = '', showLabel = true }: RoleSwitcherProps) {
  const { currentMode, switchMode, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ CRITICAL: Only show role switcher if user is KYC verified
  // This prevents non-verified users from accessing creator mode
  if (!user?.isCreatorVerified) {
    return null;
  }

  const handleModeSwitch = async (mode: UserMode) => {
    if (mode === currentMode) return;

    setIsLoading(true);
    try {
      await switchMode(mode);
      setIsOpen(false);

      // Navigate to appropriate page based on mode
      if (mode === 'creator') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to switch mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modes = [
    {
      id: 'supporter' as UserMode,
      label: 'Supporter',
      description: 'Discover & support projects',
      icon: Users,
      color: 'text-brand-acid',
      bgColor: 'bg-brand-acid/10',
      borderColor: 'border-brand-acid/20',
      hoverColor: 'hover:bg-brand-acid/20'
    },
    {
      id: 'creator' as UserMode,
      label: 'Creator',
      description: 'Create & manage projects',
      icon: Rocket,
      color: 'text-brand-orange',
      bgColor: 'bg-brand-orange/10',
      borderColor: 'border-brand-orange/20',
      hoverColor: 'hover:bg-brand-orange/20'
    }
  ];

  const currentModeConfig = modes.find(mode => mode.id === currentMode);
  const CurrentIcon = currentModeConfig?.icon || Users;

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`group flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-300 ${currentMode === 'supporter'
          ? 'border-neutral-800 bg-neutral-900/50 text-brand-acid hover:border-brand-acid/30 hover:bg-neutral-900'
          : 'border-neutral-800 bg-neutral-900/50 text-brand-orange hover:border-brand-orange/30 hover:bg-neutral-900'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`p-1 rounded-lg ${currentMode === 'supporter' ? 'bg-brand-acid/10' : 'bg-brand-orange/10'}`}>
          <CurrentIcon className="w-3.5 h-3.5" />
        </div>
        {showLabel && (
          <>
            <span className="text-xs font-bold uppercase tracking-widest">{currentModeConfig?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-300 group-hover:text-neutral-300 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-72 bg-brand-black border border-neutral-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/30">
              <div className="flex items-center space-x-2 text-neutral-400">
                <Zap className="w-3.5 h-3.5 text-brand-acid" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Switch Workspace</span>
              </div>
            </div>

            <div className="p-2 space-y-1">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.id === currentMode;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSwitch(mode.id)}
                    disabled={isLoading || isActive}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${isActive
                      ? `${mode.bgColor} ${mode.color} border ${mode.borderColor} cursor-default`
                      : `hover:bg-neutral-900 text-neutral-400 hover:text-brand-white`
                      } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? mode.bgColor : 'bg-neutral-800'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? mode.color : 'text-neutral-500'}`} />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold tracking-tight">{mode.label}</span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 font-medium leading-tight mt-0.5">{mode.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-neutral-900/50 border-t border-neutral-800">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-brand-acid animate-pulse" />
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  Real-time sync enabled
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
