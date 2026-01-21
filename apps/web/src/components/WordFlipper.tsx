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
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 1500,
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
    <span className="inline-block text-blue-500">
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
