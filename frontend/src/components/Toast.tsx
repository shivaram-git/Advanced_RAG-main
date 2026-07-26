import React from 'react';
import { ToastMessage } from '../App';

interface ToastProps {
  toast: ToastMessage;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const icons = {
    success: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-indigo-600 text-white',
  };

  return (
    <div
      className={`toast pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium min-w-[200px] max-w-xs ${colors[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0">{icons[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
