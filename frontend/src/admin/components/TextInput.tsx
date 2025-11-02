import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  setValue?: (v: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  placeholder = "Message NOVA 1000™",
  disabled = false,
  value: controlledValue,
  setValue: setControlledValue
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const setValue = setControlledValue || setUncontrolledValue;
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
      adjustHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={`relative bg-slate-800/60 rounded-2xl border transition-all duration-200 ${
          isFocused ? "border-slate-600/60" : "border-slate-700/60"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent text-white placeholder-gray-400 px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 resize-none outline-none scrollbar-hide text-sm md:text-base"
          style={{ minHeight: "40px" }}
        />

        {/* Send Button - Always on the right */}
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`absolute right-2 md:right-3 bottom-1 md:bottom-2 p-1 md:p-2 rounded-xl transition-all duration-200 ${
            value.trim() && !disabled
              ? "text-gray-400 hover:text-white cursor-pointer"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Send message (Enter)"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>
      </div>
    </form>
  );
};