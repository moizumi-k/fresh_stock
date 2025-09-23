import type { Metadata } from 'next';
import { AuthProvider } from '../lib/AuthContext';
import './globals.scss';

export const metadata: Metadata = {
  title: 'FreshStock - 家族の食材管理アプリ',
  description: 'AIが提案する食材管理＆レシピアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ja'>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
