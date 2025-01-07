import GPT3TokenizerImport from 'gpt3-tokenizer';


/** Estimate tokens for a given question */
const GPT3Tokenizer = typeof GPT3TokenizerImport === 'function'
  ? GPT3TokenizerImport
  : (GPT3TokenizerImport as any).default;

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });

export function estimateTokensForQuestion(text: string): number {
  try {
    // Handle empty or invalid input
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // Encode the text
    const encoded = tokenizer.encode(text);
    
    // Get the number of tokens
    return encoded.bpe.length;

  } catch (error) {
    console.error('Error estimating tokens:', error);
    // Fallback to a more conservative estimation if tokenizer fails
    return Math.ceil(text.length / 3);
  }
}