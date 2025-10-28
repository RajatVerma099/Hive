const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, name: string, displayName?: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, displayName }),
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async updateUser(userId: string, data: any) {
    return this.request(`/api/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Conversation endpoints (to be implemented)
  async getConversations() {
    return this.request('/api/conversations');
  }

  async getPublicConversations() {
    return this.request('/api/conversations/public');
  }

  async getConversation(id: string) {
    return this.request(`/api/conversations/${id}`);
  }

  async createConversation(data: any) {
    return this.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(id: string, data: any) {
    return this.request(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string) {
    return this.request(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  async joinConversation(id: string) {
    return this.request(`/api/conversations/${id}/join`, {
      method: 'POST',
    });
  }

  async leaveConversation(id: string) {
    return this.request(`/api/conversations/${id}/leave`, {
      method: 'POST',
    });
  }

  // Message endpoints (to be implemented)
  async getMessages(conversationId: string) {
    return this.request(`/api/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Fade endpoints
  async getFades() {
    return this.request('/api/fades');
  }

  async getFade(id: string) {
    return this.request(`/api/fades/${id}`);
  }

  async getPublicFades() {
    return this.request('/api/fades/public');
  }

  async createFade(data: any) {
    return this.request('/api/fades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinFade(id: string) {
    return this.request(`/api/fades/${id}/join`, {
      method: 'POST',
    });
  }

  async leaveFade(id: string) {
    return this.request(`/api/fades/${id}/leave`, {
      method: 'POST',
    });
  }

  // Notebook endpoints (to be implemented)
  async getNotebook() {
    return this.request('/api/notebook');
  }

  async saveToNotebook(messageId: string, title?: string) {
    return this.request('/api/notebook', {
      method: 'POST',
      body: JSON.stringify({ messageId, title }),
    });
  }

  async removeFromNotebook(notebookId: string) {
    return this.request(`/api/notebook/${notebookId}`, {
      method: 'DELETE',
    });
  }

  // Search endpoints (to be implemented)
  async searchConversations(query: string, filters?: any) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/api/search/conversations?${params}`);
  }

  // Translation endpoints (to be implemented)
  async translateMessage(messageId: string, targetLanguage: string) {
    return this.request(`/api/messages/${messageId}/translate`, {
      method: 'POST',
      body: JSON.stringify({ targetLanguage }),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;
