import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import IntroSequence from '../components/IntroSequence';

export default function IntroPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('roomId');

  const handleComplete = () => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    } else {
      navigate('/create');
    }
  };

  return <IntroSequence onComplete={handleComplete} autoAdvance={true} />;
}
