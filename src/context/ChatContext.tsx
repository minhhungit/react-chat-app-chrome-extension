import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ChatCompletionMessageParam } from "openai/resources/chat";
import {
  SYSTEM_PROMPT_NEW_CHAT,
  INSTRUCTION_NEW_CHAT
} from "../constants/prompt";
import { OpenAI } from "openai";
import { ChatConfig } from '@/window/SettingsPage';
import { chatStore } from "../stores/ChatStore";
import { NEW_CHAT_CONTEXT_MENU_ID } from '@/constants/constants';

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
  addMessage: (menuItemId: string, content: string, reasoningMessage: string, isAi: boolean, isError?: boolean) => Promise<void>;
  editMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  regenerateResponse: (menuItemId: string, id: string) => Promise<void>;
  chatApiConfig: ChatConfig;
  setChatApiConfig: (config: ChatConfig) => void;
  isLoading: boolean;
  tempProvider: string;
  setTempProvider: (provider: string) => void;
  availableProviders: string[];
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
  const [tempProvider, setTempProvider] = useState<string>("");
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      const result = await chrome.storage.local.get('providersConfig');
      const providers = Object.keys(result.providersConfig || {});
      setAvailableProviders(providers);
      setTempProvider(providers[0] || "");
    };
    fetchProviders();
  }, []);

  const createReasoning = async (messageId: string, history: ChatCompletionMessageParam[]) => {
    const result = await chrome.storage.local.get(['providersConfig', 'reasoningProvider']);
    const config = result.providersConfig?.[result.reasoningProvider]?.reasoningConfig || {};

    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl,
      dangerouslyAllowBrowser: true
    });

    let isThinking = false;
    let thinkingContent = '';
    let isRemoveFirstThinkTag = false;

    try {
      const requestConfig: any = {
        model: config.model,
        temperature: Number(config.temperature) || 0.7,
        top_p: Number(config.top_p) || 1,
        frequency_penalty: Number(config.frequency_penalty) || 0,
        presence_penalty: Number(config.presence_penalty) || 0,
        max_tokens: Number(config.max_tokens) || 1000,
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý AI giúp suy luận. Hãy suy luận bằng tiếng Việt.'
          },
          {
            role: 'user',
            content: `Dựa trên lịch sử giao tiếp giữa assistant và user, hãy suy luận bằng tiếng Việt cho câu hỏi của user, lập kế hoạch chi tiết, chia nhỏ vấn đề để trả lời câu hỏi của user:\n---\n${history.map(x => `***${x.role}***: ${x.content}`).join('\n---\n')}`
          }
        ],
        stream: true
      };

      // Thêm reasoning_effort nếu provider là OpenAI
      if (result.reasoningProvider === 'OpenAI') {
        requestConfig.reasoning_effort = "medium";
      }

      const stream = await openai.chat.completions.create(requestConfig) as any;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';

        // Xử lý logic để lấy nội dung giữa <think> và </think>
        if (content.includes('<think>')) {
          isThinking = true;
        }

        if (isThinking) {
          thinkingContent += content;

          if (!isRemoveFirstThinkTag && content.startsWith('<think>')) {
            thinkingContent = thinkingContent.replace('<think>', '');
            isRemoveFirstThinkTag = true;
          }

          setTimeout(() => {
            chatStore.setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? { ...msg, reasoningMessage: thinkingContent, pending: false, isError: false }
                : msg
            ));
          }, 50);
        }

        if (content.includes('</think>')) {
          isThinking = false;
          console.log(thinkingContent);
          console.log('I got </think>');

          break; // Dừng stream khi gặp </think>
        }
      }

      // Trả về nội dung giữa <think> và </think>
      const thinkingResult = thinkingContent
        .replace('<think>', '')
        .replace('</think>', '')
        .trim();

      setTimeout(() => {
        chatStore.setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, reasoningMessage: thinkingResult, pending: false, isError: false }
            : msg
        ));
      }, 50);

      return thinkingResult;
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
      let systemPrompt: string = ``;

      console.log(`useReasoning: ${chatStore.currentFeature?.enableReasoning || false}`);
      let useReasoning = chatStore.currentFeature?.enableReasoning || false;

      if (menuItemId === NEW_CHAT_CONTEXT_MENU_ID) {
        systemPrompt = SYSTEM_PROMPT_NEW_CHAT;
      }
      else {
        systemPrompt = chatStore.currentFeature?.systemPrompt || "";
        useReasoning = chatStore.currentFeature?.enableReasoning || false;
      }

      chatStore.setMessages(prev => [...prev, pendingMessage]);

      let recentHistory: ChatCompletionMessageParam[] = [
        { role: 'system' as Role, content: systemPrompt },
        ...chatStore.messages.filter(x => !x.pending && !x.isError).slice(-MAX_HISTORY).map(msg => ({
          role: (msg.id.endsWith('-assistant') ? 'assistant' : 'user') as Role,
          content: msg.content
        }))
      ];

      console.log(recentHistory);

      console.log("useReasoning", useReasoning);
      if (useReasoning) {
        const reasoningResult = await createReasoning(pendingMessage.id, recentHistory);
        recentHistory.push({
          role: 'assistant' as Role,
          content: `Trước khi trả lời yêu cầu của bạn, tôi đã suy nghĩ và suy luận như sau:\n<think>${reasoningResult}</think>\n---Dựa vào suy luận trên, sau đây là câu trả lời của tôi:`
        });
      }

      const result = await chrome.storage.local.get(['providersConfig', 'chatProvider']);

      const chatApiConfig: ChatConfig = result.providersConfig?.[result.chatProvider]?.chatConfig || {};

      console.log(chatApiConfig);

      const openai = new OpenAI({
        apiKey: chatApiConfig?.apiKey || "",
        baseURL: chatApiConfig?.apiUrl || "",
        dangerouslyAllowBrowser: true
      });

      console.log(recentHistory);

      // Use saved model and temperature
      const stream = await openai.chat.completions.create({
        model: chatApiConfig?.model || "gpt-4o",
        temperature: Number(chatApiConfig?.temperature) || 0.7,
        top_p: Number(chatApiConfig?.top_p) || 1,
        frequency_penalty: Number(chatApiConfig?.frequency_penalty) || 0,
        presence_penalty: Number(chatApiConfig?.presence_penalty) || 0,
        max_tokens: Number(chatApiConfig?.max_tokens) || 1000,
        messages: recentHistory,
        stream: true
      });

      let accumulatedContent = ``;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        accumulatedContent += content;

        setTimeout(() => {
          chatStore.setMessages(prev => prev.map(msg =>
            msg.id === pendingMessage.id
              ? { ...msg, content: accumulatedContent, pending: false }
              : msg
          ));
        }, 50);
      }

      // recentHistory.push({ role: 'assistant' as Role, content: `${accumulatedContent}`});

    } catch (error: any) {
      console.error("Lỗi khi gọi API:", error);
      addMessage(menuItemId, error?.message || "", "", true, true);
      chatStore.setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (menuItemId: string, content: string, reasoningMessage: string, isAi: boolean, isError?: boolean) => {
    chatStore.clearSuggestQuestions();
    console.log("menuItemId", menuItemId);
    if (menuItemId == NEW_CHAT_CONTEXT_MENU_ID) {
      console.log("new chat", content);

      if (typeof content == 'undefined' || content == null || content == '') {
        chatStore.setMessages(prev => []);
      } else {
        console.log("new chat", chatStore.messages);    
        const message: Message = {
          menuItemId: menuItemId,
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
            await createAIResponse(menuItemId, content);
          }
        }
      }
    }
    else {
      let decoratedContent = chatStore.messages.length == 0 ? `${chatStore.currentFeature?.instruction || ""}\n${content}` : content;
      console.log(decoratedContent);

      const message: Message = {
        menuItemId: menuItemId,
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
        await createAIResponse(menuItemId, content);
      }
    }

    // Tạo câu hỏi gợi ý
    if (typeof content !== 'undefined' && content.length > 0 && chatStore.messages.filter(x=>x.id.endsWith('assistant') && !x.pending && !x.isError).length > 0) {
      const questions = await generateSuggestQuestions(content, tempProvider);
      let questionsArray: string[] = [];
      try {
        questionsArray = JSON.parse(questions || "[]");
      } catch (error) {
        console.error('Error parsing questions:', error);
      }

      if (questionsArray.length > 0) {
        chatStore.setSuggestQuestions(questionsArray);
      }
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

  const regenerateResponse = async (menuItemId: string, messageId: string) => {
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
      addMessage(menuItemId, error.message, "", true, true);
      console.error('Error regenerating response:', error);
    }
  };

  const generateSuggestQuestions = async (content: string, provider: string) => {
    const result = await chrome.storage.local.get(['providersConfig', 'chatProvider']);
    const config = result.providersConfig?.[provider || result.chatProvider]?.chatConfig || {};

    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl,
      dangerouslyAllowBrowser: true
    });

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý AI giúp tạo các câu hỏi gợi ý dựa trên nội dung đã trả lời. Hãy tạo câu hỏi ngắn gọn, rõ ràng. Trả lời với format json ["question1", "question2", "question3"]'
        },
        {
          role: 'user',
          content: `Dựa trên nội dung sau, hãy tạo 3 câu hỏi gợi ý:\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content;
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
        isLoading,
        tempProvider,
        setTempProvider,
        availableProviders
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