import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPromptWithHoldings, AI_PERSONAS } from '@/lib/ai-personas';
import type { CharacterType } from '@/lib/llm/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Holding {
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface ChatRequest {
  characterType: CharacterType;
  messages: ChatMessage[];
  holdings?: Holding[];
}

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

// 대화 품질 향상을 위한 메타 프롬프트
function buildConversationContext(messages: ChatMessage[]): string {
  if (messages.length <= 1) return '';
  
  // 최근 대화 요약 (마지막 메시지 제외)
  const recentMessages = messages.slice(0, -1);
  const topics: string[] = [];
  const stocksMentioned: string[] = [];
  
  recentMessages.forEach(m => {
    // 종목명 추출 (한글 주식명 패턴)
    const stockPattern = /([가-힣]+(?:전자|하이닉스|바이오|에너지|금융|지주|SDI|화학|차|카오|NAVER|네이버))/g;
    const matches = m.content.match(stockPattern);
    if (matches) {
      stocksMentioned.push(...matches.filter(s => !stocksMentioned.includes(s)));
    }
  });
  
  if (stocksMentioned.length > 0) {
    topics.push(`언급된 종목: ${stocksMentioned.join(', ')}`);
  }
  
  return topics.length > 0 
    ? `\n[이전 대화 맥락: ${topics.join(' | ')}]\n` 
    : '';
}

async function chatWithClaude(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  try {
    const contextHint = buildConversationContext(messages);
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048, // 더 긴 응답 허용
      system: systemPrompt + contextHint,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

async function chatWithGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  try {
    const contextHint = buildConversationContext(messages);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro', // 더 강력한 모델 사용
      systemInstruction: systemPrompt + contextHint,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    // Build conversation history
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to flash model if pro fails
    try {
      const fallbackModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));
      const chat = fallbackModel.startChat({ history });
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      return result.response.text();
    } catch (fallbackError) {
      console.error('Gemini fallback also failed:', fallbackError);
      throw error;
    }
  }
}

async function chatWithGPT(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  try {
    const contextHint = buildConversationContext(messages);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 더 강력한 모델 사용
      messages: [
        { role: 'system', content: systemPrompt + contextHint },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 2048,
      temperature: 0.7,
      presence_penalty: 0.3, // 반복 방지
      frequency_penalty: 0.3, // 다양성 증가
    });

    return response.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('GPT API error:', error);
    // Fallback to gpt-4o-mini if gpt-4o fails
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });
      return fallbackResponse.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
    } catch (fallbackError) {
      console.error('GPT fallback also failed:', fallbackError);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { characterType, messages, holdings } = body;

    if (!characterType || !messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Get the system prompt with holdings info and current market context
    const systemPrompt = getSystemPromptWithHoldings(characterType, holdings);
    
    // 인사말 메시지는 제외하고 실제 대화만 전달
    const greeting = AI_PERSONAS[characterType].greeting;
    const conversationMessages = messages.filter(m => {
      // 인사말과 완전히 동일한 메시지만 제외
      if (m.role === 'assistant' && m.content === greeting) {
        return false;
      }
      return true;
    });

    // 대화 기록이 없으면 (첫 질문만 있으면) 그대로 진행
    if (conversationMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid messages to process' },
        { status: 400 }
      );
    }

    let responseContent: string;

    switch (characterType) {
      case 'claude':
        responseContent = await chatWithClaude(systemPrompt, conversationMessages);
        break;
      case 'gemini':
        responseContent = await chatWithGemini(systemPrompt, conversationMessages);
        break;
      case 'gpt':
        responseContent = await chatWithGPT(systemPrompt, conversationMessages);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown character type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        content: responseContent,
        characterType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Consultation chat error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
