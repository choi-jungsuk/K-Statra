import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Link } from 'react-router-dom';

export default function TradeMissionEventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    slug: 'demo-mexico-auto-2026',
    nameKo: '[DEMO] 2026 멕시코 자동차부품 시장개척단',
    targetCountry: '멕시코',
    targetCity: '멕시코시티, 몬테레이',
    applicationDeadline: '2026-09-30',
    capacity: 20,
    descriptionKo: '멕시코 현지 자동차 OEM 및 1차 부품 유통사 매칭 시장개척단 모집',
    status: 'open',
  });

  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [copiedSlug, setCopiedSlug] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.listTradeMissionEvents();
      setEvents(res || []);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg('');

    try {
      await api.createTradeMissionEvent(form);
      setMsg('행사가 성공적으로 생성되었습니다.');
      loadEvents();
    } catch (err) {
      setMsg('행사 생성 오류: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (slug) => {
    const publicUrl = `${window.location.origin}/apply/trade-mission/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(''), 2500);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px 60px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/ax-data?mode=trade-mission"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: '#00A4EF', fontWeight: 700, fontSize: 13, marginBottom: 12 }}
        >
          ← 시장개척단 후보기업 발굴로 돌아가기
        </Link>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#00A4EF', background: '#EEF2FF', padding: '4px 10px', borderRadius: 20 }}>
            EVENT MANAGEMENT
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '6px 0 0 0' }}>
          🌏 해외시장개척단 행사 설정 & 공개 링크 관리
        </h1>
      </div>

      {/* New Event Form */}
      <div style={{ background: '#FFF', padding: 28, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>
          ➕ 신규 시장개척단 행사 등록
        </h3>

        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                URL Slug (영문 고유 식별자) *
              </label>
              <input
                type="text"
                name="slug"
                required
                value={form.slug}
                onChange={handleChange}
                placeholder="demo-mexico-auto-2026"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                행사 명칭 (국문) *
              </label>
              <input
                type="text"
                name="nameKo"
                required
                value={form.nameKo}
                onChange={handleChange}
                placeholder="[DEMO] 2026 멕시코 자동차부품 시장개척단"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                목표 국가 *
              </label>
              <input
                type="text"
                name="targetCountry"
                required
                value={form.targetCountry}
                onChange={handleChange}
                placeholder="멕시코"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                목표 도시
              </label>
              <input
                type="text"
                name="targetCity"
                value={form.targetCity}
                onChange={handleChange}
                placeholder="멕시코시티, 몬테레이"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                신청 마감일 *
              </label>
              <input
                type="date"
                name="applicationDeadline"
                required
                value={form.applicationDeadline}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                접수 상태
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
              >
                <option value="open">접수 중 (open)</option>
                <option value="draft">임시 저장 (draft)</option>
                <option value="closed">접수 마감 (closed)</option>
              </select>
            </div>
          </div>

          {msg && (
            <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: msg.includes('오류') ? '#DC2626' : '#059669' }}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            style={{ padding: '10px 20px', background: '#00A4EF', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            {creating ? '생성 중...' : '신규 행사 등록'}
          </button>
        </form>
      </div>

      {/* Events List */}
      <div style={{ background: '#FFF', padding: 28, borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>
          📋 등록된 시장개척단 행사 목록 ({events.length}건)
        </h3>

        {loading ? (
          <div style={{ color: '#64748B' }}>목록을 로드 중입니다...</div>
        ) : events.length === 0 ? (
          <div style={{ color: '#64748B' }}>등록된 행사가 없습니다.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {events.map((ev) => (
              <div key={ev._id} style={{ padding: 18, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ background: ev.status === 'open' ? '#D1FAE5' : '#F1F5F9', color: ev.status === 'open' ? '#047857' : '#64748B', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                      {ev.status.toUpperCase()}
                    </span>
                    <strong style={{ fontSize: 15, color: '#0F172A' }}>{ev.nameKo}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    목표국가: {ev.targetCountry} | 마감일: {ev.applicationDeadline} | 공개 URL: <code style={{ color: '#00A4EF' }}>/apply/trade-mission/{ev.slug}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(ev.slug)}
                    style={{ padding: '8px 14px', background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: copiedSlug === ev.slug ? '#059669' : '#334155' }}
                  >
                    {copiedSlug === ev.slug ? '✓ 링크 복사됨!' : '🔗 공개 신청서 링크 복사'}
                  </button>
                  <Link
                    to={`/apply/trade-mission/${ev.slug}`}
                    target="_blank"
                    style={{ padding: '8px 14px', background: '#00A4EF', color: '#FFF', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                  >
                    👁️ 미리보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
