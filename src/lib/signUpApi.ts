const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';


export interface SignUpData {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface SignUpResponse {
  message: string;
  success: boolean;
  error?: string;
}

export const signUpAPI = {
  register: async (userData: SignUpData): Promise<SignUpResponse> => {
    try {
      const url = `${API_BASE_URL}/api/createRecord`;
      
    
      const requestData = {
        first_name: userData.firstName,
        middle_name: userData.middleName || '',
        last_name: userData.lastName,
        username: userData.username,
        email: userData.email,
        mobile_number: userData.mobileNumber,
        password: userData.password
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.error || 'Registration failed', 
          error: data.sqlError || 'Unknown error occurred' 
        };
      }

      return { 
        success: true, 
        message: data.message || 'Registration successful' 
      };
    } catch (error: any) {
      console.error('Sign up API error:', error);
      return { 
        success: false, 
        message: 'Failed to connect to server', 
        error: error.message 
      };
    }
  }
};
