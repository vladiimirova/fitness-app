import type { ProfilePayload, UserProfile } from '../types';

const API_URL = 'http://localhost:3000';

export async function getMyProfile(token: string) {
  const response = await fetch(`${API_URL}/profile/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Помилка отримання профілю');
  }

  return response.json();
}

export async function createProfile(token: string, payload: ProfilePayload): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Помилка створення профілю');
  }

  return response.json();
}

export async function updateMyProfile(
  token: string,
  payload: ProfilePayload,
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/profile/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Помилка оновлення профілю');
  }

  return response.json();
}
