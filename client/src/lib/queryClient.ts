
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { url: string; method: string; body?: unknown },
  methodOrData?: string | unknown,
  data?: unknown | undefined,
): Promise<Response> {
  // Manejar diferentes formatos de llamada
  let url: string;
  let method: string;
  let body: unknown | undefined;

  if (typeof urlOrOptions === 'string') {
    // Formato viejo: apiRequest(method, url, data)
    if (typeof methodOrData === 'string') {
      url = urlOrOptions;
      method = methodOrData;
      body = data;
    } 
    // Formato nuevo: apiRequest(url, { method, body })
    else {
      url = urlOrOptions;
      method = (methodOrData as { method: string })?.method || 'GET';
      body = (methodOrData as { body?: unknown })?.body;
    }
  } else {
    // Formato de objeto: apiRequest({ url, method, body })
    url = urlOrOptions.url;
    method = urlOrOptions.method;
    body = urlOrOptions.body;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
