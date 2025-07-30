import React, { useState, useEffect } from 'react';
import { NovaTalk } from './NovaTalk';

interface NovaTalkSequenceProps {
  messages: string[];
  voiceId: string;
  apiKey: string;
  size?: number;
  onComplete?: () => void;
  allowSkip?: boolean;
  sequenceKey?: string | number; // changes re-trigger sequence
}

export const NovaTalkSequence: React.FC<NovaTalkSequenceProps> = ({
  messages,
  voiceId,
  apiKey,
  size = 220,
  onComplete,
  allowSkip = false,
  sequenceKey
}) => {
  const [index, setIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0); // ensures force re-render of NovaTalk

  useEffect(() => {
    setIndex(0); // reset on new sequenceKey
    setCycleKey(k => k + 1);
  }, [sequenceKey]);

  const handleNext = () => {
    if (index < messages.length - 1) {
      setIndex(i => i + 1);
      setCycleKey(k => k + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handleClick = () => {
    if (allowSkip) {
      handleNext();
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <NovaTalk
        key={cycleKey}
        text={messages[index]}
        voiceId={voiceId}
        apiKey={apiKey}
        size={size}
        onEnd={handleNext}
      />
    </div>
  );
};
