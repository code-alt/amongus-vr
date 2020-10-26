import { useRef, useState, useEffect } from 'react';

function useAudio(url) {
  const audio = useRef(new Audio(url));
  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  useEffect(() => {
    playing ? audio.current.play() : audio.current.pause();
  }, [playing]);

  useEffect(() => {
    const audioRef = audio.current;
    audioRef.addEventListener('ended', () => setPlaying(false));

    return () => {
      audioRef.removeEventListener('ended', () => setPlaying(false));
    };
  }, []);

  return [playing, toggle];
}

export default useAudio;
