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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b border-yellow-200 bg-yellow-50">
                    <div className="p-3 rounded-full bg-yellow-100">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            You have unsaved changes. What would you like to do?
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 space-y-3">
                    {showSaveOption && onSave && (
                        <button
                            onClick={onSave}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save as Draft
                        </button>
                    )}

                    <button
                        onClick={onDiscard}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Discard Changes
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Continue Editing
                    </button>
                </div>
            </div>
        </div>
    );
}
