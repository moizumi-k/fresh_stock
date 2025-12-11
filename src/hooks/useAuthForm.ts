import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/common/Toast';

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
      showToast.success('ログインしました');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
      showToast.error(errorMessage);
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
        showToast.success('アカウントを作成しました');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'アカウント作成に失敗しました';
      setError(errorMessage);
      showToast.error(errorMessage);
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
