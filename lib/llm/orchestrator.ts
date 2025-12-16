import type { LLMAdapter, LLMContext, LLMResponse, CharacterType, PreviousTarget } from './types';
import { MockLLMAdapter } from './mock';
import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';
import { GPTAdapter } from './gpt';

interface DebateMessage {
  character: CharacterType;
  content: string;
  score: number;
  risks: string[];
  sources: string[];
  targetPrice?: number;
  targetDate?: string;
  priceRationale?: string;
}

function getAdapter(character: CharacterType): LLMAdapter {
  // Check if real API keys are available
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;

  switch (character) {
    case 'claude':
      return hasAnthropic ? new ClaudeAdapter() : new MockLLMAdapter('claude');
    case 'gemini':
      return hasGoogle ? new GeminiAdapter() : new MockLLMAdapter('gemini');
    case 'gpt':
      return hasOpenAI ? new GPTAdapter() : new MockLLMAdapter('gpt');
    default:
      return new MockLLMAdapter(character);
  }
}

export class DebateOrchestrator {
  private previousMessages: DebateMessage[] = [];
  private previousTargets: PreviousTarget[] = [];
  private currentPrice: number = 70000;

  setCurrentPrice(price: number) {
    this.currentPrice = price;
  }

  async generateRound(
    symbol: string,
    symbolName: string,
    round: number
  ): Promise<DebateMessage[]> {
    const characters: CharacterType[] = ['claude', 'gemini', 'gpt'];
    const messages: DebateMessage[] = [];
    const newTargets: PreviousTarget[] = [];

    for (const character of characters) {
      const adapter = getAdapter(character);
      const context: LLMContext = {
        symbol,
        symbolName,
        round,
        currentPrice: this.currentPrice,
        previousMessages: [...this.previousMessages, ...messages].map(m => ({
          character: m.character,
          content: m.content,
          targetPrice: m.targetPrice,
          targetDate: m.targetDate,
        })),
        previousTargets: this.previousTargets,
      };

      try {
        const response = await adapter.generateStructured(context);
        const message: DebateMessage = {
          character,
          content: response.content,
          score: response.score,
          risks: response.risks,
          sources: response.sources,
          targetPrice: response.targetPrice,
          targetDate: response.targetDate,
          priceRationale: response.priceRationale,
        };
        messages.push(message);
        
        // Track target for next round
        if (response.targetPrice && response.targetDate) {
          newTargets.push({
            character,
            targetPrice: response.targetPrice,
            targetDate: response.targetDate,
          });
        }
      } catch (error) {
        console.error(`Error generating response for ${character}:`, error);
        // Fallback to mock if real API fails
        const mockAdapter = new MockLLMAdapter(character);
        const response = await mockAdapter.generateStructured(context);
        const message: DebateMessage = {
          character,
          content: response.content,
          score: response.score,
          risks: response.risks,
          sources: response.sources,
          targetPrice: response.targetPrice,
          targetDate: response.targetDate,
          priceRationale: response.priceRationale,
        };
        messages.push(message);
        
        if (response.targetPrice && response.targetDate) {
          newTargets.push({
            character,
            targetPrice: response.targetPrice,
            targetDate: response.targetDate,
          });
        }
      }
    }

    this.previousMessages.push(...messages);
    
    // Update targets - keep only latest target per character
    for (const newTarget of newTargets) {
      const existingIndex = this.previousTargets.findIndex(t => t.character === newTarget.character);
      if (existingIndex >= 0) {
        this.previousTargets[existingIndex] = newTarget;
      } else {
        this.previousTargets.push(newTarget);
      }
    }
    
    return messages;
  }

  getMessages(): DebateMessage[] {
    return this.previousMessages;
  }

  getTargets(): PreviousTarget[] {
    return this.previousTargets;
  }

  reset(): void {
    this.previousMessages = [];
    this.previousTargets = [];
  }
}

// Session management for multiple debates
const sessions = new Map<string, DebateOrchestrator>();

export function getOrCreateSession(sessionId: string): DebateOrchestrator {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new DebateOrchestrator());
  }
  return sessions.get(sessionId)!;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
