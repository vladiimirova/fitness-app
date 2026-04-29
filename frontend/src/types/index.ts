export type LoginFormData = {
  email: string;
  password: string;
};

export type ProfileFormData = {
  name: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: string;
  experienceLevel: string;
};

export type UserProfile = {
  id: number;
  userId: number;
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: number;
  experienceLevel: string;
};

export type ProfilePayload = {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: number;
  experienceLevel: string;
};
