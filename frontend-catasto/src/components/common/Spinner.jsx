import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Spinner({ className = "h-5 w-5" }) {
  return <RefreshCw className={`${className} animate-spin`} />;
}
