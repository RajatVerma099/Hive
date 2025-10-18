const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  // User endpoints (to be implemented)
  async getCurrentUser() {
    return this.request('/api/user/me');
  }

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

  async pinMessage(messageId: string) {
    return this.request(`/api/messages/${messageId}/pin`, {
      method: 'POST',
    });
  }

  async unpinMessage(messageId: string) {
    return this.request(`/api/messages/${messageId}/unpin`, {
      method: 'POST',
    });
  }

  // Fade endpoints (to be implemented)
  async getFades() {
    return this.request('/api/fades');
  }

  async createFade(data: any) {
    return this.request('/api/fades', {
      method: 'POST',
      body: JSON.stringify(data),
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
