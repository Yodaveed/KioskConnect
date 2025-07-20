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
  console.log(`API Request: ${method.toUpperCase()} ${url}`, data);
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Admin authentication uses cookies, not Bearer tokens
  // Token is stored in localStorage but sent via cookies automatically
  
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

  console.log(`API Response: ${method.toUpperCase()} ${url}`, res.status, res.ok);

  await throwIfResNotOk(res);
  
  // Handle both direct responses and API wrapper format
  const responseData = await res.json();
  console.log(`API Success: ${method.toUpperCase()} ${url}`, responseData);
  
  // Check if it's wrapped in success format
  if (responseData.success !== undefined || responseData.data !== undefined) {
    return responseData.data !== undefined ? responseData.data : responseData;
  }
  
  // Return direct response (like { user, token })
  return responseData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Admin authentication uses cookies, not Bearer tokens
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Handle both direct responses and API wrapper format
    const responseData = await res.json();
    
    // Check if it's wrapped in success format
    if (responseData.success !== undefined || responseData.data !== undefined) {
      return responseData.data !== undefined ? responseData.data : responseData;
    }
    
    // Return direct response (like { user, token })
    return responseData;
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
