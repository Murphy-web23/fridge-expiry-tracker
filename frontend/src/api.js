const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8008";
const DEFAULT_FAMILY_CODE = "demo-home";
const DEFAULT_MEMBER_NAME = "訪客";

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return response.json();
}

export const apiConfig = {
  apiBaseUrl: API_BASE_URL,
  familyCode: DEFAULT_FAMILY_CODE,
  memberName: DEFAULT_MEMBER_NAME,
};

export function getFamily() {
  return requestJson(`/families/${DEFAULT_FAMILY_CODE}`);
}

export function getMembers() {
  return requestJson(`/families/${DEFAULT_FAMILY_CODE}/members`);
}

export function getFoods() {
  return requestJson(`/families/${DEFAULT_FAMILY_CODE}/foods`);
}

export function createFood(food) {
  return requestJson(`/families/${DEFAULT_FAMILY_CODE}/foods`, {
    method: "POST",
    body: JSON.stringify({
      ...food,
      added_by: DEFAULT_MEMBER_NAME,
    }),
  });
}

export function markFoodUsed(foodId) {
  return requestJson(`/families/${DEFAULT_FAMILY_CODE}/foods/${foodId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "used",
      used_by: DEFAULT_MEMBER_NAME,
    }),
  });
}
