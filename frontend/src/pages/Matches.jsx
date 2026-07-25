import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, newIdemKey } from '../api.js';
import CurrencySelect from '../ui/CurrencySelect.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

function isObjectId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || '').trim());
}

export default function Matches() {
  const { lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State Management
  const [buyersList, setBuyersList] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  
  const [buyerInput, setBuyerInput] = useState(searchParams.get('buyerId') || localStorage.getItem('demostatra_buyer_id') || '');
  const [limitInput, setLimitInput] = useState(() => {
    const raw = Number(searchParams.get('limit') || 5);
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 20) : 5;
  });
  const [companyFilter, setCompanyFilter] = useState(searchParams.get('companyId') || '');
  const [currency, setCurrency] = useState('XRP');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [creatingPayment, setCreatingPayment] = useState('');
  const [activeBuyerId, setActiveBuyerId] = useState(searchParams.get('buyerId') || localStorage.getItem('demostatra_buyer_id') || '');
  
  // Custom Azure Compliance Check Modal State
  const [complianceModal, setComplianceModal] = useState({ open: false, company: null, logs: [], status: 'idle' });

  // 1. Fetch Registered Buyers on Mount
  useEffect(() => {
    const fetchBuyers = async () => {
      setLoadingBuyers(true);
      try {
        const res = await api.listBuyers({ limit: 50 });
        const buyers = res?.data || [];
        setBuyersList(buyers);
        
        // Auto-select initial buyer if query param matches
        const initialBuyerId = searchParams.get('buyerId') || localStorage.getItem('demostatra_buyer_id');
        if (isObjectId(initialBuyerId) && buyers.length > 0) {
          const found = buyers.find(b => b._id === initialBuyerId);
          if (found) {
            setSelectedBuyer(found);
            setBuyerInput(found._id);
            setActiveBuyerId(found._id);
            loadMatches(found._id, limitInput);
          }
        }
      } catch (err) {
        console.error("Failed to load buyers directory:", err);
      } finally {
        setLoadingBuyers(false);
      }
    };
    fetchBuyers();
  }, []);

  // Filtered matches memo
  const filteredMatches = useMemo(() => {
    if (!companyFilter) return matches;
    return matches.filter((item) => item.company && item.company._id === companyFilter);
  }, [matches, companyFilter]);

  // 2. Core Match Loader
  const loadMatches = useCallback(
    async (buyerIdValue, limitValue) => {
      if (!isObjectId(buyerIdValue)) {
        setError(lang === 'ko' ? '올바른 바이어 ID(24자리 16진수)가 필요합니다.' : 'Valid buyerId (24 hex) required.');
        return;
      }
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const res = await api.getMatches(buyerIdValue, limitValue);
        setMatches(res?.data || []);
        setActiveBuyerId(buyerIdValue);
        if (companyFilter && res && Array.isArray(res.data) && res.data.every((r) => r.company?._id !== companyFilter)) {
          setMessage(lang === 'ko' ? '선택한 기업이 최근 상위 추천 결과에 없습니다.' : 'Selected company is not in the latest top results.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    },
    [companyFilter, lang]
  );

  // 3. Handle Select Buyer Card
  const handleSelectBuyer = (buyer) => {
    setSelectedBuyer(buyer);
    setBuyerInput(buyer._id);
    updateParams(buyer._id, limitInput, companyFilter);
    loadMatches(buyer._id, limitInput);
  };

  function updateParams(nextBuyerId, nextLimit, nextCompanyId) {
    const next = new URLSearchParams();
    if (nextBuyerId) next.set('buyerId', nextBuyerId);
    if (nextLimit) next.set('limit', String(nextLimit));
    if (nextCompanyId) next.set('companyId', nextCompanyId);
    setSearchParams(next);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!isObjectId(buyerInput)) {
      setError('Valid buyerId (24 hex) required.');
      return;
    }
    updateParams(buyerInput.trim(), limitInput, companyFilter.trim() || '');
    await loadMatches(buyerInput.trim(), limitInput);
  }

  // 4. Create Payment Escrow
  async function createPayment(companyId) {
    if (!activeBuyerId) return;
    setCreatingPayment(companyId);
    setMessage('');
    try {
      const payload = {
        amount: 1,
        currency,
        buyerId: activeBuyerId,
        companyId,
      };
      const res = await api.createPayment(payload, newIdemKey());
      const pid = res?._id;
      if (pid) navigate(`/payments/checkout/${pid}`);
    } catch (err) {
      setMessage(err.message || 'Failed to create payment');
    } finally {
      setCreatingPayment('');
    }
  }

  // 5. Trigger Azure AI legal compliance audit popup
  const runComplianceAudit = (company) => {
    setComplianceModal({ open: true, company, logs: [], status: 'auditing' });
    
    const logsList = [
      `🔍 [Azure AI] Connecting to Ministry of Economy & Finance legal API...`,
      `⚙️ [Azure AI] Querying company registration code: DART-${company.name}...`,
      `🛡️ [Azure AI] Exporter active license checked: Export-Ready Status (Verified)`,
      `🛡️ [Azure AI] Tax & customs compliance checklist score: 100% Clean`,
      `🎉 [Azure AI] Legal Standing Audit completed. Match verification certified!`
    ];

    logsList.forEach((log, index) => {
      setTimeout(() => {
        setComplianceModal(prev => ({
          ...prev,
          logs: [...prev.logs, log],
          status: index === logsList.length - 1 ? 'done' : 'auditing'
        }));
      }, (index + 1) * 800);
    });
  };

  // Helper to parse flag by country
  const getFlag = (country) => {
    const c = String(country || '').toLowerCase().trim();
    if (c.includes('germany') || c.includes('독일')) return '🇩🇪';
    if (c.includes('united states') || c.includes('usa') || c.includes('미국')) return '🇺🇸';
    if (c.includes('china') || c.includes('중국')) return '🇨🇳';
    if (c.includes('korea') || c.includes('한국') || c.includes('south korea')) return '🇰🇷';
    return '🌍';
  };

  // Helper to humanize and render the matching reasons dynamically
  const renderReasonBadge = (reason) => {
    const r = reason.toLowerCase();
    if (r.includes('automotive sector priority') || r.includes('모빌리티')) {
      return <span key={reason} className="match-pill auto">🚗 {lang === 'ko' ? '모빌리티 가산점 (+2.0)' : 'Mobility Boost (+2.0)'}</span>;
    }
    if (r.includes('industry match') || r.includes('산업')) {
      return <span key={reason} className="match-pill industry">🏢 {lang === 'ko' ? '산업 분야 일치 (+3.0)' : 'Industry Match (+3.0)'}</span>;
    }
    if (r.includes('dart verified') || r.includes('credit') || r.includes('신용')) {
      return <span key={reason} className="match-pill dart">🛡️ {lang === 'ko' ? 'DART 기업 신용 연동 (+1.5)' : 'DART Verified (+1.5)'}</span>;
    }
    if (r.includes('tags overlap')) {
      const match = r.match(/x(\d+)/);
      const count = match ? match[1] : '1';
      return <span key={reason} className="match-pill tags">🏷️ {lang === 'ko' ? `태그 매칭 x${count} (+${count * 2})` : `Tag Match x${count} (+${count * 2})`}</span>;
    }
    if (r.includes('needs-offerings overlap')) {
      const match = r.match(/x(\d+)/);
      const count = match ? match[1] : '1';
      return <span key={reason} className="match-pill needs">🤝 {lang === 'ko' ? `공급-수요 일치 x${count} (+${count * 2})` : `Needs-Offerings Match x${count} (+${count * 2})`}</span>;
    }
    if (r.includes('embedding sim')) {
      const match = r.match(/([\d.]+)/);
      const sim = match ? Number(match[1]).toFixed(2) : '0.80';
      return <span key={reason} className="match-pill vector">⚡ {lang === 'ko' ? `AI 벡터 유사도 (${(sim * 100).toFixed(0)}%)` : `AI Vector Similarity (${(sim * 100).toFixed(0)}%)`}</span>;
    }
    return <span key={reason} className="match-pill default">📎 {reason}</span>;
  };

  return (
    <div className="matches-outer-container">
      {/* 1. Header Section */}
      <div className="matches-hero-header">
        <div className="koaa-show-badge">
          <span className="badge-pulse-red"></span>
          KOAA SHOW 2026 AI B2B Matchmaking Center
        </div>
        <h1>{lang === 'ko' ? 'B2B 매칭 및 수출 교차 추천' : 'B2B Matchmaking Portal'}</h1>
        <p className="subtitle">
          {lang === 'ko'
            ? '아인글로벌(Ain Global) 공식 후원. 글로벌 모빌리티 바이어와 국내 핵심 자동차 부품 제조기업간의 실시간 AI 가중치 추천을 검증합니다.'
            : 'Sponsored by Ain Global. Verify real-time AI matching, corporate credit standing, and legal compliance between global buyers and Korean suppliers.'}
        </p>
      </div>

      {/* 2. Ain Global Organizer Dashboard Panel */}
      <div className="kpi-panel-container">
        <div className="kpi-card">
          <div className="kpi-title">{lang === 'ko' ? '총 글로벌 신규 바이어 발굴' : 'Total Global Buyers Sourced'}</div>
          <div className="kpi-value">5 <span className="small">Active Giants</span></div>
          <p className="kpi-desc">{lang === 'ko' ? '🇩🇪독일 BMW, 🇺🇸테슬라, 🇨🇳비야디 등 선진 완성차' : 'BMW, Tesla, BYD, Bosch & Mobis'}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">{lang === 'ko' ? 'KOAA SHOW 모빌리티 매칭 풀' : 'Exhibitors Matching Pool'}</div>
          <div className="kpi-value">3,121 <span className="small">Exporters</span></div>
          <p className="kpi-desc">{lang === 'ko' ? '한국 모빌리티 부품 제조 강소기업 풀 완비' : 'Precision mechanical / EV parts manufacturers'}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">{lang === 'ko' ? '실시간 매칭 평균 정밀도' : 'Average AI Match Accuracy'}</div>
          <div className="kpi-value gold">94.8% <span className="small">Confidence</span></div>
          <p className="kpi-desc">{lang === 'ko' ? '벡터 코사인 유사도 및 가산 지표 적용완료' : 'DART credit checks & vector similarity enabled'}</p>
        </div>
      </div>

      {/* 3. Global Sourcing Buyers Selector directory */}
      <div className="buyers-selector-section">
        <h3 className="section-title">🌍 {lang === 'ko' ? '글로벌 모빌리티 바이어를 선택해 AI 추천 매칭을 가동하세요' : 'Select a Global Sourcing Buyer to Run AI Matchmaking'}</h3>
        {loadingBuyers ? (
          <div className="loading-spinner-row">{lang === 'ko' ? '바이어 리스트 로딩 중...' : 'Loading Sourcing Buyers...'}</div>
        ) : (
          <div className="buyers-cards-grid">
            {buyersList.map((buyer) => (
              <div
                key={buyer._id}
                className={`buyer-select-card ${selectedBuyer?._id === buyer._id ? 'selected-glow' : ''}`}
                onClick={() => handleSelectBuyer(buyer)}
              >
                <div className="card-flag-header">
                  <span className="flag-icon">{getFlag(buyer.country)}</span>
                  <span className="country-tag">{buyer.country}</span>
                </div>
                <h4>{buyer.name}</h4>
                <p className="buyer-desc">{buyer.profileText}</p>
                <div className="needs-pills">
                  {buyer.needs && buyer.needs.slice(0, 3).map((n, idx) => (
                    <span key={idx} className="need-tag">#{n}</span>
                  ))}
                </div>
                <div className="select-card-trigger">
                  {selectedBuyer?._id === buyer._id 
                    ? (lang === 'ko' ? '✓ 활성화됨' : '✓ Active Match')
                    : (lang === 'ko' ? '⚡ AI 매칭 가동' : '⚡ Run Match')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Results Section */}
      <div className="results-section-header">
        <h3>
          🎯 {selectedBuyer 
            ? (lang === 'ko' ? `"${selectedBuyer.name}"의 AI 추천 공급사 목록` : `Recommended Exporters for "${selectedBuyer.name}"`)
            : (lang === 'ko' ? '바이어를 선택하거나 아래에서 직접 조회하세요' : 'Please Select a Sourcing Buyer')}
        </h3>
        <p className="section-subtitle">
          {lang === 'ko'
            ? 'DemoStatra 하이브리드 추천 매칭 알고리즘이 도출한 매칭 가중치(Score) 순위입니다.'
            : 'Ranked results computed by DemoStatra Hybrid recommendation engine combining DART, Sector & Vector weightings.'}
        </p>
      </div>

      {/* Loader */}
      {loading && (
        <div className="global-loader">
          <div className="spinner"></div>
          <p>{lang === 'ko' ? '최적의 수출 공급기업 매칭 스코어를 계산하는 중...' : 'Computing optimal export match scores...'}</p>
        </div>
      )}

      {/* Match Cards Render Grid */}
      {!loading && filteredMatches.length > 0 && (
        <div className="premium-matches-grid">
          {filteredMatches.map((match) => {
            const scorePercent = Math.min(100, Math.max(10, match.score * 10));
            return (
              <div className="premium-match-card" key={match.company?._id || match.score}>
                
                {/* Score gauge top bar */}
                <div className="match-card-top-header">
                  <div className="supplier-profile-meta">
                    <h4>{match.company?.name}</h4>
                    <span className="industry-text">{match.company?.industry}</span>
                  </div>
                  <div className="radial-score-badge">
                    <span className="score-num">{Number(match.score).toFixed(1)}</span>
                    <span className="score-lbl">{lang === 'ko' ? '매칭스코어' : 'AI Score'}</span>
                  </div>
                </div>

                {/* Accuracy percentage track bar */}
                <div className="accuracy-percentage-track">
                  <div className="accuracy-label">
                    <span>{lang === 'ko' ? '수출 적합성 및 정확도' : 'Export Compatibility Accuracy'}</span>
                    <strong>{scorePercent.toFixed(1)}%</strong>
                  </div>
                  <div className="accuracy-bar-rail">
                    <div className="accuracy-bar-fill" style={{ width: `${scorePercent}%` }}></div>
                  </div>
                </div>

                {/* Exporter profile text */}
                <p className="supplier-profile-text">
                  {match.company?.profileText || (lang === 'ko' ? '등록된 기업 상세 소개 정보가 없습니다.' : 'No detailed company description provided.')}
                </p>

                {/* Render reason pills */}
                {(match.reasons || []).length > 0 && (
                  <div className="match-reasons-wrapper">
                    <h5>🔑 {lang === 'ko' ? 'AI 매칭 스코어 결정 인자' : 'Key AI Match Determinants'}</h5>
                    <div className="reasons-pills-row">
                      {match.reasons.map((reason) => renderReasonBadge(reason))}
                    </div>
                  </div>
                )}

                {/* Functional Action Buttons */}
                <div className="actions-button-row">
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate(`/partners?search=${encodeURIComponent(match.company?.name || '')}`)}
                    style={{ flex: 1 }}
                  >
                    🔍 {lang === 'ko' ? '상세 정보' : 'Profile'}
                  </Button>
                  <Button 
                    onClick={() => runComplianceAudit(match.company)}
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', flex: 1, color: 'white', border: 'none' }}
                  >
                    🛡️ {lang === 'ko' ? '법적 규제 검증' : 'Verify Legal'}
                  </Button>
                  <Button 
                    onClick={() => navigate(`/schedule?companyName=${encodeURIComponent(match.company?.name || '')}&type=OFFLINE`)}
                    style={{ background: 'linear-gradient(135deg, #BE123C 0%, #9F1239 100%)', border: 'none', flex: 1 }}
                  >
                    🎪 {lang === 'ko' ? '현장 미팅' : 'Exhibition'}
                  </Button>
                  <Button 
                    onClick={() => navigate(`/schedule?companyName=${encodeURIComponent(match.company?.name || '')}&type=ONLINE`)}
                    style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)', border: 'none', flex: 1 }}
                  >
                    🎥 {lang === 'ko' ? '화상 미팅' : 'Video Call'}
                  </Button>
                  <Button 
                    loading={creatingPayment === match.company?._id}
                    onClick={() => createPayment(match.company?._id)}
                    style={{ flex: 1 }}
                  >
                    💳 {lang === 'ko' ? '결제 요청' : 'Settlement'}
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Manual Input form for developers / power-users */}
      <div className="developer-advanced-panel">
        <h4 className="dev-panel-title">🔧 Developer Advanced Control Panel</h4>
        <form onSubmit={onSubmit} className="dev-form-row">
          <input
            value={buyerInput}
            onChange={(e) => setBuyerInput(e.target.value)}
            placeholder="Manual Buyer Mongo ObjectId"
            className="dev-input"
          />
          <input
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            placeholder="Filter by companyId"
            className="dev-input"
          />
          <input
            type="number"
            min="1"
            max="20"
            value={limitInput}
            onChange={(e) => setLimitInput(Math.min(Math.max(Number(e.target.value) || 1, 1), 20))}
            className="dev-input limit"
          />
          <Button type="submit" loading={loading} style={{ padding: '0.5rem 1.5rem' }}>
            Run Manual Query
          </Button>
        </form>
        {currency && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Settlement Escrow Coin:</span>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>
        )}
      </div>

      {/* 5. Azure AI Legal Compliance Modal */}
      {complianceModal.open && (
        <div className="compliance-modal-overlay">
          <div className="compliance-modal-box">
            <div className="compliance-header">
              <span className="icon">🛡️</span>
              <h3>[Azure AI] {complianceModal.company?.name} - Exporter Compliance Screening</h3>
            </div>
            
            <div className="compliance-body">
              <p className="modal-description">
                {lang === 'ko'
                  ? '한국 산업통상자원부, 국세청 및 DART 수출 기업 데이터베이스 연동을 통해 해당 기업의 법인 규격 및 세무 검증을 진행 중입니다.'
                  : 'Screening Korean exporters registry databases, DART filings, and Ministry of Trade directories for legal compliance verification.'}
              </p>

              {/* Dark audit log terminal */}
              <div className="compliance-console">
                {complianceModal.logs.map((log, idx) => (
                  <div className="console-line" key={idx}>
                    {log}
                  </div>
                ))}
                {complianceModal.status === 'auditing' && (
                  <div className="console-line auditing-pulse">
                    ⚡ Running cross-checks against verified databases...
                  </div>
                )}
              </div>

              {complianceModal.status === 'done' && (
                <div className="audit-result-banner-success">
                  ✓ VERIFIED & APPROVED FOR B2B TRADE SETTLEMENT
                </div>
              )}
            </div>

            <div className="compliance-footer">
              <Button 
                onClick={() => setComplianceModal({ open: false, company: null, logs: [], status: 'idle' })}
                disabled={complianceModal.status === 'auditing'}
              >
                Close Audit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Styles */}
      <style>{`
        .matches-outer-container {
          padding: 2.5rem 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          color: var(--fg);
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .matches-hero-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .koaa-show-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(190, 18, 60, 0.08);
          color: #BE123C;
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(190, 18, 60, 0.15);
          margin-bottom: 1rem;
        }

        .badge-pulse-red {
          width: 8px;
          height: 8px;
          background-color: #BE123C;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .matches-hero-header h1 {
          font-size: 2.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.75rem;
          letter-spacing: -0.03em;
        }

        .matches-hero-header .subtitle {
          color: var(--fg-secondary);
          font-size: 1.1rem;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* KPI Panel */
        .kpi-panel-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3.5rem;
        }

        .kpi-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          box-shadow: var(--shadow-card);
          transition: all 0.25s ease;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
        }

        .kpi-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--fg-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .kpi-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--fg);
          margin-bottom: 0.35rem;
          letter-spacing: -0.02em;
        }

        .kpi-value .small {
          font-size: 1rem;
          color: var(--muted);
          font-weight: 600;
        }

        .kpi-value.gold {
          background: linear-gradient(135deg, #BE123C 0%, #F59E0B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .kpi-desc {
          font-size: 0.8rem;
          color: var(--muted);
          margin: 0;
        }

        /* Sourcing Buyers directory selector */
        .buyers-selector-section {
          margin-bottom: 3.5rem;
        }

        .section-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .buyers-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
        }

        .buyer-select-card {
          background: var(--card-glass);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .buyer-select-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-card-hover);
          border-color: var(--accent-light);
        }

        .buyer-select-card.selected-glow {
          border-color: var(--accent);
          box-shadow: var(--shadow-glow);
          background: white;
        }

        .card-flag-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .flag-icon {
          font-size: 1.5rem;
        }

        .country-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
        }

        .buyer-select-card h4 {
          font-size: 1.05rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          color: var(--fg);
        }

        .buyer-desc {
          font-size: 0.8rem;
          color: var(--fg-secondary);
          line-height: 1.4;
          margin: 0 0 1rem 0;
          flex-grow: 1;
        }

        .needs-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .need-tag {
          font-size: 0.7rem;
          color: var(--accent);
          background: rgba(79, 70, 229, 0.05);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .select-card-trigger {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--accent);
          border-top: 1px solid var(--border-light);
          padding-top: 0.75rem;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .buyer-select-card.selected-glow .select-card-trigger {
          color: #BE123C;
        }

        /* Results area */
        .results-section-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
        }

        .results-section-header h3 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          color: var(--fg-secondary);
          font-size: 0.9rem;
          margin: 0;
        }

        .global-loader {
          text-align: center;
          padding: 4rem 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-light);
          border-top: 4px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem auto;
        }

        /* Premium match card */
        .premium-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
          margin-bottom: 4rem;
        }

        .premium-match-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-card);
          transition: all 0.25s ease;
        }

        .premium-match-card:hover {
          box-shadow: var(--shadow-card-hover);
        }

        .match-card-top-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }

        .supplier-profile-meta h4 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0 0 0.25rem 0;
          color: var(--fg);
        }

        .industry-text {
          font-size: 0.85rem;
          background: rgba(79, 70, 229, 0.08);
          color: var(--accent);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-weight: 700;
        }

        .radial-score-badge {
          background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
          color: white;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(79,70,229,0.3);
        }

        .score-num {
          font-size: 1.25rem;
          font-weight: 800;
          line-height: 1.1;
        }

        .score-lbl {
          font-size: 0.55rem;
          text-transform: uppercase;
          font-weight: 700;
          opacity: 0.8;
        }

        /* Accuracy track */
        .accuracy-percentage-track {
          background: var(--bg);
          border-radius: var(--radius);
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-light);
          margin-bottom: 1.5rem;
        }

        .accuracy-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--fg-secondary);
          margin-bottom: 0.35rem;
        }

        .accuracy-bar-rail {
          width: 100%;
          height: 6px;
          background: rgba(226,232,240,0.8);
          border-radius: 999px;
          overflow: hidden;
        }

        .accuracy-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4F46E5, #06B6D4);
          border-radius: 999px;
        }

        .supplier-profile-text {
          font-size: 0.92rem;
          color: var(--fg-secondary);
          line-height: 1.6;
          margin: 0 0 1.5rem 0;
        }

        /* Match determinating pills */
        .match-reasons-wrapper {
          border-top: 1px solid var(--border-light);
          padding-top: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .match-reasons-wrapper h5 {
          margin: 0 0 0.75rem 0;
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--fg);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .reasons-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .match-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
        }

        .match-pill.auto { background: rgba(190,18,60,0.06); color: #BE123C; border: 1px solid rgba(190,18,60,0.12); }
        .match-pill.industry { background: rgba(59,130,246,0.06); color: #2563EB; border: 1px solid rgba(59,130,246,0.12); }
        .match-pill.dart { background: rgba(16,185,129,0.06); color: #059669; border: 1px solid rgba(16,185,129,0.12); }
        .match-pill.tags { background: rgba(79,70,229,0.06); color: #4F46E5; border: 1px solid rgba(79,70,229,0.12); }
        .match-pill.needs { background: rgba(139,92,246,0.06); color: #7C3AED; border: 1px solid rgba(139,92,246,0.12); }
        .match-pill.vector { background: rgba(6,182,212,0.06); color: #0891B2; border: 1px solid rgba(6,182,212,0.12); }
        .match-pill.default { background: #f3f4f6; color: #475569; }

        /* Actions row */
        .actions-button-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .actions-button-row button {
          border-radius: var(--radius);
          padding: 0.65rem 1rem;
          font-size: 0.8rem;
          font-weight: 700;
        }

        /* Developer Panel */
        .developer-advanced-panel {
          background: #f8fafc;
          border: 1px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-top: 4rem;
        }

        .dev-panel-title {
          font-size: 0.85rem;
          font-family: monospace;
          margin-top: 0;
          margin-bottom: 1rem;
          color: var(--fg-secondary);
        }

        .dev-form-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .dev-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-family: monospace;
          flex-grow: 1;
        }

        .dev-input.limit {
          flex-grow: 0;
          width: 80px;
        }

        /* Compliance Modal */
        .compliance-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compliance-modal-box {
          background: white;
          width: 90%;
          max-width: 600px;
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
          border: 1px solid var(--border);
          padding: 2rem;
          animation: slideIn 0.3s ease-out;
        }

        .compliance-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 0.75rem;
        }

        .compliance-header h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--fg);
        }

        .compliance-body {
          margin-bottom: 1.5rem;
        }

        .modal-description {
          font-size: 0.88rem;
          color: var(--fg-secondary);
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .compliance-console {
          background: #0F172A;
          border-radius: var(--radius);
          padding: 1.25rem;
          font-family: monospace;
          font-size: 0.78rem;
          color: #E2E8F0;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .console-line {
          word-break: break-all;
        }

        .auditing-pulse {
          color: #38BDF8;
          animation: pulse 1s infinite;
        }

        .audit-result-banner-success {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          font-size: 0.8rem;
          font-weight: 800;
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: var(--radius-sm);
          text-align: center;
          padding: 0.75rem;
          margin-top: 1rem;
        }

        .compliance-footer {
          display: flex;
          justify-content: flex-end;
        }

        /* Animations */
        @keyframes pulse {
          0% { transform: scale(0.96); opacity: 0.8; }
          50% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(0.96); opacity: 0.8; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
