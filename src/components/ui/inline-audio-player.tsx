import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InlineAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export const InlineAudioPlayer: React.FC<InlineAudioPlayerProps> = ({
  src,
  title,
  className
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('audio-volume');
    const savedSpeed = localStorage.getItem('audio-speed');
    if (savedVolume) setVolume(parseFloat(savedVolume));
    if (savedSpeed) setPlaybackRate(parseFloat(savedSpeed));
  }, []);

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem('audio-volume', volume.toString());
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Save playback rate to localStorage
  useEffect(() => {
    localStorage.setItem('audio-speed', playbackRate.toString());
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [src]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === ' ' && !settingsOpen) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, settingsOpen]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
  };

  const handleSpeedChange = (value: string) => {
    setPlaybackRate(parseFloat(value));
  };

  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 bg-orange-50/50 rounded-full px-3 sm:px-4 py-2 border border-orange-200/50 shadow-sm",
        className
      )}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={togglePlay}
              disabled={isLoading}
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-0.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'إيقاف (Space)' : 'تشغيل (Space)'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Progress Bar - Hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-2 min-w-[150px] md:min-w-[200px] flex-1">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1 cursor-pointer"
          disabled={isLoading}
        />
      </div>

      {/* Time Display */}
      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap font-medium">
        <span className="sm:hidden">{formatTime(currentTime)}</span>
        <span className="hidden sm:inline">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </span>

      {/* Settings Popover */}
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-6 animate-in fade-in-0 zoom-in-95 duration-200" align="end">
          <div className="space-y-6">
            {/* Volume Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">
                  مستوى الصوت
                </label>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Speed Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block mb-3">
                سرعة التشغيل
              </label>

              {/* 3 Speed Options */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0.75, label: 'بطيء', speed: '0.75x' },
                  { value: 1, label: 'عادي', speed: '1x' },
                  { value: 1.5, label: 'سريع', speed: '1.5x' },
                ].map(speed => (
                  <button
                    key={speed.value}
                    onClick={() => handleSpeedChange(speed.value.toString())}
                    className={cn(
                      "flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all duration-200",
                      playbackRate === speed.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-accent/50 hover:bg-accent text-foreground"
                    )}
                  >
                    <span className="text-sm font-semibold">
                      {speed.speed}
                    </span>
                    <span className="text-[10px]">
                      {speed.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
