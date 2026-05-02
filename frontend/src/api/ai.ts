const API_URL = "http://localhost:3000";

async function requestAiProgram(token: string, method: "GET" | "POST") {
  const cacheBuster = Date.now();
  let response: Response;

  try {
    response = await fetch(`${API_URL}/ai/program/me?t=${cacheBuster}`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("Backend недоступний на localhost:3000");
  }

  if (!response.ok) {
    let message = `Помилка AI генерації програми (${response.status})`;

    try {
      const data = await response.json();
      if (typeof data?.message === "string") {
        message = data.message;
      } else if (Array.isArray(data?.message) && data.message.length) {
        message = String(data.message[0]);
      }
    } catch {
      try {
        const text = await response.text();
        if (text.trim()) {
          message = text.trim();
        }
      } catch {
        // keep status-based message
      }
    }

    throw new Error(message);
  }

  return response.json();
}

export function getMyAiProgram(token: string) {
  return requestAiProgram(token, "GET");
}

export function generateMyAiProgram(token: string) {
  return requestAiProgram(token, "POST");
}

export async function sendAiChatMessage(
  token: string,
  message: string,
  history: Array<{ role: "user" | "ai"; text: string }>,
) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/ai/chat/me`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });
  } catch {
    throw new Error("Backend недоступний на localhost:3000");
  }

  if (!response.ok) {
    let errorMessage = `Помилка AI чату (${response.status})`;

    try {
      const data = await response.json();
      if (typeof data?.message === "string") {
        errorMessage = data.message;
      } else if (Array.isArray(data?.message) && data.message.length) {
        errorMessage = String(data.message[0]);
      }
    } catch {
      // keep fallback
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<{ answer: string }>;
}
