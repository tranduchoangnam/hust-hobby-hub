// Types for Prisma models
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: Date;
  image?: string | null;
  password?: string;
  hobbies?: string[]; // Added for music interests display in chat
  createdAt: Date;
  updatedAt: Date;
}

export interface Hobby {
  id: string;
  name: string;
}

export interface UserHobby {
  id: string;
  userId: string;
  hobbyId: string;
  user?: User;
  hobby?: Hobby;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date | string;
  read: boolean;
  senderId: string;
  recipientId: string;
  sender?: User;
  recipient?: User;
}

export interface LoveNote {
  id: string;
  question: string;
  senderAnswer: string | null;
  recipientAnswer: string | null;
  createdAt: Date | string;
  senderId: string;
  recipientId: string;
  sender: {
    id: string;
    name: string;
    image?: string | null;
  };
  recipient: {
    id: string;
    name: string;
    image?: string | null;
  };
}