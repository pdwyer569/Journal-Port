import { describe, it, expect } from 'vitest';
import { getMoodId } from './moodId';

describe('getMoodId', () => {
  it('identifies positive sentiment', () => {
    expect(getMoodId('I had a great day today!')).toEqual({
      emoji: '✨', id: 'positive', color: 'var(--color-mood-positive)'
    });
    expect(getMoodId('feeling AMAZING')).toEqual({
      emoji: '✨', id: 'positive', color: 'var(--color-mood-positive)'
    });
  });

  it('identifies negative sentiment', () => {
    expect(getMoodId('That was a terrible experience.')).toEqual({
      emoji: '🌧️', id: 'negative', color: 'var(--color-mood-negative)'
    });
    expect(getMoodId('I HATE this')).toEqual({
      emoji: '🌧️', id: 'negative', color: 'var(--color-mood-negative)'
    });
  });

  it('identifies reflective sentiment', () => {
    expect(getMoodId('I wonder how things work.')).toEqual({
      emoji: '🤔', id: 'reflective', color: 'var(--color-mood-reflective)'
    });
    expect(getMoodId('Confused about this...')).toEqual({
      emoji: '🤔', id: 'reflective', color: 'var(--color-mood-reflective)'
    });
  });

  it('falls back to neutral sentiment', () => {
    expect(getMoodId('Went to the store.')).toEqual({
      emoji: '📓', id: 'neutral', color: 'var(--color-mood-neutral)'
    });
    expect(getMoodId('')).toEqual({
      emoji: '📓', id: 'neutral', color: 'var(--color-mood-neutral)'
    });
  });

  it('handles mixed sentiments (uses first match in logic)', () => {
    // Current logic checks positive -> negative -> reflective
    // So if "great" and "sad" are in the text, it will match positive first.
    expect(getMoodId('I am sad but also great')).toEqual({
      emoji: '✨', id: 'positive', color: 'var(--color-mood-positive)'
    });
  });

  it('handles capitalization and punctuation', () => {
    expect(getMoodId('gOoD!!!')).toEqual({
      emoji: '✨', id: 'positive', color: 'var(--color-mood-positive)'
    });
  });
});
