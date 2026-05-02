import type { ProgressEntry, ProgressPayload } from "../types";

const API_URL = "http://localhost:3000";

export async function getMyProgressEntries(
  token: string,
): Promise<ProgressEntry[]> {
  const response = await fetch(`${API_URL}/progress/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getProgressErrorMessage(response));
  }

  return response.json();
}

export async function createProgressEntry(
  token: string,
  payload: ProgressPayload,
): Promise<ProgressEntry> {
  const response = await fetch(`${API_URL}/progress/me`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getProgressErrorMessage(response));
  }

  return response.json();
}

async function getProgressErrorMessage(response: Response) {
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

  return `Помилка збереження прогресу (${response.status})`;
}
