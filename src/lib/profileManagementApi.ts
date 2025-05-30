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
    profilePicture?: string;
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

export const updateProfilePictureApi = {
    updateProfilePicture: async (userId: number, file: File): Promise<ProfileResponse> => {
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('profile_picture', file);

        try {
              
     

            const response = await fetch(`${API_BASE_URL}/api/update-profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: formData,
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to update profile picture');
            }
            
            return { success: true, message: data.message };
        } catch (error: any) {
            console.error('Profile picture update error:', error);
            return { success: false, message: error.message };
        }
    }
};