'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import { TABLES } from '../constants/api';

interface FamilyGroup {
  id: string;
  group_code: string;
  member_count: number;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  family_group_id: string;
  created_at: string;
}

interface UserContextType {
  profile: UserProfile | null;
  familyGroup: FamilyGroup | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      setProfile(null);
      setFamilyGroup(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 ユーザー情報を取得中...');

      // プロフィール取得
      const { data: profileData, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile({
        id: profileData.id,
        email: user.email || '',
        family_group_id: profileData.family_group_id,
        created_at: profileData.created_at,
      });

      // 家族グループ取得
      if (profileData.family_group_id) {
        const { data: groupData, error: groupError } = await supabase
          .from(TABLES.FAMILY_GROUPS)
          .select('*')
          .eq('id', profileData.family_group_id)
          .single();

        if (groupError) {
          throw groupError;
        }

        setFamilyGroup(groupData);
        console.log(`✅ ユーザー情報取得完了 (家族: ${groupData.group_code})`);
      }
    } catch (err) {
      console.error('❌ ユーザー情報の取得に失敗:', err);
      setError(
        err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザーログイン時にデータ取得
  useEffect(() => {
    fetchUserData();
  }, [user]);

  const refetch = async () => {
    await fetchUserData();
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        familyGroup,
        isLoading,
        error,
        refetch,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// カスタムフック
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
