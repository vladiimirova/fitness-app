const API_URL = 'http://localhost:3000';

export async function generateTrainingPlan(token: string) {
  const response = await fetch(`${API_URL}/training/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Помилка генерації плану тренувань');
  }

  return response.json();
}

export async function getMyFullTrainingPlan(token: string) {
  const response = await fetch(`${API_URL}/training/my/full`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Помилка отримання повного плану тренувань');
  }

  return response.json();
}