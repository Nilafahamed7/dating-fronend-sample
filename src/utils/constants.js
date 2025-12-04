export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const GENDERS = ['male', 'female', 'other'];

export const INTERESTS = [
  'Travel', 'Music', 'Food', 'Sports', 'Movies', 'Reading', 'Art', 'Photography',
  'Dancing', 'Cooking', 'Fitness', 'Yoga', 'Hiking', 'Gaming', 'Technology',
  'Fashion', 'Beauty', 'Pets', 'Nature', 'Adventure', 'Writing',
  'Meditation', 'Shopping', 'Comedy', 'Theater', 'Wine', 'Coffee'
];

export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Other'];

export const RELATIONSHIP_GOALS = [
  'Dating',
  'Long-term Relationship',
  'Marriage',
  'Friendship',
  'Something Casual',
  'Not Sure Yet'
];

export const MAX_PHOTOS = 6;
export const MAX_BIO_LENGTH = 500;
export const MAX_LOOKING_FOR_LENGTH = 255;

// Agora Configuration
export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

