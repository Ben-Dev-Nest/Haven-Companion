// Crisis keywords and phrases in English and Swahili
const CRISIS_KEYWORDS = [
  // Suicide-related (English)
  'suicide', 'kill myself', 'end my life', 'want to die', 'no reason to live',
  'better off dead', 'suicidal', 'end it all', 'take my life',
  
  // Suicide-related (Swahili)
  'kujiua', 'nataka kufa', 'sijui kwa nini naishi', 'maisha hayana maana',
  
  // Self-harm (English)
  'self harm', 'cut myself', 'hurt myself', 'self-harm', 'cutting',
  
  // Self-harm (Swahili)
  'kujijeruhi', 'kujikata', 'kujidhuru',
  
  // Severe distress (English)
  'can\'t go on', 'give up', 'hopeless', 'no way out', 'trapped',
  
  // Severe distress (Swahili)
  'sina matumaini', 'nimechoka', 'sitaki tena', 'nimeshindwa'
];

const CRISIS_PHRASES = [
  'i want to kill',
  'i want to die',
  'thinking about suicide',
  'plan to kill myself',
  'everyone would be better',
  'world without me',
  'say goodbye',
  'can\'t take it anymore',
  'nataka kufa',
  'nafikiri kujiua',
  'watu wangenifaa',
  'siwezi tena'
];

export const detectCrisisContent = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Check for direct keyword matches
  const hasKeyword = CRISIS_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  // Check for phrase patterns
  const hasPhrase = CRISIS_PHRASES.some(phrase => 
    lowerMessage.includes(phrase.toLowerCase())
  );
  
  return hasKeyword || hasPhrase;
};
