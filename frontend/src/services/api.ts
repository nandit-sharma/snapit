
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
    throw new Error(
      'Backend URL is not configured. Check your frontend .env file.'
    );
  }

  const {
    requireAuth = true,
    headers,
    ...requestOptions
  } = options;

  const requestHeaders = new Headers(headers);

  // Attach Supabase access token
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

  // Detect FormData in React Native
  const isFormData =
    requestOptions.body instanceof FormData ||
    (requestOptions.body !== null &&
      typeof requestOptions.body === 'object' &&
      '_parts' in (requestOptions.body as any));

  if (isFormData) {
    // Let fetch set the multipart boundary automatically
    requestHeaders.delete('Content-Type');
  } else if (requestOptions.body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Build request URL
  const requestUrl = `${API_URL.replace(/\/$/, '')}${endpoint}`;

  // Temporary debugging logs
  console.log('API REQUEST:', {
    url: requestUrl,
    method: requestOptions.method || 'GET',
    isFormData,
  });

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...requestOptions,
      headers: requestHeaders,
    });
  } catch (err: any) {
    console.error('API NETWORK ERROR:', err);

    throw new Error(
      `Cannot reach backend at ${API_URL}. Make sure FastAPI is running on 0.0.0.0:8000 and your phone is connected to the same Wi-Fi network.`
    );
  }

  console.log('API RESPONSE:', response.status, requestUrl);

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      responseData?.detail ||
      responseData?.message ||
      `Request failed with status ${response.status}`;

    console.error('API ERROR:', {
      status: response.status,
      url: requestUrl,
      message,
    });

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
