import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? 'https://backend-production-601f2.up.railway.app' : 'http://localhost:4000');

// 이벤트 정보 프리셋 (기본 이벤트 목록)
const EVENT_PRESETS = {
  'koaa-2026-booth': {
    name: '2026 KOAA SHOW (국제모빌리티산업전) — 부스 참가 신청',
    type: 'booth',
    badge: '🏢 전시회 부스 참가',
    color: '#6366F1',
    desc: '글로벌 모빌리티 바이어와 직접 만나는 아시아 최고 수준의 모빌리티 비즈니스 전문 전시회',
  },
  'detroit-gm-2026': {
    name: '2026 북미 디트로이트 GM 벤더 미팅 시장개척단',
    type: 'market_pioneer',
    badge: '🌍 해외 시장개척단',
    color: '#10B981',
    desc: '미국 디트로이트 자동차 완성차 및 1차 벤더 본사 초청 1:1 수출상담회 참가 기업 모집',
  },
  'beauty-seoul-2026': {
    name: '2026 K-뷰티 글로벌 엑스포 — 부스 및 수출상담회',
    type: 'booth',
    badge: '💄 K-뷰티 특별관',
    color: '#EC4899',
    desc: '세계 40개국 화장품 바이어 300개사 초청, 프리미엄 K-뷰티 수출상담관 참가',
  },
};

export default function ApplicationForm() {
  const { eventId = 'koaa-2026-booth' } = useParams();
  const navigate = useNavigate();
  const preset = EVENT_PRESETS[eventId] || {
    name: `${eventId} 참가 신청`,
    type: 'booth',
    badge: '📋 참가 신청서',
    color: '#4F46E5',
    desc: '아인글로벌 해외 전시 및 시장개척단 참가 신청서입니다.',
  };

  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    business_reg_no: '',
    website: '',
    industry: '모빌리티/자동차부품',
    products: '',
    booth_size: '9sqm (3x3m 1개 부스)',
    target_country: '미국 / 북미',
    reason: '',
    memo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_person || !form.contact_email || !form.contact_phone) {
      setError('필수 항목(업체명, 담당자명, 이메일, 휴대전화)을 모두 입력해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${BASE_URL}/apply/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          event_name: preset.name,
          event_type: preset.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '신청서 제출에 실패했습니다.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '3rem 1rem', background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Pretendard', 'Inter', sans-serif" }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* ── 이벤트 배너 Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          borderRadius: '20px 20px 0 0',
          padding: '2.5rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: `${preset.color}22`, filter: 'blur(30px)',
          }} />
          <span style={{
            display: 'inline-block',
            padding: '5px 14px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: '12px', fontWeight: 700,
            marginBottom: '12px', backdropFilter: 'blur(8px)',
          }}>
            {preset.badge}
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 10px 0', lineHeight: 1.3 }}>
            {preset.name}
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            {preset.desc}
          </p>
        </div>

        {/* ── 폼 컨테이너 / 완료 메시지 ── */}
        <div style={{
          background: '#fff',
          borderRadius: '0 0 20px 20px',
          padding: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E2E8F0',
          borderTop: 'none',
        }}>
          {result ? (
            /* 성공 안내 페이지 */
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '56px', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#166534', marginBottom: '10px' }}>
                참가 신청이 정상적으로 접수되었습니다!
              </h2>
              <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
                제출하신 신청서 정보가 안전하게 저장되었습니다.<br />
                아인글로벌 담당 매니저가 검토 후 입력하신 연락처(<strong>{form.contact_email}</strong>)로
                상세 일정 및 안내자료를 보내드립니다.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => navigate('/ax-data')}
                  style={{
                    padding: '12px 24px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  🚀 참가업체 유치 Agent로 이동
                </button>
                <button
                  onClick={() => { setResult(null); setForm({ ...form, company_name: '' }); }}
                  style={{
                    padding: '12px 24px', borderRadius: '10px',
                    background: '#F1F5F9', color: '#475569', fontWeight: 600,
                    border: '1px solid #CBD5E1', cursor: 'pointer',
                  }}
                >
                  ➕ 다른 기업 신청서 추가
                </button>
              </div>
            </div>
          ) : (
            /* 신청서 작성 폼 */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  color: '#DC2626', fontSize: '13px', fontWeight: 600,
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* 기본 정보 */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '8px' }}>
                  1. 기업 기본 정보
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>업체명 (국문/영문) *</label>
                    <input
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="예: (주)그란오소 / Gran Oso Inc."
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>사업자등록번호</label>
                    <input
                      name="business_reg_no"
                      value={form.business_reg_no}
                      onChange={handleChange}
                      placeholder="예: 123-45-67890"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>주요 업종/분야 *</label>
                    <select name="industry" value={form.industry} onChange={handleChange} style={inputStyle}>
                      <option value="모빌리티/자동차부품">모빌리티 / 자동차부품</option>
                      <option value="화장품/K-뷰티">화장품 / K-뷰티</option>
                      <option value="기계/설비/장비">기계 / 설비 / 산업장비</option>
                      <option value="IT/소프트웨어/AI">IT / 소프트웨어 / AI</option>
                      <option value="식품/바이오">식품 / 바이오 / 헬스케어</option>
                      <option value="기타 제조 및 무역">기타 제조 및 무역</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>회사 공식 웹사이트</label>
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="예: https://www.example.com"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* 담당자 연락처 */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '8px' }}>
                  2. 참가 담당자 정보 *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>담당자 성명/직급 *</label>
                    <input
                      name="contact_person"
                      value={form.contact_person}
                      onChange={handleChange}
                      placeholder="예: 홍길동 팀장"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>담당자 이메일 *</label>
                    <input
                      type="email"
                      name="contact_email"
                      value={form.contact_email}
                      onChange={handleChange}
                      placeholder="예: hong@company.co.kr"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>휴대전화번호 *</label>
                    <input
                      name="contact_phone"
                      value={form.contact_phone}
                      onChange={handleChange}
                      placeholder="예: 010-1234-5678"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 희망 옵션 및 상세 내용 */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '8px' }}>
                  3. 참가 희망 세부사항
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: preset.type === 'booth' ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {preset.type === 'booth' ? (
                    <div>
                      <label style={labelStyle}>희망 부스 규모</label>
                      <select name="booth_size" value={form.booth_size} onChange={handleChange} style={inputStyle}>
                        <option value="9sqm (3x3m 1개 부스)">9㎡ (3x3m 1개 기본 부스)</option>
                        <option value="18sqm (3x3m 2개 부스)">18㎡ (3x3m 2개 부스)</option>
                        <option value="36sqm (4개 부스 이상)">36㎡ (독립 부스 4개 이상)</option>
                        <option value="상담 후 결정 (미정)">상담 후 결정 (미정)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label style={labelStyle}>타겟 진출 국가/지역</label>
                      <input
                        name="target_country"
                        value={form.target_country}
                        onChange={handleChange}
                        placeholder="예: 미국 미시간주 / 독일 / 동남아 등"
                        style={inputStyle}
                      />
                    </div>
                  )}
                  <div>
                    <label style={labelStyle}>주요 수출 희망 품목 (대표 제품)</label>
                    <input
                      name="products"
                      value={form.products}
                      onChange={handleChange}
                      placeholder="예: 자동차 센서 및 제어장치 / 유기농 화장품"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>참가 목적 또는 특별 요청사항 (선택)</label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    rows="3"
                    placeholder="예: 특정 글로벌 바이어(GM, Ford 등) 미팅 희망 / 부스 코너 자리 선호 등 자유롭게 기재해 주세요."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* 개인정보 제공 동의서 안내 및 제출 */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#64748B',
                lineHeight: 1.5,
              }}>
                🔒 제출하신 정보는 아인글로벌의 전시회 참가 및 시장개척단 주선 안내, 바이어 매칭을 위한 목적으로만 사용되며 안전하게 관리됩니다.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/ax-data')}
                  style={{
                    padding: '12px 24px', borderRadius: '10px',
                    background: '#F1F5F9', color: '#64748B',
                    fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '14px 36px', borderRadius: '10px',
                    background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontWeight: 800, fontSize: '15px',
                    border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSubmitting ? '⏳ 신청서 전송 중...' : '✅ 온라인 참가 신청서 제출'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '14px',
  color: '#1E293B',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#fff',
};
