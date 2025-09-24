import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseAuthFormReturn {
  isLoading: boolean;
  error: string;
  success: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    memberCount: number
  ) => Promise<void>;
  resetState: () => void;
}

export function useAuthForm(): UseAuthFormReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setError('');
    setSuccess(false);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log('Login successful:', authData.user?.email);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    memberCount: number
  ) => {
    setIsLoading(true);
    setError('');

    try {
      // 1. ユーザー登録
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. DB関数を呼び出してプロファイルと家族グループを一括作成
        const { data: result, error: functionError } = await supabase.rpc(
          'create_user_with_family_group',
          {
            user_id: authData.user.id,
            user_email: email,
            member_count: memberCount,
          }
        );

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error('アカウント設定に失敗しました');
        }

        if (!result.success) {
          throw new Error(result.error || 'アカウント設定に失敗しました');
        }

        console.log('Account created successfully:', result);
        setSuccess(true);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err instanceof Error ? err.message : 'アカウント作成に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    success,
    login,
    signup,
    resetState,
  };
}
