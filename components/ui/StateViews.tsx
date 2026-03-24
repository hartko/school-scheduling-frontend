import { AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-24 h-24 animate-pulse">
        <Image src="/images/domi.png" alt="Loading" width={96} height={96} className="w-full h-full object-contain" />
      </div>
      <p className="text-sm font-mono" style={{ color: '#9e9e9e' }}>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#fce4ec' }}>
        <AlertCircle className="w-6 h-6" style={{ color: '#e91e8c' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm" style={{ color: '#333' }}>Failed to load data</p>
        <p className="text-xs mt-1 font-mono" style={{ color: '#9e9e9e' }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm flex items-center gap-1.5 mt-1">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
