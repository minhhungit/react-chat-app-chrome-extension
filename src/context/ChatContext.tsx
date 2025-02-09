import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ChatCompletionMessageParam } from "openai/resources/chat";
import {
  SYSTEM_PROMPT_NEW_CHAT,
  INSTRUCTION_NEW_CHAT
} from "../constants/prompt";
import { ChatConfig } from '@/settings/SettingsPage';
import { chatStore } from "../stores/ChatStore";
import { NEW_CHAT_CONTEXT_MENU_ID } from '@/constants/constants';
import { ApiHelper } from '@/utils/ApiHelper';

export interface Message {
  menuItemId: string;
  id: string;
  content: string;
  reasoningMessage: string;
  timestamp: number;
  pending?: boolean;
  role?: 'user' | 'assistant';
  isError?: boolean;
}

interface ChatContextType {
  addMessage: (content: string, reasoningMessage: string, isAi: boolean, isError?: boolean) => Promise<void>;
  editMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  regenerateResponse: (id: string) => Promise<void>;
  chatApiConfig: ChatConfig;
  setChatApiConfig: (config: ChatConfig) => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const MAX_HISTORY = 10; // Giới hạn lịch sử

type Role = 'system' | 'user' | 'assistant';

const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatApiConfig, setChatApiConfig] = useState<ChatConfig>({
    apiUrl: "",
    apiKey: "",
    provider: "OpenAI",
    model: "",
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    modelList: ["gpt-4o"]
  });
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const fetchProviders = async () => {
  //     const result = await db.get('providersConfig');
  //   };
  //   fetchProviders();
  // }, []);

  const createReasoning = async (messageId: string, history: ChatCompletionMessageParam[]) => {
    let thinkingContent = '';
    
    try {
      const result = await ApiHelper.createReasoning(history, (content) => {
        thinkingContent = content;
        chatStore.setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, reasoningMessage: thinkingContent, pending: false, isError: false }
            : msg
        ));
      });

      return result;
    } catch (error) {
      console.error('Lỗi khi tạo reasoning:', error);
      return '';
    }
  };

  const createAIResponse = async (menuItemId: string, content: string) => {
    setIsLoading(true);

    if (typeof content === 'undefined') {
      return;
    }

    const pendingMessage: Message = {
      menuItemId: menuItemId,
      id: Date.now().toString() + '-assistant',
      role: "assistant",
      content: "",
      reasoningMessage: "",
      timestamp: Date.now(),
      pending: true,
      isError: false
    };

    try {
      let systemPrompt = menuItemId === NEW_CHAT_CONTEXT_MENU_ID 
        ? SYSTEM_PROMPT_NEW_CHAT 
        : chatStore.currentFeature?.systemPrompt || "";

      chatStore.setMessages(prev => [...prev, pendingMessage]);

      let recentHistory: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...chatStore.messages.filter(x => !x.pending && !x.isError).slice(-MAX_HISTORY).map(msg => ({
          role: (msg.id.endsWith('-assistant') ? 'assistant' : 'user') as Role,
          content: msg.content
        }))
      ];

      if (chatStore.currentFeature?.enableReasoning) {
        const reasoningResult = await createReasoning(pendingMessage.id, recentHistory);
        if(reasoningResult.trim().length > 0){
          recentHistory.push({
            role: 'assistant',
            content: `Trước khi trả lời yêu cầu của bạn, tôi đã suy nghĩ và suy luận như sau:\n<think>${reasoningResult}</think>\n---Dựa vào suy luận trên, sau đây là câu trả lời của tôi:`
          });
        }        
      }

      await ApiHelper.chatComplete(recentHistory, (content) => {
        chatStore.setMessages(prev => prev.map(msg =>
          msg.id === pendingMessage.id
            ? { ...msg, content, pending: false }
            : msg
        ));
      });

    } catch (error: any) {
      addMessage(error?.message || "", "", true, true);
      chatStore.setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (content: string, reasoningMessage: string, isAi: boolean, isError?: boolean) => {
    chatStore.clearSuggestQuestions();
    console.log("menuItemId", chatStore.currentFeature.id);
    if (chatStore.currentFeature.id == NEW_CHAT_CONTEXT_MENU_ID) {
      console.log("new chat", content);

      if (typeof content == 'undefined' || content == null || content == '') {
        chatStore.setMessages(prev => []);
      } else {
        console.log("new chat", chatStore.messages);    
        const message: Message = {
          menuItemId: chatStore.currentFeature.id,
          id: Date.now().toString() + (isAi ? '-assistant' : '-user'),
          content: content || "",
          reasoningMessage: reasoningMessage || "",
          timestamp: Date.now(),
          pending: isAi,
          role: isAi ? 'assistant' : 'user',
          isError: isError
        };

        chatStore.setMessages(prev => [...prev, message]);

        console.log("new chat - after add", chatStore.messages);    

        if (!isAi) {
          if (chatStore.messages.length > 1) { // wait for user ask more question before create AI response
            await createAIResponse(chatStore.currentFeature.id, content);
          }
        }
      }
    }
    else {
      let decoratedContent = chatStore.messages.length == 0 ? `${chatStore.currentFeature?.instruction || ""}\n${content}` : content;
      console.log(decoratedContent);

      const message: Message = {
        menuItemId: chatStore.currentFeature.id,
        id: Date.now().toString() + (isAi ? '-assistant' : '-user'),
        content: decoratedContent,
        reasoningMessage,
        timestamp: Date.now(),
        pending: isAi,
        role: isAi ? 'assistant' : 'user',
        isError: isError
      };

      chatStore.setMessages(prev => [...prev, message]);

      if (!isAi) {
        await createAIResponse(chatStore.currentFeature.id, content);
      }
    }

    // Tạo câu hỏi gợi ý
    if (typeof content !== 'undefined' && content.length > 0 && chatStore.messages.filter(x=>x.id.endsWith('assistant') && !x.pending && !x.isError).length > 0) {
      await generateSuggestQuestions(content);
    }
  };

  const editMessage = (id: string, content: string) => {
    chatStore.setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, content } : msg))
    );
  };

  const deleteMessage = (id: string) => {
    chatStore.setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const regenerateResponse = async (messageId: string) => {
    try {
      const cloneMessages = [...chatStore.messages];

      // Xóa các message lỗi
      chatStore.setMessages(prev => prev.filter(msg => !msg.isError));

      let messageIndex = cloneMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        console.error('Message not found');
        return;
      }

      // Lùi lại chỉ số messageIndex để tìm message của người dùng
      // Bỏ qua duy nhất message cuối cùng của AI (có id kết thúc bằng 'assistant') 
      // nếu có nhiều assistant message liên tiếp thì cũng chỉ loại bỏ message cuối cùng
      while (messageIndex >= 0 && cloneMessages[messageIndex].id.endsWith('assistant')) {
        messageIndex--;
      }

      // Nếu không có bất kỳ message thì dừng lại
      if (messageIndex < 0) {
        return;
      }

      // Tạo danh sách message mới
      const newMessages = cloneMessages.slice(0, messageIndex + 1);
      await chatStore.setMessages(prev => newMessages);

      // Tạo lại phản hồi AI
      const lastMessage = newMessages[messageIndex];
      await createAIResponse(lastMessage.menuItemId, lastMessage.content);
    } catch (error: any) {
      addMessage(error.message, "", true, true);
      console.error('Error regenerating response:', error);
    }
  };

  const generateSuggestQuestions = async (content: string) => {
    const questions = await ApiHelper.generateSuggestQuestions(content);
    if (questions.length > 0) {
      chatStore.setSuggestQuestions(questions);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        editMessage,
        deleteMessage,
        regenerateResponse,
        chatApiConfig,
        setChatApiConfig,
        isLoading        
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export { ChatProvider, useChat }; 