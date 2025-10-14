import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TABLES } from '../constants/api';

interface FamilyGroup {
  id: string;
  group_code: string;
  member_count: number;
  created_at: string;
}

interface UseFamilySettingsReturn {
  familyGroup: FamilyGroup | null;
  isLoading: boolean;
  error: string | null;
  updateMemberCount: (newCount: number) => Promise<boolean>;
  refreshFamilyGroup: () => Promise<void>;
}

export function useFamilySettings(): UseFamilySettingsReturn {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 家族グループ情報を取得
  const fetchFamilyGroup = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 現在のユーザーを取得
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // プロフィールからfamily_group_idを取得
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('family_group_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.family_group_id) {
        throw new Error('家族グループが見つかりません');
      }

      // 家族グループ情報を取得
      const { data: group, error: groupError } = await supabase
        .from(TABLES.FAMILY_GROUPS)
        .select('*')
        .eq('id', profile.family_group_id)
        .single();

      if (groupError) {
        throw groupError;
      }

      setFamilyGroup(group);
    } catch (err) {
      console.error('Failed to fetch family group:', err);
      setError(
        err instanceof Error
          ? err.message
          : '家族グループ情報の取得に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 家族人数を更新
  const updateMemberCount = async (newCount: number): Promise<boolean> => {
    if (!familyGroup) {
      setError('家族グループが見つかりません');
      return false;
    }

    try {
      setError(null);

      console.log('🔄 家族人数を更新中...', {
        familyGroupId: familyGroup.id,
        currentCount: familyGroup.member_count,
        newCount: newCount,
      });

      const { data, error: updateError } = await supabase
        .from(TABLES.FAMILY_GROUPS)
        .update({ member_count: newCount })
        .eq('id', familyGroup.id)
        .select();

      if (updateError) {
        console.error('❌ 更新エラー:', updateError);
        throw updateError;
      }

      console.log('✅ 更新成功:', data);

      // ローカルステートを更新
      setFamilyGroup({
        ...familyGroup,
        member_count: newCount,
      });

      return true;
    } catch (err) {
      console.error('Failed to update member count:', err);
      setError(
        err instanceof Error ? err.message : '家族人数の更新に失敗しました'
      );
      return false;
    }
  };

  // 家族グループ情報を再取得
  const refreshFamilyGroup = async () => {
    await fetchFamilyGroup();
  };

  // 初回データ取得
  useEffect(() => {
    fetchFamilyGroup();
  }, []);

  return {
    familyGroup,
    isLoading,
    error,
    updateMemberCount,
    refreshFamilyGroup,
  };
}
