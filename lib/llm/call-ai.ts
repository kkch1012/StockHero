/**
 * 범용 AI 호출 유틸리티
 * OpenRouter 대신 각 AI SDK를 직접 호출합니다.
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

type CharacterType = 'claude' | 'gemini' | 'gpt';

interface CallAIOptions {
  maxTokens?: number;    // default: 2048
  temperature?: number;  // default: 0.7
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: CallAIOptions
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens ?? 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.type === 'text' ? textContent.text : '';
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: CallAIOptions
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    },
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

async function callGPT(
  systemPrompt: string,
  userPrompt: string,
  options?: CallAIOptions
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: options?.maxTokens ?? 2048,
    temperature: options?.temperature ?? 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * 범용 AI 호출 함수
 * 각 AI의 SDK를 직접 호출하여 텍스트 응답을 반환합니다.
 */
export async function callAI(
  character: CharacterType,
  systemPrompt: string,
  userPrompt: string,
  options?: CallAIOptions
): Promise<string> {
  switch (character) {
    case 'claude':
      return callClaude(systemPrompt, userPrompt, options);
    case 'gemini':
      return callGemini(systemPrompt, userPrompt, options);
    case 'gpt':
      return callGPT(systemPrompt, userPrompt, options);
  }
}

/**
 * 채팅 형식 AI 호출 (멀티턴 대화 지원)
 * consultation/chat 등에서 사용
 */
export async function chatAI(
  character: CharacterType,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: CallAIOptions
): Promise<string> {
  switch (character) {
    case 'claude': {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens ?? 2048,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      const textContent = response.content.find(c => c.type === 'text');
      return textContent?.type === 'text' ? textContent.text : '';
    }
    case 'gemini': {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 2048,
          temperature: options?.temperature ?? 0.7,
        },
      });
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));
      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text();
    }
    case 'gpt': {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
      });
      return response.choices[0]?.message?.content || '';
    }
  }
}
