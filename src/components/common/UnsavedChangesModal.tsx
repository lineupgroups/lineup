import { AlertTriangle, X, Save, Trash2 } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDiscard: () => void;
    onSave?: () => void;
    showSaveOption?: boolean;
}

export default function UnsavedChangesModal({
    isOpen,
    onClose,
    onDiscard,
    onSave,
    showSaveOption = true
}: UnsavedChangesModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-[#111] border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b border-neutral-800 bg-[#111]/50">
                    <div className="p-3 rounded-2xl bg-brand-orange/10 border border-brand-orange/20">
                        <AlertTriangle className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="flex-1 mt-1">
                        <h3 className="text-lg font-black italic uppercase tracking-wider text-brand-white">Unsaved Changes</h3>
                        <p className="text-sm font-medium text-neutral-400 mt-1">
                            You have unsaved changes. What would you like to do?
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/5"
                    >
                        <X className="w-5 h-5 text-neutral-500 hover:text-brand-white" />
                    </button>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    {showSaveOption && onSave && (
                        <button
                            onClick={onSave}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-[10px] font-black italic uppercase tracking-widest text-brand-black bg-brand-acid rounded-2xl hover:bg-[#b3e600] transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save as Draft
                        </button>
                    )}

                    <button
                        onClick={onDiscard}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 text-[10px] font-black italic uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Discard Changes
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full px-6 py-4 text-[10px] font-black italic uppercase tracking-widest text-brand-white bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition-colors"
                    >
                        Continue Editing
                    </button>
                </div>
            </div>
        </div>
    );
}
