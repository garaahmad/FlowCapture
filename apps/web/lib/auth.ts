import { useQuery } from "@tanstack/react-query";
import type {
  AuthSessionDto,
  MessageResponse,
  UpdateProfileInput,
  UserProfileDto,
} from "@/lib/contracts";
import { apiData, apiFetch, jsonBody } from "@/lib/api";

export const currentUserKey = ["current-user"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: () => apiData<UserProfileDto>("/me"),
    staleTime: 5 * 60 * 1000,
  });
}

export function register(input: { email: string; password: string; displayName: string }) {
  return apiData<AuthSessionDto>("/auth/register", { method: "POST", body: jsonBody(input) });
}

export function login(input: { email: string; password: string }) {
  return apiData<AuthSessionDto>("/auth/login", { method: "POST", body: jsonBody(input) });
}

export function logout() {
  return apiFetch<MessageResponse>("/auth/logout", { method: "POST" });
}

export function updateProfile(input: UpdateProfileInput) {
  return apiData<UserProfileDto>("/me", { method: "PATCH", body: jsonBody(input) });
}
