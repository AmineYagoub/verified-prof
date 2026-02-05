import { api } from './api';

interface TwinTokenResponse {
  token: string;
  voiceName: string;
  sessionDurationMinutes: number;
}

interface TranscriptEntry {
  speaker: 'user' | 'twin';
  text: string;
  timestamp: Date;
}

interface SaveConversationRequest {
  transcript: TranscriptEntry[];
  duration: number;
}

export const voiceTwinService = {
  async getToken(slug: string): Promise<TwinTokenResponse> {
    const { data } = await api.get<TwinTokenResponse>(
      `/profile/${slug}/twin-token`,
    );
    return data;
  },

  async saveConversation(
    slug: string,
    request: SaveConversationRequest,
  ): Promise<void> {
    await api.post(`/profile/${slug}/twin-conversation`, request);
  },
};
