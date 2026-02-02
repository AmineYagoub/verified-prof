import {
  ProfileAvatarUploadResult,
  UserProfileResponse,
} from '@verified-prof/shared';
import { api } from './api';

export class ProfileService {
  static async getCurrentProfile(): Promise<UserProfileResponse> {
    const response = await api.get<UserProfileResponse>('/profile/me');
    return response.data;
  }

  static async uploadAvatar(file: File): Promise<ProfileAvatarUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<ProfileAvatarUploadResult>(
        '/profile/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to upload avatar';
      throw new Error(message);
    }
  }

  static async deleteAvatar(): Promise<void> {
    try {
      await api.delete('/profile/avatar');
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete avatar';
      throw new Error(message);
    }
  }
}
