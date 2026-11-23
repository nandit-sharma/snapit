import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL is not configured.');
}

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error('Backend URL is not configured. Check your frontend .env file.');
  }

  const { requireAuth = true, headers, ...requestOptions } = options;

  const requestHeaders = new Headers(headers);

  // Attach the current Supabase access token.
  if (requireAuth) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    const token = data.session?.access_token;

    if (!token) {
      throw new Error('Session expired. Please log in again.');
    }

    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // Detect FormData in both standard JS and React Native
  const isFormData =
    requestOptions.body instanceof FormData ||
    (requestOptions.body !== null &&
      typeof requestOptions.body === 'object' &&
      '_parts' in (requestOptions.body as any));

  if (!isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  } else {
    // If multipart/form-data was set manually, remove it so fetch can set the boundary
    requestHeaders.delete('Content-Type');
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_URL.replace(/\/$/, '')}${endpoint}`,
      {
        ...requestOptions,
        headers: requestHeaders,
      }
    );
  } catch (err: any) {
    throw new Error(
      `Cannot reach backend at ${API_URL}. Make sure FastAPI is running on 0.0.0.0:8000 and the phone is on the same Wi-Fi network.`
    );
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      responseData?.detail ||
      responseData?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return responseData as T;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, requireAuth = true) =>
    apiRequest<T>(endpoint, {
      method: 'GET',
      requireAuth,
    }),

  post: <T>(endpoint: string, body: unknown, requireAuth = true) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      requireAuth,
    }),

  patch: <T>(endpoint: string, body: unknown, requireAuth = true) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      requireAuth,
    }),
};
