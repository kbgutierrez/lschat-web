const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface ProfileData {
    firstName: string;
    middleName?: string;
    lastName: string;
    username: string;
    email: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
}

interface ProfileResponse {
    message: string;
    success: boolean;
    error?: string;
}

export const profileManagementAPI = {
    updateProfile: async (userId: number, userData: ProfileData): Promise<ProfileResponse> => {
        try {
            const url = `${API_BASE_URL}/api/updateRecord/${userId}`;
            
            const requestData = {
                first_name: userData.firstName,
                middle_name: userData.middleName || '',
                last_name: userData.lastName,
                username: userData.username,
                email: userData.email,
                mobile_number: userData.mobileNumber,
                password: userData.password
            };
            console.log('Request Data:', requestData);
            console.log('API URL:', url);
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (!response.ok) {
                return { 
                    success: false, 
                    message: data.error || 'Profile update failed', 
                    error: data.sqlError || 'Unknown error occurred' 
                };
            }

            return { 
                success: true, 
                message: data.message || 'Profile updated successfully' 
            };
        } catch (error: any) {
            console.error('Profile update API error:', error);
            return { 
                success: false, 
                message: 'Failed to connect to server', 
                error: error.message 
            };
        }
    }
};

// Helper function to get auth token from local storage
function getAuthToken(): string {
    if (typeof window !== 'undefined') {
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
            const { token } = JSON.parse(userSession);
            return token || '';
        }
    }
    return '';
}
