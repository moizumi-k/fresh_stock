'use client';

import { toast, Toaster } from 'sonner';

// トースト通知のヘルパー関数
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  loading: (message: string) => toast.loading(message),
  promise: (
    promise: Promise<any>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
};

// Toasterコンポーネント（レイアウトに配置）
export default function Toast() {
  return (
    <Toaster
      position='top-right'
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--card-background)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '0.875rem',
        },
        className: 'custom-toast',
      }}
    />
  );
}
