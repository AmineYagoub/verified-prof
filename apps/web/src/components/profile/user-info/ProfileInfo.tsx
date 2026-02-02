'use client';

import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_VALIDATION_ERRORS,
  MAX_AVATAR_FILE_SIZE,
} from '@verified-prof/shared/client';
import { ProfileService } from '@verified-prof/web/services/profile.service';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ProfileHeroProps {
  userName: string;
  userImage?: string;
}

export const ProfileHero = ({ userName, userImage }: ProfileHeroProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [currentAvatar, setCurrentAvatar] = useState(userImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      toast.error(AVATAR_VALIDATION_ERRORS.FILE_TOO_LARGE);
      return;
    }
    if (
      !ALLOWED_AVATAR_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
      )
    ) {
      toast.error(AVATAR_VALIDATION_ERRORS.INVALID_TYPE);
      return;
    }
    try {
      setIsUploading(true);
      const result = await ProfileService.uploadAvatar(file);
      setCurrentAvatar(result.url);
      setIsImageLoading(true);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload avatar';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="relative flex flex-col lg:flex-row items-center gap-8 max-w-4xl">
      <div className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <div
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-line-1"
          style={{ left: '10%', top: 0 }}
        ></div>
        <div
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-line-2"
          style={{ left: '25%', top: 0 }}
        ></div>
        <div
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/40 to-transparent animate-line-3"
          style={{ left: '50%', top: 0 }}
        ></div>
        <div
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-line-4"
          style={{ left: '75%', top: 0 }}
        ></div>
        <div
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-line-5"
          style={{ left: '90%', top: 0 }}
        ></div>
      </div>

      <figure className="relative group">
        <div
          className="w-[300px] h-[300px] rounded-full overflow-hidden cursor-pointer relative ring-4 ring-primary/20 transition-all hover:ring-primary/40"
          onClick={handleAvatarClick}
          data-tip="Click to change avatar"
        >
          {currentAvatar ? (
            <>
              {isImageLoading && (
                <div className="absolute inset-0 bg-base-200 flex items-center justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              )}
              <Image
                src={currentAvatar}
                alt={userName}
                fill
                className="object-cover"
                onLoad={() => setIsImageLoading(false)}
                priority
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-9xl font-bold text-primary-content">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="badge badge-primary badge-lg">
              Click to change avatar
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_AVATAR_MIME_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
      </figure>

      <header className="flex flex-col space-y-4">
        <h1 className="text-7xl font-bold text-left">{userName}</h1>
        <p className="text-xl text-base-content/70 leading-relaxed max-w-2xl text-left">
          My Bio
        </p>

        <button
          className="btn btn-lg rounded-full hover:scale-110 transition-transform hover:bg-green-600 text-white border-green-500 pl-1 h-13 self-center border-2"
          aria-label="Talk to VoiceTwin AI"
        >
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping [animation-duration:1s]"></div>
            <div className="absolute inset-0 rounded-full bg-green-300 animate-ping [animation-duration:2s] [animation-delay:1s]"></div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
          </div>
          <span className="hidden font-semibold inline-block mx-2">
            Talk to vTwin AI
          </span>
        </button>
      </header>
    </section>
  );
};
