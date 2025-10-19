import type { Metadata } from 'next';
import { AuthProvider } from '../lib/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import './globals.scss';
import { UserProvider } from '@/lib/userContext';
import { IngredientMasterProvider } from '@/lib/ingredientMasterContext';

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
        <AuthProvider>
          <UserProvider>
            <IngredientMasterProvider>
              <AppLayout>{children}</AppLayout>
            </IngredientMasterProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
