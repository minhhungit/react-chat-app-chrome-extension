import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Message, useChat } from "../context/ChatContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { observer } from "mobx-react";
import { chatStore } from "../stores/ChatStore";
import { FeatureEntry } from "@/settings/SettingsPage";
import { NEW_CHAT_CONTEXT_MENU_ID, OPEN_OPTIONS_CONTEXT_MENU_ID } from "@/constants/constants";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import RichTextEditor, { RichTextEditorRef } from "@/components/RichTextEditor";
import ChatInput from '@/components/ChatInput';
import { ScrollArea } from "@/components/ui/scroll-area";
const ChatMessage = lazy(() => import("./ChatMessage"));
// const MarkdownEditor = lazy(() => import("../components/MarkdownEditor"));
import TurndownService from 'turndown';
import { db } from "@/utils/IndexedDBWrapper";
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ChatWindow: React.FC = observer(() => {
  const { addMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const turndownService = new TurndownService()
  const richTextEditorRef = useRef<RichTextEditorRef>(null);
  const navigate = useNavigate();
  const [chatboxHeight, setChatboxHeight] = useState(150); // Giá trị mặc định
  const chatboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleInitialMessage = async () => {
      const menuItemId = await db.get("menuItemId");
      const markdownContent = await db.get("chromeContextMenuSelectedMarkdownContent");
      // const chatProvider = await db.get("chatProvider");
      const defaultFeatureIdConfigured = await db.get("defaultFeature");

      if (typeof menuItemId !== "undefined" && menuItemId !== "" && menuItemId !== null) {

        if (menuItemId === NEW_CHAT_CONTEXT_MENU_ID) {
          // Nếu là chat mới và có defaultFeatureIdConfigured
          if (defaultFeatureIdConfigured) {
            const featureStoreObj = await db.get('features');
            const defaultFeature = (featureStoreObj as FeatureEntry[] || []).find(
              (feature: FeatureEntry) => feature.id === defaultFeatureIdConfigured
            );
            
            if (defaultFeature) {
              chatStore.setCurrentFeature(defaultFeature);
            }
          }
        } else {
          const featureStoreObj = await db.get('features');
          const feature = (featureStoreObj as FeatureEntry[] || []).filter(
            (feature: FeatureEntry) => feature.id === menuItemId
          )?.[0] || undefined;

          if (!feature || !feature.enabled) {
            console.error(`Can not find feature for [${menuItemId}]`);
            addMessage(`Can not find feature for [${menuItemId}]`, "", true, true);
            return;
          }

          chatStore.setCurrentFeature(feature);
        }

        console.log("chatStore.currentFeature", chatStore.currentFeature);

        if (typeof markdownContent !== 'undefined' && markdownContent !== "") {
          addMessage(markdownContent, "", false, false);
        }

        await db.remove("menuItemId");
        await db.remove("chromeContextMenuSelectedMarkdownContent");
      }
    };

    handleInitialMessage();
  }, []);

  useEffect(() => {
    const loadFeatures = async () => {
      const result = await db.get('features');
      setFeatures(result || []);
    };
    loadFeatures();
  }, []);

  // useEffect(() => {
  //   if (autoScroll) {
  //     setTimeout(() => {  
  //       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //     }, 500);
  //   }
  // }, [chatStore.messages, autoScroll]);

  useEffect(() => {
    const updateDefaultFeature= async ()=>{
      
      if (chatStore.currentFeature.id == null || typeof chatStore.currentFeature.id === "undefined" || chatStore.currentFeature.id === "") {
        const featureStoreObj = await db.get('features');
        const defaultFeature = (featureStoreObj as FeatureEntry[] || []).find(
          (feature: FeatureEntry) => feature.id === chatStore.defaultFeatureId
        );
        
        if (defaultFeature) {
          chatStore.setCurrentFeature(defaultFeature);
        }
      }
    }
    updateDefaultFeature();

  }, [chatStore.defaultFeatureId]);

  useEffect(() => {
    // Auto focus on mount
    richTextEditorRef.current?.focus();
  }, []);

  const handleSubmitSuggestQuestion = async (question: string) => {
    await addMessage(question, "", false, false);
  }

  const lastPendingMessage = chatStore.messages.slice().reverse().find((msg: Message) => msg.pending);

  // const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  //   const element = e.currentTarget;
  //   const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5; // Thêm dung sai 5px

  //   if(!autoScroll){
  //     return;
  //   }

  //   const isScrollingUp = element.scrollTop < (element.scrollHeight - element.clientHeight);
  //   console.log("isAtBottom", isAtBottom);
  //   console.log("isScrollingUp", isScrollingUp);

  //   // Nếu đang ở dưới cùng thì tiếp tục auto scroll
  //   // Nếu đang scroll lên thì tắt auto scroll
  //   setAutoScroll(isAtBottom && !isScrollingUp);
  // };

  useEffect(() => {
    const chatboxElement = chatboxRef.current;
    if (!chatboxElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        setChatboxHeight(height);
      }
    });

    resizeObserver.observe(chatboxElement);

    return () => {
      resizeObserver.unobserve(chatboxElement);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Card className="h-full flex flex-col bg-white">
        {/* Phần danh sách tin nhắn */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea 
            className="p-4" 
            style={{ height: `calc(100vh - ${chatboxHeight}px)` }}
          >
            <Suspense fallback={<div>Loading...</div>}>
              {chatStore.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  message={msg.content}
                  reasoningMessage={msg.reasoningMessage}
                  pending={msg.id === lastPendingMessage?.id}
                  isError={msg.isError}
                />
              ))}
              <div ref={messagesEndRef} />
            </Suspense>
          </ScrollArea>
        </div>

        {/* Phần chatbox cố định ở dưới */}
        <div 
          ref={chatboxRef}
          className="sticky bottom-0 bg-white border-t border-gray-200"
        >
          <div className="w-full px-4 py-2">
            {/* Thanh điều khiển */}
            <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-lg">
              {/* <div className="flex items-center gap-2">
                <Label htmlFor="reasoning" className="font-medium text-gray-700">Chế độ Suy luận</Label>
                <Switch
                  id="reasoning"
                  checked={chatStore.currentFeature?.enableReasoning || false}
                  onCheckedChange={(checked) => chatStore.setUseReasoningCurrentFeature(checked)}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div> */}

              <div className="flex items-center gap-2 float-left">
                <Label htmlFor="feature" className="font-medium text-gray-700">Tính năng</Label>
                <Select
                  value={chatStore.currentFeature.id}
                  onValueChange={(value) => {
                    const feature = features.find((f: FeatureEntry) => f.id === value);
                    if (feature) {
                      chatStore.setCurrentFeature(feature);
                    }
                  }}
                  onOpenChange={() => {
                    const loadFeatures = async () => {
                      const result = await db.get('features');
                      setFeatures(result || []);
                    };
                    loadFeatures();
                  }}
                  
                  disabled={chatStore.currentFeature.id !== "" && chatStore.messages.filter(x => !x.pending && !x.isError).length > 0}
                >
                  <SelectTrigger className="w-[200px] bg-white border-gray-300 hover:border-gray-400">
                    <SelectValue placeholder="Chọn tính năng" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {features.filter(x => x.enabled).map(feature => (
                      <SelectItem
                        key={feature.id}
                        value={feature.id}
                        className="hover:bg-gray-100 focus:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{feature.icon}</span>
                          <span className="text-gray-700">{feature.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {chatStore.suggestQuestions.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {chatStore.suggestQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer text-sm"
                        onClick={() => handleSubmitSuggestQuestion(question)}
                      >
                        {question}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => navigate('/settings')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                size="sm"
                title="Mở cài đặt"
              >
                ⚙️
              </Button>
            </div>

            {/* ChatInput */}
            <div className="mt-2">
              <ChatInput
                onSend={(message) => {
                  console.log("send send");
                  if (chatStore.currentFeature.id === "") {
                    toast.error("Vui lòng chọn tính năng trước khi gửi tin nhắn", {position: "top-center"});
                    return;
                  }

                  if (!message || message.trim().length === 0) {
                    toast.error("Vui lòng nhập nội dung tin nhắn", {position: "top-center"});
                    return;
                  }

                  const markdownContent = turndownService.turndown(message);
                  addMessage(markdownContent, "", false, false);
                }}
                //enableSearch={chatStore.currentFeature?.enableSearch}
                enableReasoning={chatStore.currentFeature?.enableReasoning}
                onToggleReasoning={(enable) => {
                  chatStore.setUseReasoningCurrentFeature(enable);
                }}
                onImageUpload={(file) => {
                  // Xử lý upload ảnh
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default ChatWindow; 