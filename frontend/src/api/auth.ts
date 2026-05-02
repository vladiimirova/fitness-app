export async function loginUser(email: string, password: string) {
  const response = await fetch("http://localhost:3000/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(data, "Помилка входу"));
  }

  return data;
}

export async function registerUser(email: string, password: string) {
  const response = await fetch("http://localhost:3000/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(data, "Помилка реєстрації"));
  }

  return data;
}

export async function getMe(token: string) {
  const response = await fetch("http://localhost:3000/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

function getAuthErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const candidate = data as { message?: unknown };

    if (typeof candidate.message === "string") {
      return candidate.message;
    }

    if (Array.isArray(candidate.message) && candidate.message.length) {
      return String(candidate.message[0]);
    }
  }

  return fallback;
}
