'use client';

import { useState, useEffect } from 'react';

interface WordFlipperProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function WordFlipper({
  words,
  typingSpeed = 120,
  deletingSpeed = 60,
  pauseDuration = 1800,
}: WordFlipperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = words[currentIndex];

    const timer = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false);
          setIsDeleting(true);
          return;
        }

        if (isDeleting) {
          setDisplayedText((prev) => prev.slice(0, -1));

          if (displayedText === '') {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % words.length);
          }
        } else {
          setDisplayedText((prev) => currentWord.slice(0, prev.length + 1));

          if (displayedText === currentWord) {
            setIsPaused(true);
          }
        }
      },
      isDeleting ? deletingSpeed : isPaused ? pauseDuration : typingSpeed,
    );

    return () => clearTimeout(timer);
  }, [
    currentIndex,
    displayedText,
    isDeleting,
    isPaused,
    words,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  return (
    <span className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold text-4xl md:text-5xl">
      {displayedText}
      <span className="animate-pulse text-blue-500">|</span>
    </span>
  );
}
