import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useChat } from "../context/ChatContext";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  id: string;
  message: string;
  reasoningMessage: string;
  pending?: boolean;
  isError?: boolean;
}

const renderMarkdown = (content: string) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            style={vscDarkPlus as any}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    }}
  >
    {content}
  </ReactMarkdown>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ id, message, reasoningMessage, pending, isError }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message);

  const { editMessage, isLoading, regenerateResponse } = useChat();
  const [isOpen, setIsOpen] = useState(true);

  // Thêm logic kiểm tra ID
  // const isUserMessage = id.endsWith('-user');
  const isAiMessage = id.endsWith('-assistant');

  // const handleSave = () => {
  //   editMessage(id, editContent);
  //   setIsEditing(false);
  // };

  // const handleCancel = () => {
  //   setEditContent(message);
  //   setIsEditing(false);
  // };

  const renderContent = (content: string) => {
    // const thinkingMatch = content.match(/<thinking>(.*?)<\/thinking>/);
    // const answerMatch = content.match(/<answer>(.*?)<\/answer>/);

    return (
      <div className="space-y-2">
        {reasoningMessage && (
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="space-y-2"
          >
            <div className="flex items-center justify-left">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full p-0 justify-start">
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="text-sm text-gray-600">Thinking Process</span>
                  </div>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="p-2 rounded-lg max-h-48 overflow-y-auto text-gray-700">
                {renderMarkdown(reasoningMessage)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        {message && (
          <div
            className={cn(
              "prose p-2 rounded-lg mt-2 text-base",
              isAiMessage ? "bg-muted" : "ml-auto",
              isError && "bg-destructive text-destructive-foreground"
            )}
            style={{ maxWidth: '100%' }}
          >
            {renderMarkdown(message)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${isAiMessage ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] p-2 rounded-lg ${
        isAiMessage ? 'bg-blue-100' : 'bg-green-100'
      }`}>
        {renderContent(message)}
        {isAiMessage && pending && isLoading && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-gray-900"></div>
            <span>Đang xử lý...</span>
          </div>
        )}
        {!pending && !isLoading && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await regenerateResponse(id);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo lại...' : 'Tạo lại'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 