import React, { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? 'https://backend-production-601f2.up.railway.app' : 'http://localhost:4000');

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // ─── 신청서 및 이벤트 목록 로드 ───────────────────────────
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedEvent) params.append('event_id', selectedEvent);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`${BASE_URL}/admin/applications?${params.toString()}`, {
        headers: { 'x-admin-token': ADMIN_TOKEN },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '신청서 조회에 실패했습니다.');

      setApplications(data.data || []);
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, selectedStatus]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/applications/events`, {
        headers: { 'x-admin-token': ADMIN_TOKEN },
      });
      const data = await res.json();
      setEvents(data || []);
    } catch (err) {
      console.error('이벤트 조회 실패:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ─── 상태 변경 ───────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      fetchApplications();
    } catch (err) {
      alert(`오류: ${err.message}`);
    }
  };

  // ─── 메모 저장 ───────────────────────────────────────────
  const handleSaveNote = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN,
        },
        body: JSON.stringify({ status, admin_note: noteText }),
      });
      if (!res.ok) throw new Error('메모 저장 실패');
      setEditingNoteId(null);
      fetchApplications();
    } catch (err) {
      alert(`오류: ${err.message}`);
    }
  };

  // ─── 엑셀 내보내기 ───────────────────────────────────────
  const handleExportExcel = () => {
    const url = `${BASE_URL}/admin/applications/export${selectedEvent ? `?event_id=${selectedEvent}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '2.5rem 0', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Pretendard', 'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>📋</div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', letterSpacing: '1px' }}>
              ADMIN DASHBOARD — 접수 관리
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B', margin: '0 0 6px 0' }}>
            전시회 및 시장개척단 참가 신청서 접수 현황
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            온라인 폼을 통해 제출된 참여 기업 신청서를 심사하고 엑셀로 명단을 내보낼 수 있습니다.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
          }}
        >
          📊 전체 신청서 엑셀 다운로드
        </button>
      </div>

      {/* ── 통계 배너 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: '전체 접수', value: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0), color: '#66C5F5', icon: '📋' },
          { label: '검토 중 (대기)', value: stats.pending || 0, color: '#F59E0B', icon: '⏳' },
          { label: '승인됨 (참가 확정)', value: stats.approved || 0, color: '#10B981', icon: '✅' },
          { label: '반려 / 보류', value: stats.rejected || 0, color: '#EF4444', icon: '❌' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: '16px', padding: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `${s.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 필터 바 ── */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: '16px', padding: '1rem 1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>🔍 필터:</div>

        {/* 이벤트 필터 */}
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B',
            outline: 'none', background: '#F8FAFC',
          }}
        >
          <option value="">모든 행사 전체보기 ({events.reduce((acc, ev) => acc + ev.count, 0)})</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.event_name} ({ev.count}건)
            </option>
          ))}
        </select>

        {/* 상태 필터 */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B',
            outline: 'none', background: '#F8FAFC',
          }}
        >
          <option value="">모든 상태 전체</option>
          <option value="pending">⏳ 검토 중</option>
          <option value="approved">✅ 승인됨</option>
          <option value="rejected">❌ 반려됨</option>
        </select>

        <button
          onClick={fetchApplications}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px', borderRadius: '8px',
            border: '1px solid #CBD5E1', background: '#fff',
            fontWeight: 600, fontSize: '13px', color: '#334155', cursor: 'pointer',
          }}
        >
          🔄 새로고침
        </button>
      </div>

      {/* ── 신청서 리스트 테이블 ── */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
            ⏳ 데이터를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>
            ❌ {error}
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
            조건에 해당하는 참여 신청서가 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>상태</th>
                  <th style={{ padding: '12px 16px' }}>행사명</th>
                  <th style={{ padding: '12px 16px' }}>신청기업</th>
                  <th style={{ padding: '12px 16px' }}>담당자 및 연락처</th>
                  <th style={{ padding: '12px 16px' }}>희망부스 / 타겟국가</th>
                  <th style={{ padding: '12px 16px' }}>대표 품목</th>
                  <th style={{ padding: '12px 16px' }}>관리자 심사 메모</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>상태변경</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>

                    {/* 상태 뱃지 */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px', borderRadius: '999px',
                        fontSize: '11px', fontWeight: 800,
                        background:
                          app.status === 'approved' ? '#DCFCE7' :
                          app.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                        color:
                          app.status === 'approved' ? '#166534' :
                          app.status === 'rejected' ? '#991B1B' : '#92400E',
                      }}>
                        {app.status === 'approved' ? '✅ 승인' :
                         app.status === 'rejected' ? '❌ 반려' : '⏳ 검토중'}
                      </span>
                    </td>

                    {/* 행사명 및 타입 */}
                    <td style={{ padding: '14px 16px', maxWidth: '160px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                        {app.event_name}
                      </div>
                      <span style={{
                        fontSize: '11px', color: '#64748B',
                        padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9',
                      }}>
                        {app.event_type === 'booth' ? '🏢 부스참가' : '🌍 시장개척단'}
                      </span>
                    </td>

                    {/* 신청기업 */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px', marginBottom: '4px' }}>
                        {app.company_name}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '12px' }}>
                        사업자: {app.business_reg_no || '-'}
                      </div>
                      {app.website && (
                        <a
                          href={app.website.startsWith('http') ? app.website : `https://${app.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2563EB', fontSize: '12px', textDecoration: 'underline' }}
                        >
                          홈페이지 🔗
                        </a>
                      )}
                    </td>

                    {/* 담당자 */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{app.contact_person}</div>
                      <div style={{ color: '#2563EB' }}>{app.contact_email}</div>
                      <div style={{ color: '#64748B' }}>{app.contact_phone}</div>
                    </td>

                    {/* 부스/국가 */}
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>
                      {app.event_type === 'booth'
                        ? (app.booth_size || '기본부스')
                        : (app.target_country || '-')}
                    </td>

                    {/* 품목 / 사유 */}
                    <td style={{ padding: '14px 16px', maxWidth: '180px' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
                        {app.products || '-'}
                      </div>
                      {app.reason && (
                        <div style={{ fontSize: '11px', color: '#64748B', background: '#F8FAFC', padding: '6px', borderRadius: '6px' }}>
                          💬 "{app.reason}"
                        </div>
                      )}
                    </td>

                    {/* 관리자 메모 */}
                    <td style={{ padding: '14px 16px', minWidth: '150px' }}>
                      {editingNoteId === app._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="메모 입력..."
                            rows="2"
                            style={{
                              padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1',
                              fontSize: '12px', fontFamily: 'inherit',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleSaveNote(app._id, app.status)}
                              style={{
                                padding: '4px 8px', borderRadius: '4px', background: '#10B981',
                                color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                              }}
                            >저장</button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              style={{
                                padding: '4px 8px', borderRadius: '4px', background: '#E2E8F0',
                                color: '#475569', border: 'none', fontSize: '11px', cursor: 'pointer',
                              }}
                            >취소</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => { setEditingNoteId(app._id); setNoteText(app.admin_note || ''); }}
                          style={{
                            padding: '6px 8px', borderRadius: '6px', background: '#F8FAFC',
                            border: '1px dashed #CBD5E1', minHeight: '36px', cursor: 'pointer',
                            color: app.admin_note ? '#1E293B' : '#94A3B8', fontSize: '12px',
                          }}
                          title="클릭하여 메모 수정"
                        >
                          {app.admin_note || '✏️ 메모 없음 (클릭)'}
                        </div>
                      )}
                    </td>

                    {/* 상태변경 버튼 */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                          onClick={() => handleStatusChange(app._id, 'approved')}
                          disabled={app.status === 'approved'}
                          style={{
                            padding: '5px 10px', borderRadius: '6px',
                            background: app.status === 'approved' ? '#E2E8F0' : '#10B981',
                            color: app.status === 'approved' ? '#94A3B8' : '#fff',
                            border: 'none', fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                          }}
                        >
                          ✅ 승인
                        </button>
                        <button
                          onClick={() => handleStatusChange(app._id, 'rejected')}
                          disabled={app.status === 'rejected'}
                          style={{
                            padding: '5px 10px', borderRadius: '6px',
                            background: app.status === 'rejected' ? '#E2E8F0' : '#EF4444',
                            color: app.status === 'rejected' ? '#94A3B8' : '#fff',
                            border: 'none', fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                          }}
                        >
                          ❌ 반려
                        </button>
                        {app.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(app._id, 'pending')}
                            style={{
                              padding: '4px', borderRadius: '6px',
                              background: '#F1F5F9', color: '#64748B',
                              border: 'none', fontSize: '10px', cursor: 'pointer',
                            }}
                          >
                            ⏳ 대기 변경
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
