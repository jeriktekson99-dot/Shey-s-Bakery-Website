import React, { useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Link2, 
  Quote 
} from 'lucide-react';

interface RichTextDescriptionEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const RichTextDescriptionEditor: React.FC<RichTextDescriptionEditorProps> = ({
  value,
  onChange,
  placeholder = 'Describe the flavor profile, crust texture, butter grade, and baking notes...'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 10);
  };

  const applyListFormatting = (isOrdered: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formatted = '';
    if (selectedText.length > 0) {
      const lines = selectedText.split('\n');
      formatted = lines
        .map((line, idx) => (isOrdered ? `${idx + 1}. ${line}` : `• ${line}`))
        .join('\n');
    } else {
      formatted = isOrdered ? '\n1. First step\n2. Second step' : '\n• Tasting note 1\n• Tasting note 2';
    }

    const newValue = value.substring(0, start) + formatted + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
    }, 10);
  };

  const applyLink = () => {
    const url = prompt('Enter link URL (e.g. https://...):');
    if (url) {
      applyFormatting('[', `](${url})`);
    }
  };

  return (
    <div className="rounded-xl border border-stone-300 overflow-hidden bg-white shadow-xs focus-within:border-[#4a170a] focus-within:ring-1 focus-within:ring-[#4a170a] transition-all">
      {/* Rich Text Toolbar - Artisan Bakery Warm Theme */}
      <div className="bg-[#38150c] px-3 py-2 flex flex-wrap items-center gap-1.5 border-b border-[#4d1f12] text-amber-100 select-none">
        <button
          type="button"
          onClick={() => applyFormatting('**', '**')}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs font-bold transition-colors"
          title="Bold"
        >
          <span className="font-serif font-black px-1">B</span>
        </button>

        <button
          type="button"
          onClick={() => applyFormatting('<u>', '</u>')}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs underline font-bold transition-colors"
          title="Underline"
        >
          <span className="font-serif px-1 underline">U</span>
        </button>

        <button
          type="button"
          onClick={() => applyFormatting('*', '*')}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs italic font-bold transition-colors"
          title="Italic"
        >
          <span className="font-serif italic px-1">I</span>
        </button>

        <div className="h-4 w-[1px] bg-amber-900/60 mx-1" />

        <button
          type="button"
          onClick={() => applyFormatting('## ')}
          className="px-2 py-1 hover:text-amber-200 hover:bg-black/25 rounded text-xs font-bold transition-colors text-amber-300 font-serif"
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => applyFormatting('### ')}
          className="px-2 py-1 hover:text-amber-200 hover:bg-black/25 rounded text-xs font-bold transition-colors text-amber-400 font-serif"
          title="Heading 3"
        >
          H3
        </button>

        <div className="h-4 w-[1px] bg-amber-900/60 mx-1" />

        <button
          type="button"
          onClick={() => applyListFormatting(false)}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs transition-colors"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => applyListFormatting(true)}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-amber-900/60 mx-1" />

        <button
          type="button"
          onClick={applyLink}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs transition-colors"
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => applyFormatting('> ')}
          className="p-1.5 hover:text-white hover:bg-black/25 rounded text-xs transition-colors"
          title="Quote Block"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <textarea
        ref={textareaRef}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3.5 text-sm font-sans text-[#4a170a] focus:outline-none placeholder:text-stone-400 resize-y leading-relaxed bg-[#fffdfa]"
      />
    </div>
  );
};
