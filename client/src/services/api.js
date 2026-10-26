const API_BASE_URL = 'http://localhost:5000/api/v1';

export async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token'); // Retrieves JWT token if authenticated

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Safely parse JSON or handle non-JSON responses (like 404/500 HTML pages)
    const contentType = response.headers.get('content-type');
    let result = {};
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const textResponse = await response.text();
      throw new Error(textResponse || `Server error with status ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed with status ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
}