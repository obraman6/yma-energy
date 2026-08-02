/**
 * API Client Utility with mandatory Accept-Language header forwarding and localized error handling
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const currentLanguage = localStorage.getItem('yma_language') || 'sw';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': currentLanguage === 'sw' ? 'sw, en;q=0.8' : 'en, sw;q=0.8',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    const message =
      errorData.message ||
      (currentLanguage === 'sw'
        ? `Hitilafu ya Server (${response.status})`
        : `Server Error (${response.status})`);

    throw new Error(message);
  }

  return response.json();
}
