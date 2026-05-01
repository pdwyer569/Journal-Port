export interface MoodResult {
  emoji: string;
  id: string;
  color: string;
}

export function getMoodId(text: string): MoodResult {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/happy|joy|excited|great|amazing|love|good|fantastic/)) {
    return { emoji: '✨', id: 'positive', color: 'var(--color-mood-positive)' };
  }
  if (lowerText.match(/sad|angry|bad|terrible|awful|hate|upset|frustrated/)) {
    return { emoji: '🌧️', id: 'negative', color: 'var(--color-mood-negative)' };
  }
  if (lowerText.match(/think|wonder|maybe|perhaps|interesting|confused|reflect/)) {
    return { emoji: '🤔', id: 'reflective', color: 'var(--color-mood-reflective)' };
  }
  
  return { emoji: '📓', id: 'neutral', color: 'var(--color-mood-neutral)' };
}
