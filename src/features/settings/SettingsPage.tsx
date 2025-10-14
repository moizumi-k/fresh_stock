'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Users, Mail, Calendar } from 'lucide-react';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import { ROUTES } from '../../constants/routes';
import styles from './settings.module.scss';
import { useFamilySettings } from '../../hooks/useFamilySettings';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { familyGroup, isLoading, error, updateMemberCount } =
    useFamilySettings();

  const [memberCount, setMemberCount] = useState<number>(2);
  const [isSaving, setIsSaving] = useState(false);

  // 家族人数の初期値を設定
  useEffect(() => {
    if (familyGroup) {
      setMemberCount(familyGroup.member_count);
    }
  }, [familyGroup]);

  // ログアウト処理
  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      router.push(ROUTES.LOGIN);
    }
  };

  // 家族人数更新
  const handleUpdateMemberCount = async () => {
    setIsSaving(true);
    const success = await updateMemberCount(memberCount);
    setIsSaving(false);

    if (success) {
      alert('家族人数を更新しました');
    }
  };

  if (!user) {
    return <Loading text='認証確認中...' fullScreen />;
  }

  if (isLoading) {
    return <Loading text='設定を読み込み中...' />;
  }

  // アカウント作成日を取得
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ja-JP')
    : '不明';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>⚙️ 設定</h1>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {/* アカウント情報 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Mail size={20} />
          アカウント情報
        </h2>
        <div className={styles.card}>
          <div className={styles.infoRow}>
            <span className={styles.label}>メールアドレス</span>
            <span className={styles.value}>{user.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>登録日</span>
            <span className={styles.value}>{createdDate}</span>
          </div>
        </div>
      </section>

      {/* 家族設定 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Users size={20} />
          家族設定
        </h2>
        <div className={styles.card}>
          {familyGroup && (
            <>
              <div className={styles.infoRow}>
                <span className={styles.label}>家族グループID</span>
                <span className={styles.value}>{familyGroup.group_code}</span>
              </div>

              <div className={styles.formRow}>
                <Select
                  label='家族人数'
                  options={[
                    { value: 1, label: '1人' },
                    { value: 2, label: '2人' },
                    { value: 3, label: '3人' },
                    { value: 4, label: '4人' },
                    { value: 5, label: '5人' },
                  ]}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                />
                <Button
                  variant='primary'
                  onClick={handleUpdateMemberCount}
                  isLoading={isSaving}
                  disabled={memberCount === familyGroup.member_count}
                >
                  更新
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ログアウト */}
      <section className={styles.section}>
        <div className={styles.card}>
          <Button
            variant='danger'
            size='lg'
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <LogOut size={20} />
            ログアウト
          </Button>
        </div>
      </section>
    </div>
  );
}
