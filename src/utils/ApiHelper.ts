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
      model: config.model || "gpt-4o",
      temperature: Number(config.temperature) || 0.7,
      top_p: Number(config.top_p) || 1,
      frequency_penalty: Number(config.frequency_penalty) || 0,
      presence_penalty: Number(config.presence_penalty) || 0,
      max_tokens: Number(config.max_tokens) || 1000,
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
    });

    let thinkingContent = '';
    let candidateContent = '';
    const minWordCount = 6;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      candidateContent += content;
      
      const wordCount = candidateContent.trim().split(/\s+/).filter(word => word.length > 0).length;

      if (wordCount >= minWordCount) {
        thinkingContent += candidateContent;
        onStream?.(thinkingContent);
        candidateContent = "";
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

    try {
      return JSON.parse(response.choices[0].message.content || "[]");
    } catch (error) {
      console.error('Error parsing questions:', error);
      return [];
    }
  }
} 