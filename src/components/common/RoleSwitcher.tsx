import React, { useState } from 'react';
import { ChevronDown, Users, Rocket, Zap, Activity } from 'lucide-react';
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
  if (!user?.isCreatorVerified) {
    return null;
  }

  const handleModeSwitch = async (mode: UserMode) => {
    if (mode === currentMode) return;

    setIsLoading(true);
    try {
      await switchMode(mode);
      setIsOpen(false);

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
      label: 'SUPPORTER',
      description: 'DISCOVER & SUPPORT ELITE DEPLOYMENTS',
      icon: Users,
      color: 'text-brand-acid',
      bgColor: 'bg-brand-acid/10',
      borderColor: 'border-brand-acid/20',
      hoverColor: 'hover:bg-brand-acid/20'
    },
    {
      id: 'creator' as UserMode,
      label: 'CREATOR',
      description: 'DEPLOY & MANAGE PROJECT PROTOCOLS',
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
        className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500 bg-white/5 backdrop-blur-2xl ${currentMode === 'supporter'
          ? 'border-brand-acid/20 text-brand-acid hover:border-brand-acid/50'
          : 'border-brand-orange/20 text-brand-orange hover:border-brand-orange/50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95 shadow-2xl'}`}
      >
        <div className={`p-1.5 rounded-lg transition-transform duration-500 group-hover:scale-110 ${currentMode === 'supporter' ? 'bg-brand-acid/10' : 'bg-brand-orange/10'}`}>
          <CurrentIcon className="w-3.5 h-3.5" />
        </div>
        {showLabel && (
          <>
            <span className="text-[10px] font-black italic uppercase tracking-[0.2em]">{currentModeConfig?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-500 group-hover:text-neutral-400 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 bg-brand-black/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-20 overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-neutral-500">
                <Zap className="w-4 h-4 text-brand-acid" />
                <span className="text-[9px] font-black italic uppercase tracking-[0.3em]">SWITCH PROTOCOL WORKSPACE</span>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.id === currentMode;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSwitch(mode.id)}
                    disabled={isLoading || isActive}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 group/item ${isActive
                      ? `${mode.bgColor} ${mode.color} border ${mode.borderColor} cursor-default`
                      : `hover:bg-white/5 text-neutral-500 hover:text-brand-white`
                      } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    <div className={`p-3 rounded-xl transition-all duration-500 ${isActive ? mode.bgColor : 'bg-white/5 group-hover/item:bg-white/10'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? mode.color : 'text-neutral-700 group-hover/item:text-brand-white'}`} />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black italic uppercase tracking-widest">{mode.label}</span>
                        {isActive && (
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider mt-1 group-hover/item:text-neutral-400 transition-colors">{mode.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-5 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-acid animate-ping" />
                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">
                  REAL-TIME NODE SYNC ACTIVE
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
