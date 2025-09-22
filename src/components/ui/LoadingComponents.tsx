import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FullLoader, ModernLoader, LoadingText } from '@/components/ui/ModernLoader';
import { LottieLoader } from '@/components/ui/LottieLoader';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  fullscreen = false 
}) => {
  const { lottieSettings } = useSharedLottieSettings();
  
  const containerClasses = fullscreen
    ? 'min-h-screen gradient-subtle flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  const loaderSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  return (
    <div className={containerClasses}>
      {lottieSettings.enabled && lottieSettings.lottie_data ? (
        <LottieLoader
          animationData={lottieSettings.lottie_data}
          text={message}
          size={loaderSize}
          speed={lottieSettings.speed}
          loop={lottieSettings.loop}
          className="animate-fade-in-up"
        />
      ) : (
        <FullLoader 
          type="gradient" 
          text={message} 
          size={loaderSize}
          className="animate-fade-in-up" 
        />
      )}
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: FC<PageLoadingProps> = ({ 
  message = 'Loading...' 
}) => (
  <LoadingSpinner message={message} fullscreen />
);

interface ComponentLoadingProps {
  message?: string;
  height?: string;
}

export const ComponentLoading: FC<ComponentLoadingProps> = ({ 
  message = 'Loading...',
  height = 'h-48'
}) => {
  const { lottieSettings } = useSharedLottieSettings();
  
  return (
    <Card className={height}>
      <CardContent className="flex items-center justify-center h-full">
        {lottieSettings.enabled && lottieSettings.lottie_data ? (
          <LottieLoader
            animationData={lottieSettings.lottie_data}
            text={message}
            size="md"
            speed={lottieSettings.speed}
            loop={lottieSettings.loop}
            className="animate-fade-in-up"
          />
        ) : (
          <FullLoader 
            type="pulse" 
            text={message} 
            size="md"
            className="animate-fade-in-up" 
          />
        )}
      </CardContent>
    </Card>
  );
};

// Additional specialized loading components
export const DataLoading: FC<{ message?: string }> = ({ message = 'Loading data...' }) => {
  const { lottieSettings } = useSharedLottieSettings();
  
  return (
    <div className="flex items-center justify-center p-4">
      {lottieSettings.enabled && lottieSettings.lottie_data ? (
        <LottieLoader
          animationData={lottieSettings.lottie_data}
          text={message}
          size="md"
          speed={lottieSettings.speed}
          loop={lottieSettings.loop}
        />
      ) : (
        <FullLoader type="wave" text={message} size="md" />
      )}
    </div>
  );
};

export const FileUploadLoading: FC<{ message?: string }> = ({ message = 'Uploading file...' }) => {
  const { lottieSettings } = useSharedLottieSettings();
  
  return (
    <div className="flex items-center justify-center p-4">
      {lottieSettings.enabled && lottieSettings.lottie_data ? (
        <LottieLoader
          animationData={lottieSettings.lottie_data}
          text={message}
          size="md"
          speed={lottieSettings.speed}
          loop={lottieSettings.loop}
        />
      ) : (
        <FullLoader type="circle" text={message} size="md" />
      )}
    </div>
  );
};

export const NetworkLoading: FC<{ message?: string }> = ({ message = 'Connecting...' }) => {
  const { lottieSettings } = useSharedLottieSettings();
  
  return (
    <div className="flex items-center justify-center p-4">
      {lottieSettings.enabled && lottieSettings.lottie_data ? (
        <LottieLoader
          animationData={lottieSettings.lottie_data}
          text={message}
          size="md"
          speed={lottieSettings.speed}
          loop={lottieSettings.loop}
        />
      ) : (
        <FullLoader type="dots" text={message} size="md" />
      )}
    </div>
  );
};