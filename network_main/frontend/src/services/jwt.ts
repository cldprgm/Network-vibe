const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchWithToken(url: string, options: RequestInit = {}) {
    let token = 'test-token';

    if (!token || isTokenExpired(token)) {
        try {
            token = await refreshToken();
            console.log('token:', token)      
        } catch (error) {
            // if (typeof window !== 'undefined') {
            //     window.location.href = '/login';
            // }
            console.log('error', error)      
            throw new Error('Authentication failed');
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, {...options, headers});

    if (response.status === 401) {
        try {
            token = await refreshToken();
            const retryResponse = await fetch(url, {
                ...options,
                headers: { ...headers, Authorization: `Bearer ${token}` },
        });
        return retryResponse;
        } catch (error) {
            // if (typeof window !== 'undefined') {
            //     window.location.href = '/login';
            // }
            throw new Error('Authentication failed');
        }
    }

    return response;
};


function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};


export async function refreshToken(): Promise<string> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${baseUrl}/api/v1/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('access_token', data.access);
      return data.access;
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw new Error('Failed to refresh token');
  }
};