import type { ProfilePayload, UserProfile } from "../types";

const API_URL = "http://localhost:3000";

export async function getMyProfile(token: string) {
  const response = await fetch(`${API_URL}/profile/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Помилка отримання профілю");
  }

  return response.json();
}

export async function createProfile(
  token: string,
  payload: ProfilePayload,
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/profile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await getProfileErrorMessage(response, "Помилка створення профілю"),
    );
  }

  return response.json();
}

export async function updateMyProfile(
  token: string,
  payload: ProfilePayload,
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/profile/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await getProfileErrorMessage(response, "Помилка оновлення профілю"),
    );
  }

  return response.json();
}

async function getProfileErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") {
      return data.message;
    }
    if (Array.isArray(data?.message) && data.message.length) {
      return String(data.message[0]);
    }
  } catch {
    // keep fallback
  }

  return `${fallback} (${response.status})`;
}
