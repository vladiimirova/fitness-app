export type LoginFormData = {
  email: string;
  password: string;
};

export type ProfileFormData = {
  name: string;
  age: string;
  weight: string;
  targetWeight: string;
  height: string;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: string;
  experienceLevel: string;
  avatarUrl?: string | null;
};

export type UserProfile = {
  id: number;
  userId: number;
  name: string;
  age: number;
  weight: number;
  targetWeight?: number | null;
  height: number;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: number;
  experienceLevel: string;
  avatarUrl?: string | null;
};

export type ProfilePayload = {
  name: string;
  age: number;
  weight: number;
  targetWeight?: number | null;
  height: number;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: number;
  experienceLevel: string;
  avatarUrl?: string | null;
};

export type ProgressEntry = {
  id: string;
  date: string;
  weight: number;
  waist: number;
  steps: number;
  completedWorkouts: number;
  energy: number;
  sleepHours: number;
  mood: number;
  followedNutrition: boolean;
  completedTraining: boolean;
  notes: string;
};

export type ProgressPayload = Omit<ProgressEntry, "id">;
