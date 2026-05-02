import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Link2, List, ListOrdered, Quote, Smile } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
    rows?: number;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Enter text...',
    maxLength = 5000,
    disabled = false,
    rows = 8
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Common emojis for quick access
    const commonEmojis = [
        '😀', '😊', '🎉', '🚀', '💪', '🙏', '❤️', '👍', '✨', '🔥',
        '🎯', '💡', '📈', '🏆', '👏', '🤝', '💯', '⭐', '🎊', '📢'
    ];

    // Initialize editor with HTML content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            const htmlContent = editorRef.current.innerHTML;
            const textContent = editorRef.current.textContent || '';

            if (textContent.length <= maxLength) {
                onChange(htmlContent);
            } else {
                // Prevent exceeding max length
                editorRef.current.textContent = textContent.substring(0, maxLength);
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput(); // Update parent component
    };

    const handleBold = () => {
        execCommand('bold');
    };

    const handleItalic = () => {
        execCommand('italic');
    };

    const handleLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const handleBulletList = () => {
        execCommand('insertUnorderedList');
    };

    const handleNumberedList = () => {
        execCommand('insertOrderedList');
    };

    // Quote formatting
    const handleQuote = () => {
        // Get current selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString();
            if (selectedText) {
                // Wrap selected text in blockquote
                document.execCommand('formatBlock', false, 'blockquote');
            } else {
                // Insert new blockquote
                const blockquote = document.createElement('blockquote');
                blockquote.innerHTML = 'Quote text here...';
                document.execCommand('insertHTML', false, blockquote.outerHTML);
            }
            editorRef.current?.focus();
            handleInput();
        }
    };

    // Insert emoji
    const handleEmoji = (emoji: string) => {
        document.execCommand('insertText', false, emoji);
        editorRef.current?.focus();
        handleInput();
        setShowEmojiPicker(false);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const getCharacterCount = (): number => {
        return editorRef.current?.textContent?.length || 0;
    };

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className={`flex items-center space-x-1 p-2 border border-neutral-800 border-b-0 rounded-t-[1.2rem] bg-neutral-900/50 transition-colors ${isFocused ? 'border-brand-acid bg-brand-acid/5' : ''
                }`}>
                <button
                    type="button"
                    onClick={handleBold}
                    className="p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50"
                    title="Bold (Ctrl+B)"
                    disabled={disabled}
                >
                    <Bold className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                    type="button"
                    onClick={handleItalic}
                    className="p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50"
                    title="Italic (Ctrl+I)"
                    disabled={disabled}
                >
                    <Italic className="w-4 h-4 text-neutral-400" />
                </button>
                <div className="w-px h-6 bg-neutral-800 mx-1" />
                <button
                    type="button"
                    onClick={handleLink}
                    className="p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50"
                    title="Insert Link (Ctrl+K)"
                    disabled={disabled}
                >
                    <Link2 className="w-4 h-4 text-neutral-400" />
                </button>
                <div className="w-px h-6 bg-neutral-800 mx-1" />
                <button
                    type="button"
                    onClick={handleBulletList}
                    className="p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50"
                    title="Bullet List"
                    disabled={disabled}
                >
                    <List className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                    type="button"
                    onClick={handleNumberedList}
                    className="p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50"
                    title="Numbered List"
                    disabled={disabled}
                >
                    <ListOrdered className="w-4 h-4 text-neutral-400" />
                </button>
                <div className="w-px h-6 bg-neutral-800 mx-1" />
                {/* Quote Button */}
                <button
                    type="button"
                    onClick={handleQuote}
                    className="p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50"
                    title="Quote"
                    disabled={disabled}
                >
                    <Quote className="w-4 h-4 text-neutral-400" />
                </button>
                {/* Emoji Picker */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 hover:bg-[#111] hover:text-brand-white rounded transition-colors disabled:opacity-50 ${showEmojiPicker ? 'bg-[#111] text-brand-white' : ''}`}
                        title="Insert Emoji"
                        disabled={disabled}
                    >
                        <Smile className="w-4 h-4 text-neutral-400" />
                    </button>
                    {showEmojiPicker && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            <div className="absolute left-0 top-full mt-2 w-64 bg-[#111] rounded-2xl shadow-xl border border-neutral-800 p-3 z-20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Click to insert emoji</p>
                                <div className="grid grid-cols-10 gap-1">
                                    {commonEmojis.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleEmoji(emoji)}
                                            className="text-lg hover:bg-neutral-800 rounded p-1 transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex-1" />
                {/* Phase 2: Color-coded character counter */}
                <span className={`text-xs font-medium ${getCharacterCount() > maxLength * 0.95
                    ? 'text-red-600'
                    : getCharacterCount() > maxLength * 0.80
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                    {getCharacterCount()}/{maxLength}
                </span>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onPaste={handlePaste}
                className={`w-full px-5 py-4 border border-neutral-800 rounded-b-[1.2rem] focus:outline-none transition-colors prose prose-sm prose-invert max-w-none ${isFocused ? 'ring-2 ring-brand-acid border-brand-acid text-brand-white' : 'text-brand-white'
                    } ${disabled ? 'bg-neutral-900 cursor-not-allowed' : 'bg-brand-black'}`}
                style={{
                    minHeight: `${rows * 1.5}rem`,
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}
                data-placeholder={placeholder}
            />

            <style>{`
        [contentEditable] {
          outline: none;
          position: relative;
        }
        
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        [contentEditable] strong {
          font-weight: 700;
        }
        
        [contentEditable] em {
          font-style: italic;
        }
        
        [contentEditable] a {
          color: #f97316;
          text-decoration: underline;
        }
        
        [contentEditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        [contentEditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        [contentEditable] li {
          margin: 0.25rem 0;
        }
        
        [contentEditable] blockquote {
          border-left: 4px solid #ccff00;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #a3a3a3;
          font-style: italic;
          background-color: #111;
          padding: 0.5rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}</style>
        </div>
    );
}
