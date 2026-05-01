export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export interface UserProfile {
  email: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  moodId: string;
  attachments: string[]; // Base64 or IDs
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
