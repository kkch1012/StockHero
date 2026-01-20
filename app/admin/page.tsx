'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components';
import { useAuth } from '@/lib/contexts/AuthContext';
import { isAdmin, SUBSCRIPTION_TIERS } from '@/lib/admin/config';
import { 
  UsersIcon, 
  CreditCardIcon, 
  ShieldCheckIcon,
  SearchIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon,
  CrownIcon,
  RefreshCwIcon,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  subscription: {
    tier: string;
    is_active: boolean;
    expires_at: string | null;
    started_at: string;
  } | null;
}

interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  order_id: string;
  amount: number;
  plan: string;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
}

export default function AdminPage() {
  const { user, loading: authLoading, session } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [upgradeUserId, setUpgradeUserId] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // 관리자 권한 체크
  const userIsAdmin = isAdmin(user?.email);

  useEffect(() => {
    if (!authLoading && userIsAdmin && session?.access_token) {
      if (activeTab === 'users') {
        fetchUsers();
      } else {
        fetchPayments();
      }
    }
  }, [authLoading, userIsAdmin, activeTab, session?.access_token]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setPaymentStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (userId: string, tier: string) => {
    setUpgradeLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.success) {
        // 사용자 목록 새로고침
        await fetchUsers();
        setUpgradeUserId(null);
      } else {
        alert(data.error || '권한 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to upgrade user:', error);
      alert('권한 변경에 실패했습니다.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadge = (tier: string | undefined) => {
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.value === tier) || SUBSCRIPTION_TIERS[0];
    const colors: Record<string, string> = {
      free: 'bg-dark-700 text-dark-300',
      premium: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      pro: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      vip: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[tier || 'free']}`}>
        {tierInfo.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-emerald-500/20 text-emerald-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      failed: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-dark-700 text-dark-400',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // 로딩 중
  if (authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-dark-950 pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
        </main>
      </>
    );
  }

  // 비로그인 또는 권한 없음
  if (!user || !userIsAdmin) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-dark-950 pt-24">
          <div className="container-app">
            <div className="max-w-md mx-auto text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldCheckIcon className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-dark-100 mb-2">접근 권한 없음</h1>
              <p className="text-dark-400 mb-6">
                관리자만 접근할 수 있는 페이지입니다.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors"
              >
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark-950 pt-24 pb-12">
        {/* Background */}
        <div className="fixed inset-0 bg-grid opacity-30" />
        <div className="fixed top-1/3 right-0 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px]" />

        <div className="relative container-app">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-dark-100">관리자 대시보드</h1>
              </div>
              <p className="text-dark-400 text-sm">{user.email}</p>
            </div>
            <button
              onClick={() => activeTab === 'users' ? fetchUsers() : fetchPayments()}
              className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCwIcon className={`w-5 h-5 text-dark-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              사용자 관리
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'payments'
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200'
              }`}
            >
              <CreditCardIcon className="w-4 h-4" />
              결제 내역
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이메일로 검색..."
                  className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                  <p className="text-dark-500 text-sm">전체 사용자</p>
                  <p className="text-2xl font-bold text-dark-100">{users.length}</p>
                </div>
                <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                  <p className="text-dark-500 text-sm">VIP</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {users.filter(u => u.subscription?.tier === 'vip').length}
                  </p>
                </div>
                <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                  <p className="text-dark-500 text-sm">PRO</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {users.filter(u => u.subscription?.tier === 'pro').length}
                  </p>
                </div>
                <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                  <p className="text-dark-500 text-sm">무료</p>
                  <p className="text-2xl font-bold text-dark-400">
                    {users.filter(u => !u.subscription || u.subscription.tier === 'free').length}
                  </p>
                </div>
              </div>

              {/* User List */}
              <div className="bg-dark-900/80 border border-dark-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-800">
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">이메일</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">등급</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">가입일</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">마지막 로그인</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-dark-500">
                            <RefreshCwIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                            로딩 중...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-dark-500">
                            사용자가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isAdmin(u.email) && (
                                  <span title="관리자">
                                    <ShieldCheckIcon className="w-4 h-4 text-red-400" />
                                  </span>
                                )}
                                <span className="text-dark-200 text-sm">{u.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getTierBadge(u.subscription?.tier)}
                            </td>
                            <td className="px-4 py-3 text-dark-400 text-sm">
                              {formatDate(u.created_at)}
                            </td>
                            <td className="px-4 py-3 text-dark-400 text-sm">
                              {formatDate(u.last_sign_in_at)}
                            </td>
                            <td className="px-4 py-3">
                              {upgradeUserId === u.id ? (
                                <div className="flex items-center gap-1">
                                  {SUBSCRIPTION_TIERS.map((tier) => (
                                    <button
                                      key={tier.value}
                                      onClick={() => handleUpgrade(u.id, tier.value)}
                                      disabled={upgradeLoading}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        u.subscription?.tier === tier.value
                                          ? 'bg-brand-500 text-white'
                                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                                      }`}
                                    >
                                      {tier.label}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setUpgradeUserId(null)}
                                    className="p-1 text-dark-500 hover:text-dark-300"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setUpgradeUserId(u.id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-dark-700 hover:bg-dark-600 text-dark-300 text-sm rounded-lg transition-colors"
                                >
                                  <CrownIcon className="w-3 h-3" />
                                  등급 변경
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Stats */}
              {paymentStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                    <p className="text-dark-500 text-sm">총 매출</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(paymentStats.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                    <p className="text-dark-500 text-sm">전체 결제</p>
                    <p className="text-2xl font-bold text-dark-100">{paymentStats.totalTransactions}</p>
                  </div>
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                    <p className="text-dark-500 text-sm">완료</p>
                    <p className="text-2xl font-bold text-emerald-400">{paymentStats.completedTransactions}</p>
                  </div>
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                    <p className="text-dark-500 text-sm">대기</p>
                    <p className="text-2xl font-bold text-yellow-400">{paymentStats.pendingTransactions}</p>
                  </div>
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
                    <p className="text-dark-500 text-sm">실패</p>
                    <p className="text-2xl font-bold text-red-400">{paymentStats.failedTransactions}</p>
                  </div>
                </div>
              )}

              {/* Payment List */}
              <div className="bg-dark-900/80 border border-dark-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-800">
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">주문 ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">사용자</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">플랜</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">금액</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">상태</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">결제일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-dark-500">
                            <RefreshCwIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                            로딩 중...
                          </td>
                        </tr>
                      ) : payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-dark-500">
                            결제 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                            <td className="px-4 py-3 text-dark-300 text-sm font-mono">
                              {p.order_id?.slice(0, 12)}...
                            </td>
                            <td className="px-4 py-3 text-dark-200 text-sm">{p.user_email}</td>
                            <td className="px-4 py-3">{getTierBadge(p.plan)}</td>
                            <td className="px-4 py-3 text-dark-200 text-sm font-medium">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                            <td className="px-4 py-3 text-dark-400 text-sm">
                              {formatDate(p.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
