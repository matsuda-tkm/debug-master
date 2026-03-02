import { getStoredAuthHeader } from './authStorage';

type FetchInput = RequestInfo | URL;

interface ApiFetchOptions extends RequestInit {
  includeAuth?: boolean;
  includeJsonContentType?: boolean;
}

function buildHeaders(
  currentHeaders: HeadersInit | undefined,
  includeAuth: boolean,
  includeJsonContentType: boolean
): Headers {
  const headers = new Headers(currentHeaders);

  if (includeJsonContentType && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (includeAuth && !headers.has('Authorization')) {
    const authHeader = getStoredAuthHeader();
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
  }

  return headers;
}

export async function apiFetch(
  input: FetchInput,
  {
    includeAuth = true,
    includeJsonContentType = false,
    ...init
  }: ApiFetchOptions = {}
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: buildHeaders(init.headers, includeAuth, includeJsonContentType),
  });
}
