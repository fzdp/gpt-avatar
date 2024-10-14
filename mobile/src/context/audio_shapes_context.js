import { createContext, useState } from 'react';

export const AudioShapesContext = createContext();

export const AudioShapesProvider = ({ children }) => {
  const [audioPlayTime, setAudioPlayTime] = useState(null);
  const [audioStreamData, setAudioStreamData] = useState({
    audio: null,
    shapes: [],
    audioDuration: 0,
  });

  const resetAudioShapesStates = () => {
    setAudioPlayTime(null);
    setAudioStreamData({ audio: null, shapes: [], audioDuration: 0 });
  };

  return (
    <AudioShapesContext.Provider
      value={{
        audioPlayTime,
        setAudioPlayTime,
        audioStreamData,
        setAudioStreamData,
        resetAudioShapesStates,
      }}
    >
      {children}
    </AudioShapesContext.Provider>
  );
};
