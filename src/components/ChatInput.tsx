import React, { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  LightBulbIcon, 
  PaperClipIcon, 
  PaperAirplaneIcon,
  MagnifyingGlassCircleIcon,
} from '@heroicons/react/24/outline';


interface ChatInputProps {
  onSend: (message: string) => void;
  enableSearch?: boolean;
  enableReasoning?: boolean;
  onImageUpload: (file: File) => void;
  onToggleSearch?: (enabled: boolean) => void;
  onToggleReasoning?: (enabled: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  enableSearch = false, 
  enableReasoning = false, 
  onImageUpload,
  onToggleSearch,
  onToggleReasoning
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Xử lý phím tắt
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          wrapSelection('**', '**');
          break;
        case 'i':
          e.preventDefault();
          wrapSelection('*', '*');
          break;
        case 'u':
          e.preventDefault();
          wrapSelection('__', '__');
          break;
        case 'enter':
          e.preventDefault();
          handleSend();
          break;
      }
    }
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const newText = 
      textarea.value.substring(0, start) +
      prefix + selectedText + suffix +
      textarea.value.substring(end);

    setMessage(newText);
    
    // Đặt lại vị trí con trỏ
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
      textarea.focus();
    }, 0);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <div className="flex flex-col w-full h-full gap-2 relative">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn..."
        className="w-full p-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border border-gray-300"
        style={{ minHeight: '150px', paddingRight: '4.5rem' }}
      />
      
      {/* Floating buttons */}
      <div className="absolute bottom-3 right-3 flex space-x-2">
        <div className="relative">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label
            htmlFor="image-upload"
            title="Tải ảnh lên"
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors focus:outline-none focus:ring-2 bg-blue-100 text-blue-600 cursor-pointer hover:bg-blue-200"
          >
            <PaperClipIcon className="h-5 w-5" />
          </label>
        </div>
        <button
          onClick={handleSend}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors focus:outline-none focus:ring-2 bg-blue-600 text-white hover:bg-blue-700"
          title="Gửi tin nhắn"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Rest of the controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            disabled
            onClick={() => onToggleSearch?.(!enableSearch)}
            className={`flex items-center space-x-1 text-sm rounded-md transition-colors ${
              enableSearch
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {enableSearch ? (
              <MagnifyingGlassCircleIcon className="h-4 w-4" />
            ) : (
              <MagnifyingGlassIcon className="h-4 w-4" />
            )}
            <span>Tìm kiếm</span>
          </button>
          <button
            onClick={() => onToggleReasoning?.(!enableReasoning)}
            className={`flex items-center space-x-1 text-sm rounded-md transition-colors ${
              enableReasoning
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LightBulbIcon className={`h-4 w-4 ${enableReasoning ? 'text-green-600' : 'text-gray-600'}`} />
            <span>Suy luận</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 