import { useState } from 'react';

export function useModals() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');

  return {
    showSuccessModal,
    setShowSuccessModal,
    showHintModal,
    setShowHintModal,
    showVideoModal,
    setShowVideoModal,
    currentVideo,
    setCurrentVideo,
  };
}