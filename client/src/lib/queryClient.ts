import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API Response interface for consistent backend responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData: ApiResponse = await res.json();
      throw new Error(errorData.error || `${res.status}: ${res.statusText}`);
    } catch (parseError) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  extraHeaders?: Record<string, string>
): Promise<any> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add authorization header if token exists
  const token = localStorage.getItem('ic_pasta_admin_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add any extra headers
  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Handle the new API response format
  const responseData: ApiResponse = await res.json();
  
  // For backward compatibility, return just the data if it exists
  return responseData.data !== undefined ? responseData.data : responseData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add authorization header if token exists
    const token = localStorage.getItem('ic_pasta_admin_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Handle the new API response format
    const responseData: ApiResponse = await res.json();
    
    // For backward compatibility, return just the data if it exists
    return responseData.data !== undefined ? responseData.data : responseData;
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
