import { useState, useRef, KeyboardEvent } from 'react';
import { X, Tag } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Ej: viaje, cumple, mudanza...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      inputValue.length > 0 &&
      !tags.includes(s)
  );

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || tags.includes(normalized)) return;
    onChange([...tags, normalized]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Campo de entrada con chips */}
      <div
        className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all cursor-text min-h-[44px] items-center"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Chips de tags existentes */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          >
            <Tag className="w-2.5 h-2.5" />
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 hover:text-indigo-900 transition-colors cursor-pointer"
              aria-label={`Quitar etiqueta ${tag}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {/* Input invisible */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-[13px] text-slate-700 outline-none bg-transparent placeholder-slate-300"
        />
      </div>

      {/* Sugerencias */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Tag className="w-2.5 h-2.5" />
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-400 px-0.5">
        Presioná Enter o coma para agregar. Backspace para eliminar.
      </p>
    </div>
  );
}

