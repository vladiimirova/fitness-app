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