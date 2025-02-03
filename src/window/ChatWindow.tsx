import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Message, useChat } from "../context/ChatContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { observer } from "mobx-react";
import { chatStore } from "../stores/ChatStore";
import { FeatureEntry } from "@/window/SettingsPage";
import { NEW_CHAT_CONTEXT_MENU_ID } from "@/constants/constants";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
const ChatMessage = lazy(() => import("./ChatMessage"));
const MarkdownEditor = lazy(() => import("../components/MarkdownEditor"));

const ChatWindow: React.FC = observer(() => {
  const { addMessage, tempProvider, setTempProvider, availableProviders } = useChat();
  const [inputMessage, setInputMessage] = useState<string>("");
  const [currentMenuItemId, setMenuItemId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const handleInitialMessage = async () => {
      const dataMenuItem = await chrome.storage.local.get("menuItemId");
      const dataMarkdownContent = await chrome.storage.local.get("markdownContent");
      const dataCChatProvider = await chrome.storage.local.get("chatProvider");

      await chrome.storage.local.remove("menuItemId");
      await chrome.storage.local.remove("markdownContent");

      const menuItemId = dataMenuItem.menuItemId;
      setMenuItemId(menuItemId);

      setTempProvider(dataCChatProvider.chatProvider || "");

      if (menuItemId === NEW_CHAT_CONTEXT_MENU_ID) {
        //chatStore.setUseReasoningCurrentFeature(true); // we allow user to choose feature so reasoning mode will be inherit from feature
      }
      else {
        const featureStoreObj = await chrome.storage.local.get(['features']);

        const feature = (featureStoreObj.features as FeatureEntry[] || []).filter((feature: FeatureEntry) => feature.id === menuItemId)?.[0] || undefined;

        if (!feature || !feature.enabled) {
          console.error(`Can not find feature for [${menuItemId}]`);
          addMessage(menuItemId, `Can not find feature for [${menuItemId}]`, "", true, true);
          //setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
          return;
        };

        chatStore.setCurrentFeature(feature);        
      }

      console.log("chatStore.currentFeature", chatStore.currentFeature);

      if (typeof dataMarkdownContent.markdownContent !== 'undefined' && dataMarkdownContent.markdownContent !== "") {
        addMessage(menuItemId, dataMarkdownContent.markdownContent, "", false, false);
      }
    };

    handleInitialMessage();
  }, []);

  useEffect(() => {
    const loadFeatures = async () => {
      const result = await chrome.storage.local.get('features');
      setFeatures(result.features || []);
    };
    loadFeatures();
  }, []);


  useEffect(() => {
    if (autoScroll) {
      setTimeout(() => {  
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [chatStore.messages, autoScroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      let cloneInputMessage = inputMessage;
      setInputMessage("");
      await addMessage(currentMenuItemId, cloneInputMessage, "", false, false);
    }
  };

  const handleSubmitSuggestQuestion = async (question: string) => {
    await addMessage(currentMenuItemId, question, "", false, false);
  }

  const lastPendingMessage = chatStore.messages.slice().reverse().find((msg: Message) => msg.pending);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5; // Thêm dung sai 5px

    if(!autoScroll){
      return;
    }

    const isScrollingUp = element.scrollTop < (element.scrollHeight - element.clientHeight);
    console.log("isAtBottom", isAtBottom);
    console.log("isScrollingUp", isScrollingUp);

    // Nếu đang ở dưới cùng thì tiếp tục auto scroll
    // Nếu đang scroll lên thì tắt auto scroll
    setAutoScroll(isAtBottom && !isScrollingUp);
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="h-screen w-screen flex flex-col">
        <CardContent 
          className="flex-1 overflow-y-auto space-y-4 px-4 pt-2"
          onScroll={handleScroll}
        >
          <Suspense fallback={<div>Loading...</div>}>
            {chatStore.messages.map((msg) => (
              <ChatMessage
                menuItemId={msg.menuItemId}
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
        </CardContent>
        {chatStore.suggestQuestions.length > 0 && (
          <div className="px-4 py-2 space-y-2">
            {chatStore.suggestQuestions.map((question, index) => (
              <div
                key={index}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer text-left"
                onClick={() => handleSubmitSuggestQuestion(question)}
              >
                {question}
              </div>
            ))}
          </div>
        )}
        <div className="p-2 border-t">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 mx-auto">
            <div className="flex flex-col gap-4 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="reasoning" className="font-medium text-gray-700">Chế độ Suy luận</Label>
                  <Switch
                    id="reasoning"
                    checked={chatStore.currentFeature?.enableReasoning || false}
                    onCheckedChange={(checked) => chatStore.setUseReasoningCurrentFeature(checked)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                
                {(
                  <div className="flex items-center gap-2">
                    <Label htmlFor="feature" className="font-medium text-gray-700">Tính năng</Label>
                    <Select
                      value={currentMenuItemId}
                      onValueChange={(value) => {
                        setMenuItemId(value);
                        const feature = features.find(f => f.id === value);
                        if (feature) {
                          chatStore.setCurrentFeature(feature);
                        }
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
                  </div>
                )}
              </div>
            </div>
            <Suspense fallback={<div>Loading editor...</div>}>
              <MarkdownEditor
                ref={(editor: any) => {
                  console.log(editor);
                  if (editor) {
                    editor.nodeMdText.current.focus();
                  }
                }}
                value={inputMessage}
                onChange={setInputMessage}
                placeholder="Nhập tin nhắn..."
              />
            </Suspense>
            <Button type="submit">Gửi</Button>
          </form>
        </div>
      </Card>
    </div>
  );
});

export default ChatWindow; 