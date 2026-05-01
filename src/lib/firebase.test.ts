import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('../../firebase-applet-config.json', () => ({
  default: {
    firestoreDatabaseId: 'default'
  }
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn()
}));

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    enableIndexedDbPersistence: vi.fn(),
  };
});

describe('Firebase Persistence Config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls enableIndexedDbPersistence on initialization', async () => {
    (firestore.enableIndexedDbPersistence as any).mockResolvedValue(true);
    
    await import('./firebase');
    
    expect(firestore.enableIndexedDbPersistence).toHaveBeenCalled();
  });

  it('handles failed-precondition error from persistence without crashing', async () => {
    const error = new Error('Multiple tabs') as any;
    error.code = 'failed-precondition';
    (firestore.enableIndexedDbPersistence as any).mockRejectedValue(error);
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await import('./firebase');
    // Wait for promise rejection to be caught
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleSpy).toHaveBeenCalledWith('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    consoleSpy.mockRestore();
  });

  it('handles unimplemented error from persistence without crashing', async () => {
    const error = new Error('Browser not supported') as any;
    error.code = 'unimplemented';
    (firestore.enableIndexedDbPersistence as any).mockRejectedValue(error);
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await import('./firebase');
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleSpy).toHaveBeenCalledWith('The current browser does not support all of the features required to enable persistence');
    consoleSpy.mockRestore();
  });
});
