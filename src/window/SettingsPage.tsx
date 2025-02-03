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
import { chatStore } from '@/stores/ChatStore';
import { OpenAI } from "openai";

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
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4-32k"]
    },
    reasoningConfig: {
      provider: "OpenAI",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["openai-sample-reasoning-1", "openai-sample-reasoning-2"]
    }
  },
  Claude: {
    chatConfig: {
      provider: "Claude",
      apiUrl: "https://api.anthropic.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["claude-2", "claude-instant-1", "claude-2.1", "claude-3-opus"]
    },
    reasoningConfig: {
      provider: "Claude",
      apiUrl: "https://api.anthropic.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["anthropic-sample-resoning-1", "anthropic-sample-resoning-1"]
    }
  },
  Groq: {
    chatConfig: {
      provider: "Groq",
      apiUrl: "https://api.groq.com/openai/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["llama-3.3-70b-versatile"]
    },
    reasoningConfig: {
      provider: "Groq",
      apiUrl: "https://api.groq.com/openai/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["groq-sample-reasoning-1", "groq-sample-reasoning-2"]
    }
  },
  DeepSeek: {
    chatConfig: {
      provider: "DeepSeek",
      apiUrl: "https://api.deepseek.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["deepseek-chat"]
    },
    reasoningConfig: {
      provider: "DeepSeek",
      apiUrl: "https://api.deepseek.com/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["deepseek-reasoning"]
    }
  },
  OpenRouter: {
    chatConfig: {
      provider: "OpenRouter",
      apiUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["meta-llama/llama-3.1-405b-instruct"]
    },
    reasoningConfig: {
      provider: "OpenRouter",
      apiUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: ["perplexity/sonar-reasoning"]
    }
  },
  Custom: {
    chatConfig: {
      provider: "Custom",
      apiUrl: "",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      modelList: []
    },
    reasoningConfig: {
      provider: "Custom",
      apiUrl: "",
      apiKey: "",
      model: "",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
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

const SETTING_EXPLANATIONS = {
  temperature: "Điều chỉnh mức độ sáng tạo của model. Giá trị càng cao, kết quả càng ngẫu nhiên. Ví dụ, tăng temperature giúp model tạo ra câu trả lời độc đáo hơn nhưng có thể rủi ro hơn. Thông thường, giá trị này nằm trong khoảng từ 0.2 đến 1.5. Ví dụ, nếu đặt temperature là 0.5, model sẽ tạo ra câu trả lời vừa phải về mặt sáng tạo.",
  max_tokens: "Giới hạn số lượng từ trong câu trả lời. Giá trị càng cao, câu trả lời càng dài. Tuy nhiên, điều này cũng tiêu tốn nhiều tài nguyên hơn. Thông thường, giá trị này nằm trong khoảng từ 100 đến 1000. Ví dụ, nếu đặt max_tokens là 200, câu trả lời sẽ có độ dài vừa phải, khoảng 2-3 câu.",
  top_p: "Kiểm soát tính đa dạng của kết quả. Giá trị thấp sẽ tập trung vào các từ phổ biến, trong khi giá trị cao cho phép kết quả đa dạng hơn. Ví dụ, nếu đặt top_p là 0.5, model sẽ chọn từ trong top 50% từ có xác suất cao nhất. Thông thường, giá trị này nằm trong khoảng từ 0.1 đến 0.9.",
  frequency_penalty: "Giảm tần suất lặp lại từ. Giá trị dương sẽ giảm lặp từ, giúp câu trả lời đa dạng hơn. Ví dụ, nếu đặt frequency_penalty là 0.5, model sẽ giảm 50% tần suất lặp lại từ. Thông thường, giá trị này nằm trong khoảng từ 0 đến 1.",
  presence_penalty: "Khuyến khích sử dụng từ mới. Giá trị dương sẽ tăng từ mới, giúp câu trả lời phong phú hơn. Ví dụ, nếu đặt presence_penalty là 0.5, model sẽ tăng 50% khả năng chọn từ chưa dùng. Thông thường, giá trị này nằm trong khoảng từ 0 đến 1.",
  model: "Chọn model AI phù hợp với nhu cầu sử dụng. Mỗi model có điểm mạnh và điểm yếu riêng, vì vậy việc chọn model đúng sẽ ảnh hưởng đến chất lượng và tốc độ.",
  apiKey: "Khóa API để xác thực với nhà cung cấp dịch vụ AI. Giữ bí mật apiKey là rất quan trọng để tránh bị lợi dụng. Ví dụ, nếu apiKey là 'sk-abc-xyz', người dùng cần giữ bí mật và không chia sẻ với người khác.",
  apiUrl: "Địa chỉ API endpoint của nhà cung cấp dịch vụ AI. Cấu trúc apiUrl đúng cách là rất quan trọng để đảm bảo kết nối thành công."
};


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
  const [activeTab, setActiveTab] = useState<'chat' | 'reasoning' | 'features'>('chat');
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureEntry | null>(null);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [isImproving, setIsImproving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const result = await chrome.storage.local.get(['providersConfig', 'chatProvider', 'reasoningProvider', 'features']);
      const { providersConfig, chatProvider, reasoningProvider, features } = result;

      if (providersConfig) {
        setProvidersConfig(providersConfig);
        setChatProvider(chatProvider as string || "OpenAI");
        setReasoningProvider(reasoningProvider as string || "OpenAI");

        const savedChatConfig = providersConfig[chatProvider]?.chatConfig || DEFAULT_PROVIDERS[chatProvider].chatConfig;
        const savedReasoningConfig = providersConfig[reasoningProvider]?.reasoningConfig || DEFAULT_PROVIDERS[reasoningProvider].reasoningConfig;

        console.log(savedChatConfig);
        console.log(savedReasoningConfig);

        setChatConfig(savedChatConfig);
        setReasoningConfig(savedReasoningConfig);
      } else {
        setProvidersConfig(DEFAULT_PROVIDERS);
        setChatConfig(DEFAULT_PROVIDERS[chatProvider].chatConfig);
        setReasoningConfig(DEFAULT_PROVIDERS[reasoningProvider].reasoningConfig);
      }

      console.log(`load features from storage`, result.features);
      if (result.features) {
        setFeatures(Array.isArray(result.features) ? result.features : []);
      } else {
        setFeatures([]);
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

  // useEffect(() => { 
  //   chrome.storage.local.set({ features: features });
  //   console.log(`saved `, features);
  // }, [features]);

  const generateSuggestPrompt = async (featureName: string, currentPrompt: string) => {
    setIsImproving(true);
    try {
      const result = await chrome.storage.local.get(['providersConfig', 'chatProvider']);
      const config = result.providersConfig?.[result.chatProvider]?.chatConfig || {};

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

  const handleSave = () => {
    providersConfig[chatProvider].chatConfig = chatConfig;
    providersConfig[reasoningProvider].reasoningConfig = reasoningConfig;

    console.log(features);

    chrome.storage.local.set({
      providersConfig: providersConfig,
      chatProvider: chatProvider,
      reasoningProvider: reasoningProvider,
      features: features
    }, () => {
      alert('Cấu hình đã được lưu thành công!');
    });
  };

  const handleExport = () => {
    const exportData = {
      providersConfig,
      chatProvider,
      reasoningProvider,
      features: features
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
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.providersConfig && data.chatProvider && data.reasoningProvider) {
            setProvidersConfig(data.providersConfig);
            setChatProvider(data.chatProvider);
            setReasoningProvider(data.reasoningProvider);
            setChatConfig(data.providersConfig[data.chatProvider]?.chatConfig || DEFAULT_PROVIDERS[data.chatProvider].chatConfig);
            setReasoningConfig(data.providersConfig[data.reasoningProvider]?.reasoningConfig || DEFAULT_PROVIDERS[data.reasoningProvider].reasoningConfig);

            if (data.features) {
              setFeatures(data.features);
            }

            providersConfig[chatProvider].chatConfig = chatConfig;
            providersConfig[reasoningProvider].reasoningConfig = reasoningConfig;

            chrome.storage.local.set({
              providersConfig: providersConfig,
              chatProvider: chatProvider,
              reasoningProvider: reasoningProvider,
              features: features
            }, () => {
              alert('Cấu hình đã được import thành công!');
            });

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

  // const handleReset = () => {
  //   setFeatures([]);
  //   chrome.storage.local.remove('features');
  // };

  const handleFeatureChange = async (feature: FeatureEntry, updates: Partial<FeatureEntry>) => {
    try {
      const updatedFeature = { ...feature, ...updates };
      const updatedFeatures = features.map(f =>
        f.id === feature.id ? updatedFeature : f
      );

      // Update state and save to storage
      setFeatures(updatedFeatures);
      await chrome.storage.local.set({ features: updatedFeatures });
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
        // Update existing feature
        updatedFeatures = features.map(f =>
          f.id === feature.id ? feature : f
        );
      } else {
        // Add new feature
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

      console.log(updatedFeatures);

      // Update state and save to storage
      setFeatures(updatedFeatures);
      await chrome.storage.local.set({ features: updatedFeatures });
      setIsFeatureDialogOpen(false);
    } catch (error) {
      console.error('Lỗi khi lưu tính năng:', error);
      alert('Đã xảy ra lỗi khi lưu tính năng. Vui lòng thử lại.');
    }
  };

  const handleRemoveFeature = (feature: FeatureEntry) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tính năng ${feature.id}?`)) {
      const updatedFeatures = features.filter(f => f.id !== feature.id);
      setFeatures(updatedFeatures);
      chrome.storage.local.set({ features: updatedFeatures });
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-64 border-r p-4">
        <div className="space-y-2">
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
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[chatConfig.temperature]}
                            onValueChange={value => handleConfigChange('chatConfig.temperature', value[0])}
                            min={0}
                            max={2}
                            step={0.1}
                          />
                        </div>
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
                          max={1}
                          step={0.1}
                        />
                        <Input
                          type="number"
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
                          min={-2}
                          max={2}
                          step={0.1}
                        />
                        <Input
                          type="number"
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
                          min={-2}
                          max={2}
                          step={0.1}
                        />
                        <Input
                          type="number"
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
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[reasoningConfig.temperature]}
                            onValueChange={value => handleConfigChange('reasoningConfig.temperature', value[0])}
                            min={0}
                            max={2}
                            step={0.1}
                          />
                          <Input
                            type="number"
                            value={reasoningConfig.temperature}
                            onChange={e => handleConfigChange('reasoningConfig.temperature', Number(e.target.value))}
                            className="w-20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reasoning Max Tokens</Label>
                        <Input
                          type="number"
                          value={reasoningConfig.max_tokens}
                          onChange={e => handleConfigChange('reasoningConfig.max_tokens', Number(e.target.value))}
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
              <div className="flex justify-end p-4">
                <Button variant="outline" onClick={handleAddFeature}>
                  Thêm tính năng
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {features.map((feature) => (
                  <Card
                    key={feature.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEditFeature(feature)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{feature.icon}</span>
                          <CardTitle>{feature.name}</CardTitle>
                        </div>
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
          <DialogContent className="sm:max-w-[1000px] h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFeature ? "Chỉnh sửa tính năng" : "Thêm tính năng mới"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
              <Button type="submit" onClick={() => handleSaveFeature(editingFeature!)}>
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SettingsPage; 