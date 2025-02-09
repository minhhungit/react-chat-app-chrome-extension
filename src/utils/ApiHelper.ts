import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { db } from "@/utils/IndexedDBWrapper";

export class ApiHelper {
  private static async getProviderConfig(providerType: 'chat' | 'reasoning') {
    const providersConfig = await db.get('providersConfig');
    const provider = await db.get(`${providerType}Provider`);
    return providersConfig?.[provider]?.[`${providerType}Config`] || {};
  }

  private static createOpenAIInstance(config: any) {
    return new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.apiUrl || "",
      dangerouslyAllowBrowser: true
    });
  }

  static async chatComplete(messages: ChatCompletionMessageParam[], onStream?: (content: string) => void) {
    const config = await this.getProviderConfig('chat');
    const openai = this.createOpenAIInstance(config);

    const stream = await openai.chat.completions.create({
      model: config.model || "deepseek-chat",
      temperature: Number(config.temperature) || 0.9,
      top_p: Number(config.top_p) || 0.7,
      frequency_penalty: Number(config.frequency_penalty) || 0.7,
      presence_penalty: Number(config.presence_penalty) || 0.7,
      max_tokens: Number(config.max_tokens) || 4096,
      messages,
      stream: true
    });

    let accumulatedContent = '';
    let candidateContent = '';
    const minWordCount = 6; // Số từ tối thiểu để render

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      candidateContent += content;
      
      // Đếm số từ mới nhận được
      const wordCount = candidateContent.trim().split(/\s+/).filter(word => word.length > 0).length;

      // Chỉ cập nhật khi có đủ số từ
      if (wordCount >= minWordCount) {
        accumulatedContent += candidateContent;
        onStream?.(accumulatedContent);
        candidateContent = ""; // Reset nội dung
      }
    }

    // Cập nhật lần cuối nếu còn nội dung chưa được render
    accumulatedContent += candidateContent;
    onStream?.(accumulatedContent);

    return accumulatedContent;
  }

  static async createReasoning(history: ChatCompletionMessageParam[], onStream?: (content: string) => void) {
    const config = await this.getProviderConfig('reasoning');
    const openai = this.createOpenAIInstance(config);

    const stream = await openai.chat.completions.create({
      model: config.model,
      temperature: Number(config.temperature) || 0.9,
      top_p: Number(config.top_p) || 0.7,
      frequency_penalty: Number(config.frequency_penalty) || 0.7,
      presence_penalty: Number(config.presence_penalty) || 0.7,
      max_tokens: Number(config.max_tokens) ||  4096,
      messages: [
        {
          role: 'system',
          content: 'Chuyên gia lên kế hoạch, biện luận, suy luân, suy nghĩ giải quyết vấn đề.'
        },
        {
          role: 'user',
          content: `Dựa trên lịch sử giao tiếp giữa assistant và user bên dưới, hãy suy luận và lên kế hoạch chi tiết, chia nhỏ vấn đề để trả lời câu hỏi của user:\n---\n${history.filter(x=>x.role != 'system').map(x => `***${x.role}***: ${x.content}`).join('\n---\n')}`
        }
      ],
      stream: true
    });

    let isThinking = true;
    let thinkingContent = '';
    let isRemoveFirstThinkTag = false;
    let candidateContent = '';
    const minWordCount = 15;

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || "";
      if (!isRemoveFirstThinkTag && content.includes('<think>')) {
        content = content.replace('<think>', '');
      }

      if (isThinking) {

        if (!isRemoveFirstThinkTag && content.startsWith('<think>')) {
          content = content.replace('<think>', '');
          isRemoveFirstThinkTag = true;
        }

        if (content.includes('</think>')) {
          content = content.replace('</think>', '')
          isThinking = false;
        }

        candidateContent += content;
        const wordCount = candidateContent.trim().split(/\s+/).filter(word => word.length > 0).length;

        if (wordCount >= minWordCount) {
          thinkingContent += candidateContent;
          candidateContent = "";
          onStream?.(thinkingContent);
        }
      }

      if(isThinking == false){
        break;
      }
    }

    thinkingContent += candidateContent;
        
    onStream?.(thinkingContent);

    return thinkingContent;
  }

  static async generateSuggestQuestions(content: string): Promise<string[]> {
    const config = await this.getProviderConfig('chat');
    const openai = this.createOpenAIInstance(config);

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'Bạn sẽ giúp tạo các câu hỏi gợi ý với vai trò là người dùng dựa trên nội dung đoạn hội thoại giữa bạn và assistant. Hãy hỏi câu hỏi ngắn gọn, rõ ràng. Trả lời bằng format json ["question1", "question2", "question3"]'
        },
        {
          role: 'user',
          content: `Dưới đây là đoạn hội thoại giữa bạn và assistant, bạn sẽ hỏi assistant câu hỏi gì tiếp theo? (Lưu ý đừng lặp lại câu hỏi)\n${content}`
        }
      ],
      temperature: 1.3,
      max_tokens: 100
    });

    try {
      let content = response.choices[0].message.content || "[]"

      // Loại bỏ bất kỳ phần đánh dấu ``` và nội dung không cần thiết
      let jsonString = content.replace(/```[\s\S]*?\n|```/g, '').trim();

      // Phân tích chuỗi JSON thành mảng
      return JSON.parse(jsonString);      
    } catch (error) {
      console.error('Error parsing questions:', error);
      return [];
    }
  }
} 