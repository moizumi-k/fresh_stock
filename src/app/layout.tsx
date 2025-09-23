import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'fresh-stock',
  description: 'フレッシュストック',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body>{children}</body>
    </html>
  );
}
