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

export function getFamilies() {
  return requestJson("/families");
}

export function getFamily(familyCode = DEFAULT_FAMILY_CODE) {
  return requestJson(`/families/${familyCode}`);
}

export function getMembers(familyCode = DEFAULT_FAMILY_CODE) {
  return requestJson(`/families/${familyCode}/members`);
}

export function getFoods(familyCode = DEFAULT_FAMILY_CODE) {
  return requestJson(`/families/${familyCode}/foods`);
}

export function createFood(food, familyCode = DEFAULT_FAMILY_CODE, memberName = DEFAULT_MEMBER_NAME) {
  return requestJson(`/families/${familyCode}/foods`, {
    method: "POST",
    body: JSON.stringify({
      ...food,
      added_by: memberName,
    }),
  });
}

export function markFoodUsed(
  foodId,
  familyCode = DEFAULT_FAMILY_CODE,
  memberName = DEFAULT_MEMBER_NAME,
) {
  return requestJson(`/families/${familyCode}/foods/${foodId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "used",
      used_by: memberName,
    }),
  });
}

export function adjustFoodQuantity(
  foodId,
  delta,
  familyCode = DEFAULT_FAMILY_CODE,
  memberName = DEFAULT_MEMBER_NAME,
) {
  return requestJson(`/families/${familyCode}/foods/${foodId}/quantity`, {
    method: "PATCH",
    body: JSON.stringify({
      delta,
      updated_by: memberName,
    }),
  });
}
