import type { LLMAdapter, LLMContext, LLMResponse, CharacterType } from './types';

/**
 * Mock LLM Adapter - API 키가 없을 때 에러 반환
 * 더미 데이터를 반환하지 않고 명확한 에러 메시지를 제공합니다.
 */
export class MockLLMAdapter implements LLMAdapter {
  characterType: CharacterType;

  constructor(characterType: CharacterType) {
    this.characterType = characterType;
  }

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    // API 키가 없으면 에러 throw
    const errorMessages: Record<CharacterType, string> = {
      claude: 'ANTHROPIC_API_KEY 또는 OPENROUTER_API_KEY가 설정되지 않았습니다.',
      gemini: 'GOOGLE_AI_API_KEY 또는 OPENROUTER_API_KEY가 설정되지 않았습니다.',
      gpt: 'OPENAI_API_KEY 또는 OPENROUTER_API_KEY가 설정되지 않았습니다.',
    };
    
    throw new Error(
      `[${this.characterType.toUpperCase()}] AI API 키가 설정되지 않았습니다. ` +
      errorMessages[this.characterType] + ' ' +
      '환경변수를 확인해주세요.'
    );
  }
}
