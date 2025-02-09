import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconPicker } from "@/components/IconPicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { InfoIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { chatStore } from '@/stores/ChatStore';
import { OpenAI } from "openai";
import { db } from '@/utils/IndexedDBWrapper';
// import { useToast } from "@/hooks/use-toast"
import { SETTING_EXPLANATIONS } from '@/constants/constants';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { chatStore } from '@/stores/ChatStore';
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ChatConfig {
  provider: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  modelList: string[];
}

export interface ReasoningConfig {
  provider: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  modelList: string[];
}

interface ProviderConfig {
  chatConfig: ChatConfig;
  reasoningConfig: ReasoningConfig;
}

const DEFAULT_PROVIDERS: Record<string, ProviderConfig> = {
  OpenAI: {
    chatConfig: {
      provider: "OpenAI",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4",
      temperature: 0.9,
      max_tokens: 1000,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4-32k"]
    },
    reasoningConfig: {
      provider: "OpenAI",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4",
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["openai-sample-reasoning-1", "openai-sample-reasoning-2"]
    }
  },
  Claude: {
    chatConfig: {
      provider: "Claude",
      apiUrl: "https://api.anthropic.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 1000,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["claude-2", "claude-instant-1", "claude-2.1", "claude-3-opus"]
    },
    reasoningConfig: {
      provider: "Claude",
      apiUrl: "https://api.anthropic.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["anthropic-sample-resoning-1", "anthropic-sample-resoning-1"]
    }
  },
  Groq: {
    chatConfig: {
      provider: "Groq",
      apiUrl: "https://api.groq.com/openai/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 1000,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["llama-3.3-70b-versatile"]
    },
    reasoningConfig: {
      provider: "Groq",
      apiUrl: "https://api.groq.com/openai/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["groq-sample-reasoning-1", "groq-sample-reasoning-2"]
    }
  },
  DeepSeek: {
    chatConfig: {
      provider: "DeepSeek",
      apiUrl: "https://api.deepseek.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 1000,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["deepseek-chat"]
    },
    reasoningConfig: {
      provider: "DeepSeek",
      apiUrl: "https://api.deepseek.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["deepseek-reasoning"]
    }
  },
  OpenRouter: {
    chatConfig: {
      provider: "OpenRouter",
      apiUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 1000,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["meta-llama/llama-3.1-405b-instruct"]
    },
    reasoningConfig: {
      provider: "OpenRouter",
      apiUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: ["perplexity/sonar-reasoning"]
    }
  },
  Custom: {
    chatConfig: {
      provider: "Custom",
      apiUrl: "",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 1000,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: []
    },
    reasoningConfig: {
      provider: "Custom",
      apiUrl: "",
      apiKey: "",
      model: "",
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.7,
      presence_penalty: 0.7,
      modelList: []
    }
  }
};

type ConfigField = keyof ProviderConfig | `chatConfig.${keyof ProviderConfig['chatConfig']}` | `reasoningConfig.${keyof ProviderConfig['reasoningConfig']}`;

export interface FeatureEntry {
  id: string;
  name: string;
  systemPrompt: string;
  instruction: string;
  enabled: boolean;
  icon: string;
  enableReasoning: boolean;
}

export type Features = FeatureEntry[];

const SettingsPage: React.FC = () => {
  const [chatProvider, setChatProvider] = useState("OpenAI");
  const [reasoningProvider, setReasoningProvider] = useState("OpenAI");
  const [providersConfig, setProvidersConfig] = useState<Record<string, ProviderConfig>>({});
  const [chatConfig, setChatConfig] = useState<ChatConfig>(DEFAULT_PROVIDERS[chatProvider].chatConfig);
  const [reasoningConfig, setReasoningConfig] = useState<ReasoningConfig>(DEFAULT_PROVIDERS[reasoningProvider].reasoningConfig);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isCustomReasoningModel, setIsCustomReasoningModel] = useState(false);
  const [showChatApiKey, setShowChatApiKey] = useState(false);
  const [showReasoningApiKey, setShowReasoningApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'reasoning' | 'features'>('features');
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureEntry | null>(null);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [defaultFeatureId, setDefaultFeatureId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const providersConfig = await db.get('providersConfig');
      const chatProvider = await db.get('chatProvider') || "OpenAI";
      const reasoningProvider = await db.get('reasoningProvider') || "OpenAI";
      const features = await db.get('features');
      const defaultFeature = await db.get('defaultFeature');

      if (providersConfig) {
        setProvidersConfig(providersConfig);
        setChatProvider(chatProvider as string || "OpenAI");
        setReasoningProvider(reasoningProvider as string || "OpenAI");

        const savedChatConfig = providersConfig[chatProvider]?.chatConfig || DEFAULT_PROVIDERS[chatProvider].chatConfig;
        const savedReasoningConfig = providersConfig[reasoningProvider]?.reasoningConfig || DEFAULT_PROVIDERS[reasoningProvider].reasoningConfig;

        setChatConfig(savedChatConfig);
        setReasoningConfig(savedReasoningConfig);
      } else {
        setProvidersConfig(DEFAULT_PROVIDERS);
        setChatConfig(DEFAULT_PROVIDERS[chatProvider].chatConfig);
        setReasoningConfig(DEFAULT_PROVIDERS[reasoningProvider].reasoningConfig);
      }

      if (features) {
        setFeatures(Array.isArray(features) ? features : []);
      } else {
        setFeatures([]);
      }

      if (defaultFeature) {
        setDefaultFeatureId(defaultFeature);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Kiểm tra nếu model hiện tại không có trong danh sách
    if (chatConfig?.model &&
      !chatConfig.modelList.includes(chatConfig.model)) {
      setIsCustomModel(true);
    }
  }, [chatConfig]);

  useEffect(() => {
    // Kiểm tra nếu reasoning model hiện tại không có trong danh sách
    if (reasoningConfig?.model &&
      !reasoningConfig.modelList.includes(reasoningConfig.model)) {
      setIsCustomReasoningModel(true);
    }
  }, [reasoningConfig]);
  
  useEffect(() => {
    try{
      chrome.runtime.sendMessage({ action: 'updateContextMenu' }, (response) => {
        if (response && response.success) {
          console.log('Context menu updated successfully!');
        } else {
          console.error('Failed to update context menu.');
        }
      });
    }catch(error){
      
    }
  }, [features]);

  const generateSuggestPrompt = async (featureName: string, currentPrompt: string) => {
    setIsImproving(true);
    try {
      const providersConfig = await db.get('providersConfig');
      const chatProvider = await db.get('chatProvider');

      const config = providersConfig?.[chatProvider]?.chatConfig || {};

      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.apiUrl,
        dangerouslyAllowBrowser: true
      });

      if ((currentPrompt || "").trim().length == 0) { // generate
        const response = await openai.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: `Hãy tạo system prompt cho AI theo domain "[TÊN LĨNH VỰC]" với cấu trúc:

# Character
[Vai trò tổng quát của AI trong lĩnh vực này]

## Skills
### Skill 1: [Tên kỹ năng chính 1]
- [Mô tả chức năng]
- [Phương pháp triển khai]

### Skill 2: [Tên kỹ năng chính 2]
- [Mô tả chức năng]
- [Phương pháp triển khai]

### Skill 3: [Tên kỹ năng chính 3]
- [Mô tả chức năng]
- [Phương pháp triển khai]

## Constraints
- [Nguyên tắc 1]
- [Nguyên tắc 2]
- [Nguyên tắc 3]

Yêu cầu:
1. Đảm bảo 3 skills phân cấp rõ ràng
2. Ví dụ phải cụ thể, có tính ứng dụng
3. Constraints cần phản ánh đặc thù domain
4. Giữ nguyên cấu trúc markdown và syntax ====
---
!!! LƯU Ý QUAN TRỌNG: CHỈ TRẢ LỜI NỘI DUNG SYSTEM PROMPT, KHÔNG TRẢ LỜI GÌ KHÁC.
---
Ví dụ áp dụng cho domain "Dịch thuật":
Hãy tạo system prompt cho AI theo domain "Dịch thuật chuyên nghiệp" với cấu trúc...

# Character
Bạn là trợ lý dịch thuật đa ngữ, chuyên xử lý văn bản học thuật và kỹ thuật!

## Skills
### Skill 1: Bảo toàn ngữ nghĩa
- Giữ nguyên ý nghĩa gốc khi dịch
- Ưu tiên thuật ngữ chuyên ngành
`
            },
            {
              role: 'user',
              content: `Hãy tạo system prompt cho lĩnh vực '${featureName}'.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1024
        });

        return response.choices[0].message.content;
      }
      else { // improve
        const response = await openai.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: `Hãy tạo system prompt cho AI theo domain "[TÊN LĨNH VỰC]" với cấu trúc:

# Character
[Vai trò tổng quát của AI trong lĩnh vực này]

## Skills
### Skill 1: [Tên kỹ năng chính 1]
- [Mô tả chức năng]
- [Phương pháp triển khai]

### Skill 2: [Tên kỹ năng chính 2]
- [Mô tả chức năng]
- [Phương pháp triển khai]

### Skill 3: [Tên kỹ năng chính 3]
- [Mô tả chức năng]
- [Phương pháp triển khai]

## Constraints
- [Nguyên tắc 1]
- [Nguyên tắc 2]
- [Nguyên tắc 3]

Yêu cầu:
1. Đảm bảo 3 skills phân cấp rõ ràng
2. Ví dụ phải cụ thể, có tính ứng dụng
3. Constraints cần phản ánh đặc thù domain
4. Giữ nguyên cấu trúc markdown và syntax ====
---
!!! LƯU Ý QUAN TRỌNG: CHỈ TRẢ LỜI NỘI DUNG SYSTEM PROMPT, KHÔNG TRẢ LỜI GÌ KHÁC.
---
Ví dụ áp dụng cho domain "Dịch thuật":
Hãy tạo system prompt cho AI theo domain "Dịch thuật chuyên nghiệp" với cấu trúc...

# Character
Bạn là trợ lý dịch thuật đa ngữ, chuyên xử lý văn bản học thuật và kỹ thuật!

## Skills
### Skill 1: Bảo toàn ngữ nghĩa
- Giữ nguyên ý nghĩa gốc khi dịch
- Ưu tiên thuật ngữ chuyên ngành
`
            },
            {
              role: 'user',
              content: "Hãy cải thiện thêm cho lĩnh vực '" + featureName + "', dựa trên nội dung tham khảo được cung cấp sau:'\n---\n```" + currentPrompt + "```"
            }
          ],
        });
        return response.choices[0].message.content;
      }
    }
    finally {
      setIsImproving(false);
    }
  };

  const handleChatProviderChange = (newProvider: string) => {
    setChatProvider(newProvider);
    setChatConfig(providersConfig[newProvider]?.chatConfig || DEFAULT_PROVIDERS[newProvider].chatConfig);
  };

  const handleReasoningProviderChange = (newProvider: string) => {
    setReasoningProvider(newProvider);
    setReasoningConfig(providersConfig[newProvider]?.reasoningConfig || DEFAULT_PROVIDERS[newProvider].reasoningConfig);
  };

  const handleConfigChange = (field: ConfigField, value: any) => {
    if (field.startsWith('chatConfig.')) {
      const configField = field.replace('chatConfig.', '') as keyof ChatConfig;
      setChatConfig(prev => ({ ...prev, [configField]: value }));
    } else if (field.startsWith('reasoningConfig.')) {
      const configField = field.replace('reasoningConfig.', '') as keyof ReasoningConfig;
      setReasoningConfig(prev => ({ ...prev, [configField]: value }));
    } else {
      setProvidersConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveFunc = async () =>{
    const updatedProvidersConfig = {
      ...providersConfig,
      [chatProvider]: {
        ...providersConfig[chatProvider],
        chatConfig: chatConfig
      },
      [reasoningProvider]: {
        ...providersConfig[reasoningProvider],
        reasoningConfig: reasoningConfig
      }
    };

    // Cập nhật state trước khi lưu
    setProvidersConfig(updatedProvidersConfig);
    setFeatures(features);
    setDefaultFeatureId(defaultFeatureId);

    // Lưu tất cả dữ liệu vào IndexedDB
    await Promise.all([
      db.set('providersConfig', updatedProvidersConfig),
      db.set('chatProvider', chatProvider),
      db.set('reasoningProvider', reasoningProvider),
      db.set('features', features),
      db.set('defaultFeature', defaultFeatureId)
    ]);
  }
  
  const handleSave = async () => {
    toast.promise(
      handleSaveFunc(),
       {
         loading: 'Saving...',
         success: <b>Cấu hình đã được lưu thành công!</b>,
         error: <b>Đã xảy ra lỗi khi lưu cấu hình. Vui lòng thử lại.</b>,
       }, {position: 'top-center'}
     );
  };

  const handleExport = () => {
    const exportData = {
      providersConfig,
      chatProvider,
      reasoningProvider,
      features: features,
      defaultFeatureId: defaultFeatureId
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_chatbot_settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.providersConfig && data.chatProvider && data.reasoningProvider) {
            // Cập nhật state trước
            setProvidersConfig(data.providersConfig);
            setChatProvider(data.chatProvider);
            setReasoningProvider(data.reasoningProvider);
            setChatConfig(data.providersConfig[data.chatProvider]?.chatConfig || DEFAULT_PROVIDERS[data.chatProvider].chatConfig);
            setReasoningConfig(data.providersConfig[data.reasoningProvider]?.reasoningConfig || DEFAULT_PROVIDERS[data.reasoningProvider].reasoningConfig);

            if (data.features) {
              setFeatures(data.features);
            }

            if (data.defaultFeatureId) {
              setDefaultFeatureId(data.defaultFeatureId);
            }

            await Promise.all([
              db.set('providersConfig', data.providersConfig),
              db.set('chatProvider', data.chatProvider),
              db.set('reasoningProvider', data.reasoningProvider),
              db.set('features', data.features || []),
              db.set('defaultFeature', data.defaultFeatureId)
            ]);

            toast.success("Nhập cấu hình thành công!", {position: 'top-center'}); 

          } else {
            throw new Error('File cấu hình không hợp lệ');
          }
        } catch (error) {
          console.error('Lỗi khi nhập cấu hình:', error);
          alert('Lỗi khi nhập cấu hình: File không hợp lệ');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFeatureChange = async (feature: FeatureEntry, updates: Partial<FeatureEntry>) => {
    try {
      const updatedFeature = { ...feature, ...updates };
      const updatedFeatures = features.map(f =>
        f.id === feature.id ? updatedFeature : f
      );

      setFeatures(updatedFeatures);
      await db.set('features', updatedFeatures);
    } catch (error) {
      console.error('Lỗi khi cập nhật tính năng:', error);
      alert('Đã xảy ra lỗi khi cập nhật tính năng. Vui lòng thử lại.');
    }
  };

  const handleAddFeature = () => {
    setEditingFeature({
      id: '',
      name: '',
      systemPrompt: '',
      instruction: '',
      enabled: true,
      icon: '',
      enableReasoning: false
    });
    setIsFeatureDialogOpen(true);
  };

  const handleEditFeature = (feature: FeatureEntry) => {
    setEditingFeature(feature);
    setIsFeatureDialogOpen(true);
  };

  const handleSaveFeature = async (feature: FeatureEntry) => {
    try {
      let updatedFeatures: FeatureEntry[];

      if (feature.id != "") {
        updatedFeatures = features.map(f =>
          f.id === feature.id ? feature : f
        );
      } else {
        const generateId = () => {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 5);
          return `feature${timestamp}${random}`.replace(/[^a-zA-Z0-9]/g, '');
        };

        const newFeature = {
          ...feature,
          id: generateId(),
          enabled: true
        };

        updatedFeatures = [...features, newFeature];
      }

      setFeatures(updatedFeatures);
      await db.set('features', updatedFeatures);
      setIsFeatureDialogOpen(false);
    } catch (error) {
      console.error('Lỗi khi lưu tính năng:', error);
      alert('Đã xảy ra lỗi khi lưu tính năng. Vui lòng thử lại.');
    }
  };

  const handleRemoveFeature = async (feature: FeatureEntry) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tính năng ${feature.id}?`)) {
      const updatedFeatures = features.filter(f => f.id !== feature.id);
      setFeatures(updatedFeatures);
      await db.set('features', updatedFeatures);
    }
  };

  const handleSetDefaultFeature = async (featureId: string) => {
    setDefaultFeatureId(featureId);
    chatStore.setDefaultFeatureId(featureId);
    await db.set('defaultFeature', featureId);
    toast.success('Đã đặt tính năng mặc định thành công!', {position: 'top-center'});
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-64 border-r p-4">
        <div className="space-y-2">
        <Button
          variant="ghost"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => navigate('/chatbox')}
          title="Quay lại chat"
        >
          <span className="text-xl">⬅️ Back</span>
        </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setActiveTab('chat')}
          >
            Cài đặt Chat API
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setActiveTab('reasoning')}
          >
            Cài đặt Reasoning API
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setActiveTab('features')}
          >
            Cài đặt Tính Năng
          </Button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="space-y-4 p-4 border rounded-lg">
                <h2 className="text-2xl font-bold">Cài Đặt Chat API</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <p>{SETTING_EXPLANATIONS.model}</p>
                      </PopoverContent>
                    </Popover>
                    <Select
                      value={chatConfig?.provider || ""}
                      onValueChange={(value: string) => handleChatProviderChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(DEFAULT_PROVIDERS).map(provider => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <p>{SETTING_EXPLANATIONS.apiUrl}</p>
                      </PopoverContent>
                    </Popover>
                    <Input
                      value={chatConfig?.apiUrl || ""}
                      onChange={(e) => handleConfigChange('chatConfig.apiUrl', e.target.value)}
                      placeholder="Nhập API URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <p>{SETTING_EXPLANATIONS.apiKey}</p>
                      </PopoverContent>
                    </Popover>
                    <div className="relative">
                      <Input
                        value={chatConfig?.apiKey || ""}
                        onChange={(e) => handleConfigChange('chatConfig.apiKey', e.target.value)}
                        placeholder="Nhập API Key"
                        type={showChatApiKey ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowChatApiKey(!showChatApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        {showChatApiKey ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="selectModel"
                          name="modelType"
                          value="select"
                          checked={!isCustomModel}
                          onChange={() => setIsCustomModel(false)}
                        />
                        <Label htmlFor="selectModel">Chọn từ danh sách</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="customModel"
                          name="modelType"
                          value="custom"
                          checked={isCustomModel}
                          onChange={() => setIsCustomModel(true)}
                        />
                        <Label htmlFor="customModel">Nhập model tùy chỉnh</Label>
                      </div>
                    </div>
                    {isCustomModel ? (
                      <Input
                        value={chatConfig?.model || ""}
                        onChange={(e) => handleConfigChange('chatConfig.model', e.target.value)}
                        placeholder="Nhập model tùy chỉnh"
                      />
                    ) : (
                      <Select
                        value={chatConfig?.model || ""}
                        onValueChange={(value: string) => handleConfigChange('chatConfig.model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn model" />
                        </SelectTrigger>
                        <SelectContent>
                          {(DEFAULT_PROVIDERS[chatProvider]?.chatConfig?.modelList || []).map((model: string) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Temperature</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.temperature}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                            value={[chatConfig.temperature]}
                            onValueChange={value => handleConfigChange('chatConfig.temperature', value[0])}
                            min={0.2}
                            max={1.5}
                            step={0.1}
                          />
                          <Input
                            type="number"
                            min={0.2}
                            max={1.5}
                            step={0.1}
                            value={chatConfig.temperature}
                            onChange={e => handleConfigChange('chatConfig.temperature', Number(e.target.value))}
                            className="w-20"
                          />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.max_tokens}</p>
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="number"
                          value={chatConfig.max_tokens}
                          onChange={e => handleConfigChange('chatConfig.max_tokens', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Top P</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.top_p}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                          value={[chatConfig.top_p]}
                          onValueChange={value => handleConfigChange('chatConfig.top_p', value[0])}
                          min={0}
                          max={0.9}
                          step={0.1}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={0.9}
                          step={0.1}
                          value={chatConfig.top_p}
                          onChange={e => handleConfigChange('chatConfig.top_p', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency Penalty</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.frequency_penalty}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                          value={[chatConfig.frequency_penalty]}
                          onValueChange={value => handleConfigChange('chatConfig.frequency_penalty', value[0])}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={chatConfig.frequency_penalty}
                          onChange={e => handleConfigChange('chatConfig.frequency_penalty', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Presence Penalty</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.presence_penalty}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                          value={[chatConfig.presence_penalty]}
                          onValueChange={value => handleConfigChange('chatConfig.presence_penalty', value[0])}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={chatConfig.presence_penalty}
                          onChange={e => handleConfigChange('chatConfig.presence_penalty', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'reasoning' && (
            <div className="space-y-4">
              <div className="space-y-4 p-4 border rounded-lg">
                <h2 className="text-2xl font-bold">Cài Đặt Reasoning API</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={reasoningConfig?.provider || ""}
                      onValueChange={(value: string) => handleReasoningProviderChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(DEFAULT_PROVIDERS).map(provider => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input
                      value={reasoningConfig?.apiUrl || ""}
                      onChange={(e) => handleConfigChange('reasoningConfig.apiUrl', e.target.value)}
                      placeholder="Nhập API URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        value={reasoningConfig?.apiKey || ""}
                        onChange={(e) => handleConfigChange('reasoningConfig.apiKey', e.target.value)}
                        placeholder="Nhập API Key"
                        type={showReasoningApiKey ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowReasoningApiKey(!showReasoningApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        {showReasoningApiKey ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="selectReasoningModel"
                          name="reasoningModelType"
                          value="select"
                          checked={!isCustomReasoningModel}
                          onChange={() => setIsCustomReasoningModel(false)}
                        />
                        <Label htmlFor="selectReasoningModel">Chọn từ danh sách</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="customReasoningModel"
                          name="reasoningModelType"
                          value="custom"
                          checked={isCustomReasoningModel}
                          onChange={() => setIsCustomReasoningModel(true)}
                        />
                        <Label htmlFor="customReasoningModel">Nhập model tùy chỉnh</Label>
                      </div>
                    </div>
                    {isCustomReasoningModel ? (
                      <Input
                        value={reasoningConfig?.model || ""}
                        onChange={(e) => handleConfigChange('reasoningConfig.model', e.target.value)}
                        placeholder="Nhập model tùy chỉnh"
                      />
                    ) : (
                      <Select
                        value={reasoningConfig?.model || ""}
                        onValueChange={(value: string) => handleConfigChange('reasoningConfig.model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn reasoning model" />
                        </SelectTrigger>
                        <SelectContent>
                          {(DEFAULT_PROVIDERS[reasoningProvider]?.reasoningConfig?.modelList || []).map((model: string) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reasoning Temperature</Label>
                        <Slider
                            value={[reasoningConfig.temperature]}
                            onValueChange={value => handleConfigChange('reasoningConfig.temperature', value[0])}
                            min={0.2}
                            max={1.5}
                            step={0.1}
                          />
                          <Input
                            type="number"
                            min={0.2}
                            max={1.5}
                            step={0.1}
                            value={reasoningConfig.temperature}
                            onChange={e => handleConfigChange('reasoningConfig.temperature', Number(e.target.value))}
                            className="w-20"
                          />
                      </div>
                      <div className="space-y-2">
                        <Label>Reasoning Max Tokens</Label>
                        <Input
                          type="number"
                          value={reasoningConfig.max_tokens}
                          onChange={e => handleConfigChange('reasoningConfig.max_tokens', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reasoning Top P</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.top_p}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                          value={[reasoningConfig.top_p]}
                          onValueChange={value => handleConfigChange('reasoningConfig.top_p', value[0])}
                          min={0}
                          max={0.9}
                          step={0.1}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={0.9}
                          step={0.1}
                          value={reasoningConfig.top_p}
                          onChange={e => handleConfigChange('reasoningConfig.top_p', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reasoning Frequency Penalty</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.frequency_penalty}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                          value={[reasoningConfig.frequency_penalty]}
                          onValueChange={value => handleConfigChange('reasoningConfig.frequency_penalty', value[0])}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={reasoningConfig.frequency_penalty}
                          onChange={e => handleConfigChange('reasoningConfig.frequency_penalty', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reasoning Presence Penalty</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p>{SETTING_EXPLANATIONS.presence_penalty}</p>
                          </PopoverContent>
                        </Popover>
                        <Slider
                          value={[reasoningConfig.presence_penalty]}
                          onValueChange={value => handleConfigChange('reasoningConfig.presence_penalty', value[0])}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={reasoningConfig.presence_penalty}
                          onChange={e => handleConfigChange('reasoningConfig.presence_penalty', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'features' && (
            <div className="space-y-4">
              {features != null && typeof features != 'undefined' && features.length > 0 && (
                <div className="flex justify-end p-4">
                <Button variant="outline" onClick={handleAddFeature}>
                  Thêm tính năng
                </Button>
              </div>
              )}
              {features.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <p className="text-gray-500 text-center">Chưa có tính năng nào được thêm. Hãy bắt đầu bằng cách thêm tính năng đầu tiên!</p>
                  <Button 
                    onClick={() => setIsFeatureDialogOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Thêm tính năng mới
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {features.map((feature) => (
                  <Card
                    key={feature.id}
                    className="cursor-pointer hover:shadow-md transition-shadow relative group"
                    onClick={() => handleEditFeature(feature)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{feature.icon}</span>
                          <CardTitle>{feature.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          {defaultFeatureId === feature.id ? (
                            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 hover:bg-blue-600 transition-colors">
                              <span className="text-yellow-300">⭐</span>
                              <span>Mặc định</span>
                            </div>
                          ) : (
                            <Button
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefaultFeature(feature.id);
                              }}
                            >
                              Đặt mặc định
                            </Button>
                          )}
                          <Button
                            className="text-red-500"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFeature(feature);
                            }}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center gap-2">
                        <Label>Reasoning:</Label>
                        <span className={`text-sm ${feature.enableReasoning ? 'text-green-600' : 'text-red-600'}`}>
                          {feature.enableReasoning ? 'Đã bật' : 'Đã tắt'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="truncate" title={feature.systemPrompt}>
                          <span className="font-medium">System Prompt:</span> {feature.systemPrompt}
                        </div>
                        <div className="truncate" title={feature.instruction}>
                          <span className="font-medium">Instruction:</span> {feature.instruction}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t flex justify-end">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(checked) => {
                          handleFeatureChange(feature, { enabled: checked });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Container */}
        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="flex gap-2 justify-end">
            <Button onClick={handleSave}>Lưu cấu hình</Button>
            <Button variant="outline" onClick={handleExport}>
              Xuất cấu hình
            </Button>
            <Button variant="outline" asChild>
              <label htmlFor="import-settings" className="cursor-pointer">
                Nhập cấu hình
                <input
                  id="import-settings"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>
          </div>
        </div>

        {/* Feature Dialog */}
        <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
          <DialogContent className="sm:max-w-[1000px] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingFeature ? "Chỉnh sửa tính năng" : "Thêm tính năng mới"}</DialogTitle>
            </DialogHeader>
            
            {/* Content Section */}
            <ScrollArea className="flex-1 p-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feature-name">Tên tính năng</Label>
                  <Input
                    id="feature-name"
                    value={editingFeature?.name || ""}
                    onChange={(e) => setEditingFeature(prev => ({ ...prev!, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="system-prompt"
                      value={editingFeature?.systemPrompt || ""}
                      onChange={(e) => setEditingFeature(prev => ({ ...prev!, systemPrompt: e.target.value }))}
                      className="min-h-[350px] flex-1"
                    />
                    {(editingFeature?.name || "").trim().length > 0 && <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-red-50 transition-colors"
                      onClick={async () => {
                        if (editingFeature?.name) {
                          try {
                            const prompt = await generateSuggestPrompt(editingFeature.name, editingFeature.systemPrompt);
                            setEditingFeature(prev => ({ ...prev!, systemPrompt: prompt || '' }));
                          } catch (error) {
                            alert('Không thể cải thiện prompt. Vui lòng thử lại.');
                          }
                        }
                      }}
                      disabled={isImproving}
                    >
                      {isImproving ? (
                        <div className="w-4 h-4 animate-bounce">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-yellow-400">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        </div>
                      ) : (
                        <span className="text-lg">✨</span>
                      )}
                    </Button>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instruction">Instruction</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="instruction"
                      value={editingFeature?.instruction || ""}
                      onChange={(e) => setEditingFeature(prev => ({ ...prev!, instruction: e.target.value }))}
                      className="min-h-[100px] flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <IconPicker
                    selected={editingFeature?.icon || ""}
                    onSelect={(icon) => setEditingFeature(prev => ({ ...prev!, icon }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enable-reasoning">Bật Reasoning</Label>
                  <Switch
                    id="enable-reasoning"
                    checked={editingFeature?.enableReasoning || false}
                    onCheckedChange={(checked) => setEditingFeature(prev => ({ ...prev!, enableReasoning: checked }))}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Command Buttons Section - Di chuyển ra ngoài ScrollArea */}
            <div className="bg-background border-t pt-4">
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsFeatureDialogOpen(false)}
                  className="hover:bg-red-50"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  onClick={() => handleSaveFeature(editingFeature!)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SettingsPage; 