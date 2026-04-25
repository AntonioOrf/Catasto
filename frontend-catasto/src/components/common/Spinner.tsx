import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className = "h-5 w-5" }: SpinnerProps) {
  return <RefreshCw className={`${className} animate-spin`} />;
}
