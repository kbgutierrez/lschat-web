
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  token?: string;
}

const middleware = {
  addAuthHeader: (headers: HeadersInit = {}) => {
    const session = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;
    if (session) {
      const { token } = JSON.parse(session);
      if (token) {
        return { ...headers, 'Authorization': `Bearer ${token}` };
      }
    }
    return headers;
  }
};


export async function fetchAPI<T = any>(
  endpoint: string, 
  options: RequestInit = {},
  useAuth = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(useAuth ? middleware.addAuthHeader(options.headers) : {})
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    // Simple response logging
    console.log(`${options.method || 'GET'} ${endpoint}: ${response.status} ${response.ok ? '✓' : '✗'}`);
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error(`Error ${endpoint}:`, error);
    throw error;
  }
}

export const authAPI = {
  login: async (username: string, password: string, fcm_token?: string): Promise<LoginResponse> => {
    console.log('Login attempt for:', username, 'with FCM token:', fcm_token ? '✓ Provided' : '✗ Missing');
    
    const requestBody = fcm_token 
      ? { username, password, fcm_token } 
      : { username, password };
    
    const response = await fetchAPI<LoginResponse>('/api/userLogin', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    console.log('Login response processed:', {
      success: response.success,
      hasToken: !!response.token,
      user: response.user ? {
        id: response.user.id,
        username: response.user.username,
        name: `${response.user.firstName} ${response.user.lastName}`
      } : null
    });
    
    return response;
  },
  
  register: (userData: any): Promise<any> => {
    return fetchAPI('/api/userRegister', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
};

// User-related API calls
export const userAPI = {
  getProfile: (): Promise<any> => {
    return fetchAPI('/api/userProfile', {}, true); // true enables auth header
  },
  
  updateProfile: (profileData: any): Promise<any> => {
    return fetchAPI('/api/userProfile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }, true);
  }
};
