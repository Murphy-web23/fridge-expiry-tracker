import type { ApiFood, Family, FoodCreatePayload, FoodUpdatePayload, HealthInfo, Member } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8008";
const DEFAULT_FAMILY_CODE = "demo-home";
const DEFAULT_MEMBER_NAME = "訪客";

async function request(path: string, options: RequestInit = {}): Promise<Response> {
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

  return response;
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await request(path, options);
  return response.json() as Promise<T>;
}

export const apiConfig = {
  apiBaseUrl: API_BASE_URL,
  familyCode: DEFAULT_FAMILY_CODE,
  memberName: DEFAULT_MEMBER_NAME,
};

export function getHealth(): Promise<HealthInfo> {
  return requestJson<HealthInfo>("/health");
}

export function getFamilies(): Promise<Family[]> {
  return requestJson<Family[]>("/families");
}

export function getFamily(familyCode = DEFAULT_FAMILY_CODE): Promise<Family> {
  return requestJson<Family>(`/families/${familyCode}`);
}

export function getMembers(familyCode = DEFAULT_FAMILY_CODE): Promise<Member[]> {
  return requestJson<Member[]>(`/families/${familyCode}/members`);
}

export function getFoods(familyCode = DEFAULT_FAMILY_CODE): Promise<ApiFood[]> {
  return requestJson<ApiFood[]>(`/families/${familyCode}/foods`);
}

export function createFood(
  food: FoodCreatePayload,
  familyCode = DEFAULT_FAMILY_CODE,
  memberName = DEFAULT_MEMBER_NAME,
): Promise<ApiFood> {
  return requestJson<ApiFood>(`/families/${familyCode}/foods`, {
    method: "POST",
    body: JSON.stringify({ ...food, added_by: memberName }),
  });
}

export function updateFood(
  foodId: number,
  food: FoodUpdatePayload,
  familyCode = DEFAULT_FAMILY_CODE,
  memberName = DEFAULT_MEMBER_NAME,
): Promise<ApiFood> {
  return requestJson<ApiFood>(`/families/${familyCode}/foods/${foodId}`, {
    method: "PUT",
    body: JSON.stringify({ ...food, updated_by: memberName }),
  });
}

export async function deleteFood(foodId: number, familyCode = DEFAULT_FAMILY_CODE): Promise<void> {
  await request(`/families/${familyCode}/foods/${foodId}`, { method: "DELETE" });
}

export function markFoodUsed(
  foodId: number,
  familyCode = DEFAULT_FAMILY_CODE,
  memberName = DEFAULT_MEMBER_NAME,
): Promise<ApiFood> {
  return requestJson<ApiFood>(`/families/${familyCode}/foods/${foodId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "used", used_by: memberName }),
  });
}

export function adjustFoodQuantity(
  foodId: number,
  delta: -1 | 1,
  familyCode = DEFAULT_FAMILY_CODE,
  memberName = DEFAULT_MEMBER_NAME,
): Promise<ApiFood> {
  return requestJson<ApiFood>(`/families/${familyCode}/foods/${foodId}/quantity`, {
    method: "PATCH",
    body: JSON.stringify({ delta, updated_by: memberName }),
  });
}
