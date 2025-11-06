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
  const [isHovering, setIsHovering] = useState(false);

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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-xl px-3 py-2 border border-border/50 shadow-md hover:shadow-lg transition-all duration-300",
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
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'إيقاف (Space)' : 'تشغيل (Space)'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Progress Bar - Hidden on very small screens */}
      {(isPlaying || isHovering) && (
        <div className="hidden sm:flex items-center gap-2 min-w-[120px] flex-1 overflow-hidden">
          <div className="w-full animate-in slide-in-from-left duration-200">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer hover:opacity-100 transition-opacity"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Time Display */}
      {(isPlaying || isHovering) && (
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium tabular-nums animate-in slide-in-from-right duration-200">
          <span className="sm:hidden">{formatTime(currentTime)}</span>
          <span className="hidden sm:inline">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </span>
      )}

      {/* Settings Popover */}
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-6 animate-in fade-in-0 zoom-in-95 duration-200 shadow-xl border-border/50" align="end">
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
                className="flex-1 hover:opacity-100 transition-opacity"
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
                      "flex items-center justify-center p-3 rounded-xl transition-all duration-200 font-medium",
                      playbackRate === speed.value
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-accent/50 hover:bg-accent text-foreground hover:scale-105"
                    )}
                  >
                    <span className="text-sm">
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
