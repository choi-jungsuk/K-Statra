import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { API_BASE_URL } from '../api.js';

/* ──────────────────────────────────────────────
   Mode configuration — single source of truth
────────────────────────────────────────────── */
const RECRUITMENT_MODES = {
  'koaa-show': {
    icon: '🏢',
    tone: 'koaa',
    labelEn: 'demostatra EXHIBITOR',
    labelKo: 'demostatra 참가업체',
    titleKo: 'demostatra 부스 참가업체 유치',
    titleEn: 'demostatra Exhibitor Recruitment',
    descKo: 'demostatra 전시 분야에 적합한 국내 기업 후보를 발굴하고, 기업 기본정보·주력품목·담당자 연락정보·데이터 출처를 정리합니다.',
    descEn: 'Find prospective Korean exhibitors for demostatra and organize company info, key products, contact details and data sources.',
    tagsKo: ['자동차 부품·모빌리티', '참가기업 후보 발굴', 'Excel 목록 생성'],
    tagsEn: ['Auto Parts · Mobility', 'Exhibitor Discovery', 'Excel Export'],
    ctaKo: 'demostatra 업체 유치 시작하기 →',
    ctaEn: 'Start demostatra Recruitment →',
    agentIntroKo: 'demostatra 부스 참가기업 후보 발굴을 지원합니다. 원하는 업종, 품목, 지역, 수출시장 조건을 입력해 주세요.',
    agentIntroEn: 'I help identify prospective exhibitors for demostatra. Please enter industry, product, region or export market conditions.',
    quickPromptsKo: [
      '국내 K-뷰티 업체를 찾아줘',
      '국내 의료기기 업체를 찾아줘',
      '국내 보안장비 업체를 찾아줘',
    ],
    quickPromptsEn: [
      'Find Korean automotive electronics manufacturers',
      'List auto parts companies with North America export records',
      'Organize demostatra candidate companies by industry',
    ],
    placeholderKo: '원하는 업종, 품목, 지역 조건을 자유롭게 입력하세요',
    placeholderEn: 'Describe the industry, product or region you need',
    exportFileNameKo: 'KOAA_SHOW_Exhibitor_Candidates',
    exportFileNameEn: 'KOAA_SHOW_Exhibitor_Candidates',
    sheetNameKo: 'demostatra 후보',
    sheetNameEn: 'demostatra Candidates',
  },
  'trade-mission': {
    icon: '🌏',
    tone: 'trade',
    labelEn: 'OVERSEAS TRADE MISSION',
    labelKo: '해외시장개척단',
    titleKo: '해외시장개척단 참가기업 유치',
    titleEn: 'Trade Mission Company Recruitment',
    descKo: '목표 국가·도시·산업 분야에 맞는 국내 수출기업 후보를 발굴하고, 시장개척단 참가 제안에 필요한 기업·품목·수출 관련 정보를 정리합니다.',
    descEn: 'Discover Korean export companies matching target country, city and industry sector for trade mission proposals.',
    tagsKo: ['목표시장 기반 탐색', '국내 수출기업 후보', '담당자 정보 정리'],
    tagsEn: ['Target Market Search', 'Korean Exporters', 'Contact Organization'],
    ctaKo: '시장개척단 업체 유치 시작하기 →',
    ctaEn: 'Start Trade Mission Recruitment →',
    agentIntroKo: '해외시장개척단 참가기업 후보 발굴을 지원합니다. 목표 국가·도시, 산업 분야, 희망 기업 조건을 입력해 주세요.',
    agentIntroEn: 'I help identify candidate companies for overseas trade missions. Please describe the target country, city, industry and desired company profile.',
    quickPromptsKo: [
      '멕시코 시장개척단 검토용 국내 자동차부품 기업 후보를 찾아줘',
      '독일 시장개척단 검토용 국내 미래차·전장 기업 후보를 찾아줘',
      '베트남 시장개척단 검토용 국내 특수차량·모빌리티 기업 후보를 찾아줘',
    ],
    quickPromptsEn: [
      'Find domestic auto parts candidates for Mexico trade mission',
      'List Korean future mobility & electronics makers for Germany trade mission',
      'Organize Korean special vehicle & mobility companies for Vietnam mission',
    ],
    placeholderKo: '목표 국가, 도시, 산업 분야를 자유롭게 입력하세요',
    placeholderEn: 'Describe target country, city and industry sector',
    exportFileNameKo: 'Trade_Mission_Company_Candidates',
    exportFileNameEn: 'Trade_Mission_Company_Candidates',
    sheetNameKo: '시장개척단 후보',
    sheetNameEn: 'Trade Mission Candidates',
  },
};

const VALID_MODES = Object.keys(RECRUITMENT_MODES);

const RESULT_COLUMN_DEFS = {
  type: { ko: '구분', en: 'Type' },
  company_name: { ko: '기업명', en: 'Company' },
  name: { ko: '기업명', en: 'Company' },
  main_product: { ko: '주력 품목', en: 'Main Product' },
  industry: { ko: '산업', en: 'Industry' },
  target_country: { ko: '타겟 국가', en: 'Target' },
  country: { ko: '국가', en: 'Country' },
  region: { ko: '지역', en: 'Region' },
  website: { ko: '웹사이트', en: 'Website' },
  email: { ko: '이메일', en: 'Email' },
  source: { ko: '출처', en: 'Source' },
  status: { ko: '상태', en: 'Status' },
  koaa_product_group_label: { ko: 'KOAA 제품군', en: 'KOAA Product Group' },
  koaa_product_source_text: { ko: '제품 분류 근거', en: 'Product Evidence' },
  'original_data.source_group': { ko: '수집 출처', en: 'Data Source' },
};

const DEFAULT_RESULT_COLUMNS = [
  'type',
  'company_name',
  'main_product',
  'target_country',
  'email',
  'source',
  'status',
];

function normalizeResultColumns(columns) {
  if (!Array.isArray(columns)) return DEFAULT_RESULT_COLUMNS;
  const supported = columns.filter((column) => RESULT_COLUMN_DEFS[column]);
  return supported.length > 0 ? supported : DEFAULT_RESULT_COLUMNS;
}

function getColumnValue(item, column, lang) {
  if (column === 'company_name' || column === 'name') {
    return item.company_name || item.name || '—';
  }
  if (column === 'main_product') return item.main_product || item.industry || '—';
  if (column === 'target_country') return item.target_country || item.country || '—';
  if (column === 'source') {
    return item.source || item.original_data?.source_group || (lang === 'ko' ? '출처 미확인' : 'Unverified');
  }
  if (column === 'original_data.source_group') {
    return item.original_data?.source_group || item.source || (lang === 'ko' ? '출처 미확인' : 'Unverified');
  }
  if (column === 'type') {
    if (item.type === 'domestic') return lang === 'ko' ? '국내' : 'Domestic';
    if (item.type === 'overseas') return lang === 'ko' ? '해외' : 'Overseas';
  }
  return item[column] ?? '—';
}

/* ──────────────────────────────────────────────
   Shared Recruitment Workspace component
────────────────────────────────────────────── */
function RecruitmentWorkspace({ mode, config, lang, onBack }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: lang === 'ko' ? config.agentIntroKo : config.agentIntroEn,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [resultColumns, setResultColumns] = useState(DEFAULT_RESULT_COLUMNS);
  const [resultMeta, setResultMeta] = useState(null);
  const [resultStatus, setResultStatus] = useState('idle');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCompanyItem, setSelectedCompanyItem] = useState(null);
  // Trade Mission Market & Sector Constants
  const TRADE_MISSION_MARKET_OPTIONS = [
    { region: '북미', items: [{ id: 'us', label: '미국' }, { id: 'mexico', label: '멕시코' }, { id: 'canada', label: '캐나다' }] },
    { region: '유럽', items: [{ id: 'germany', label: '독일' }, { id: 'france', label: '프랑스' }, { id: 'spain', label: '스페인' }] },
    { region: '동유럽', items: [{ id: 'poland', label: '폴란드' }, { id: 'hungary', label: '헝가리' }, { id: 'czech', label: '체코' }] },
    { region: '아시아', items: [{ id: 'vietnam', label: '베트남' }, { id: 'indonesia', label: '인도네시아' }, { id: 'thailand', label: '태국' }] },
    { region: '중동', items: [{ id: 'uae', label: 'UAE' }, { id: 'oman', label: '오만' }] },
    { region: '중남미', items: [{ id: 'brazil', label: '브라질' }, { id: 'chile', label: '칠레' }, { id: 'panama', label: '파나마' }] },
    { region: 'CIS', items: [{ id: 'uzbekistan', label: '우즈베키스탄' }, { id: 'kazakhstan', label: '카자흐스탄' }] },
    { region: '아프리카', items: [{ id: 'kenya', label: '케냐' }, { id: 'nigeria', label: '나이지리아' }, { id: 'egypt', label: '이집트' }, { id: 'morocco', label: '모로코' }] },
  ];

  const TRADE_MISSION_SECTOR_OPTIONS = [
    { id: 'auto_parts', label: '자동차부품' },
    { id: 'future_mobility', label: '미래차·전장' },
    { id: 'special_vehicle', label: '특수차량·모빌리티' },
    { id: 'manufacturing_material', label: '자동차 제조기술·소재' },
  ];

  const [selectedCountry, setSelectedCountry] = useState('멕시코');
  const [selectedSector, setSelectedSector] = useState('자동차부품');
  const [axProfileState, setAxProfileState] = useState({
    loading: false,
    available: false,
    status: null,
    profile: null,
    hasPdf: false,
  });

  // Email Campaign States
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState('(광고) demostatra 2026 참가 안내 및 글로벌 B2B 매칭 서비스');
  const [emailBody, setEmailBody] = useState(
    '안녕하세요, {{company_name}} 담당자님.\n\n주식회사 그란오소AI 입니다.\ndemostatra 2026 자동차 및 산업 부품 글로벌 전시회 참가를 안내해 드립니다.\n\n첨부된 브로슈어를 확인해 주시고, B2B 바이어 매칭 지원을 희망하시는 경우 회신 부탁드립니다.\n\n감사합니다.'
  );
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [createdCampaignId, setCreatedCampaignId] = useState(null);
  const [confirmCheck1, setConfirmCheck1] = useState(false);
  const [confirmCheck2, setConfirmCheck2] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [campaignActionMsg, setCampaignActionMsg] = useState(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);

  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const BASE_URL = API_BASE_URL;

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentData]);

  // Reset when mode changes
  useEffect(() => {
    setMessages([
      {
        role: 'agent',
        text: lang === 'ko' ? config.agentIntroKo : config.agentIntroEn,
      },
    ]);
    setCurrentData(null);
    setResultColumns(DEFAULT_RESULT_COLUMNS);
    setResultMeta(null);
    setResultStatus('idle');
    setInput('');
    setSelectedCompanyId(null);
    setSelectedCompanyItem(null);
    setAxProfileState({ loading: false, available: false, status: null, profile: null, hasPdf: false });
    setSelectedRecipientIds([]);
    setShowEmailComposer(false);
    setAttachments([]);
    setCampaignActionMsg(null);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedCompanyId(null);
    setSelectedCompanyItem(null);
    setAxProfileState({ loading: false, available: false, status: null, profile: null, hasPdf: false });
    setSelectedRecipientIds([]);
    setShowEmailComposer(false);
    setAttachments([]);
    setCampaignActionMsg(null);
  }, [currentData]);

  const handleToggleRecipient = (compId) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    );
  };

  const handleToggleSelectAll = () => {
    if (!currentData || currentData.length === 0) return;
    const allIds = currentData.map((item) => item.companyId || item._id);
    if (selectedRecipientIds.length === allIds.length) {
      setSelectedRecipientIds([]);
    } else {
      setSelectedRecipientIds(allIds);
    }
  };

  const validateAndAddFiles = (newFiles) => {
    const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
    const BLOCKED_EXTS = ['exe', 'bat', 'cmd', 'com', 'msi', 'js', 'vbs', 'ps1', 'sh', 'html', 'htm', 'docm', 'xlsm', 'pptm'];

    const fileList = Array.from(newFiles);
    if (attachments.length + fileList.length > 5) {
      alert('첨부파일은 최대 5개까지만 가능합니다.');
      return;
    }

    let currentSize = attachments.reduce((sum, f) => sum + f.size, 0);
    const validToAdd = [];

    for (const f of fileList) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (BLOCKED_EXTS.includes(ext)) {
        alert(`보안상 허용되지 않는 파일 형식입니다: .${ext}`);
        return;
      }
      if (!ALLOWED_EXTS.includes(ext)) {
        alert(`허용되지 않는 파일 형식입니다: .${ext} (.pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .png, .jpg, .jpeg만 가능)`);
        return;
      }
      if (f.size > 8 * 1024 * 1024) {
        alert(`파일당 용량은 8MB 이하여야 합니다. (${f.name})`);
        return;
      }
      currentSize += f.size;
      if (currentSize > 15 * 1024 * 1024) {
        alert('전체 첨부파일 용량은 15MB를 초과할 수 없습니다.');
        return;
      }
      validToAdd.push({
        file: f,
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        size: f.size,
        type: f.type,
      });
    }

    setAttachments((prev) => [...prev, ...validToAdd]);
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const ensureCampaignCreated = async () => {
    if (selectedRecipientIds.length === 0) {
      alert('이메일을 발송할 수신 업체를 1건 이상 선택해 주세요.');
      return null;
    }

    try {
      const res = await fetch(`${BASE_URL}/email-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          bodyTemplate: emailBody,
          selectedCompanyIds: selectedRecipientIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '캠페인 생성 실패');

      const campaignId = data._id;
      setCreatedCampaignId(campaignId);

      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((att) => formData.append('files', att.file));
        const attRes = await fetch(`${BASE_URL}/email-campaigns/${campaignId}/attachments`, {
          method: 'POST',
          body: formData,
        });
        if (!attRes.ok) {
          const attData = await attRes.json();
          throw new Error(attData.message || '첨부파일 업로드 실패');
        }
      }
      return campaignId;
    } catch (err) {
      alert(`오류: ${err.message}`);
      return null;
    }
  };

  const handleTestSend = async () => {
    setIsCampaignLoading(true);
    setCampaignActionMsg(null);
    const campaignId = await ensureCampaignCreated();
    if (!campaignId) {
      setIsCampaignLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/email-campaigns/${campaignId}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (res.ok) {
        setCampaignActionMsg({
          type: 'success',
          text: result.message || `내부 테스트 발송 완료 (${result.mode} 모드)`,
        });
      } else {
        setCampaignActionMsg({
          type: 'error',
          text: result.message || '테스트 발송 실패',
        });
      }
    } catch (err) {
      setCampaignActionMsg({ type: 'error', text: `오류: ${err.message}` });
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const handleOpenReview = async () => {
    setIsCampaignLoading(true);
    setCampaignActionMsg(null);
    const campaignId = await ensureCampaignCreated();
    if (!campaignId) {
      setIsCampaignLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/email-campaigns/${campaignId}/review`);
      const data = await res.json();
      if (res.ok) {
        setReviewData(data);
        setConfirmCheck1(false);
        setConfirmCheck2(false);
        setConfirmInput('');
        setShowReviewModal(true);
      } else {
        alert(`검토 실패: ${data.message}`);
      }
    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const handleExecuteSend = async () => {
    if (!reviewData || !createdCampaignId) return;

    setIsCampaignLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/email-campaigns/${createdCampaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationToken: reviewData.confirmationToken }),
      });
      const result = await res.json();
      setShowReviewModal(false);
      if (res.ok) {
        setCampaignActionMsg({
          type: 'success',
          text: `[${result.mode.toUpperCase()}] 발송 처리가 완료되었습니다. (성공: ${result.stats.totalSent}건, 실패: ${result.stats.totalFailed}건)`,
        });
      } else {
        setCampaignActionMsg({
          type: 'error',
          text: `발송 실패: ${result.message}`,
        });
      }
    } catch (err) {
      setCampaignActionMsg({ type: 'error', text: `오류: ${err.message}` });
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const handleSelectCompany = async (item) => {
    const compId = item.companyId || item._id;
    if (selectedCompanyId === compId) return;

    setSelectedCompanyId(compId);
    setSelectedCompanyItem(item);
    setAxProfileState({ loading: true, available: false, status: null, profile: null, hasPdf: false });

    if (!compId) {
      setAxProfileState({ loading: false, available: false, status: 'not_started', profile: null, hasPdf: false });
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/companies/${compId}/ax-profile`);
      if (res.ok) {
        const data = await res.json();
        setAxProfileState({
          loading: false,
          available: !!data.available,
          status: data.status || 'not_started',
          profile: data.profile || null,
          hasPdf: !!data.hasPdf,
        });
      } else {
        setAxProfileState({ loading: false, available: false, status: 'not_started', profile: null, hasPdf: false });
      }
    } catch {
      setAxProfileState({ loading: false, available: false, status: 'not_started', profile: null, hasPdf: false });
    }
  };

  const handlePdfPrint = async () => {
    if (!selectedCompanyId || !axProfileState.hasPdf) return;

    try {
      const res = await fetch(`${BASE_URL}/companies/${selectedCompanyId}/ax-profile/pdf`);
      if (!res.ok) {
        alert(lang === 'ko' ? 'AX 프로필 PDF를 내려받을 수 없습니다.' : 'Unable to download the AX profile PDF.');
        return;
      }
      const blob = await res.blob();

      // 서버 Content-Disposition 에서 파일명 추출, 없으면 회사명 기반
      let fileName = null;
      const disp = res.headers.get('content-disposition') || '';
      const utf8Match = disp.match(/filename\*=UTF-8''([^;]+)/i);
      const plainMatch = disp.match(/filename="?([^";]+)"?/i);
      if (utf8Match) fileName = decodeURIComponent(utf8Match[1]);
      else if (plainMatch) fileName = plainMatch[1];
      if (!fileName) {
        const companyName =
          axProfileState.profile?.companyNameKo ||
          selectedCompanyItem?.company_name ||
          selectedCompanyItem?.name ||
          '기업';
        const dateStr = new Date().toISOString().split('T')[0];
        fileName = `${companyName}_AX프로필_${dateStr}.pdf`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert(lang === 'ko' ? 'AX 프로필 PDF 다운로드 중 오류가 발생했습니다.' : 'Error downloading AX profile PDF.');
    }
  };

  const handleExportExcel = async () => {
    if (resultMeta?.isSummary) {
      const dateStr = new Date().toISOString().split('T')[0];
      const suggestedName = `KOAA_SHOW_6대_제품군_총괄표_${dateStr}.xlsx`;
      const sheetName = '총괄표';

      const exportRows = resultMeta.categories.map((cat) => ({
        '분류 (Category)': cat.categoryName,
        '업체수 (Count)': cat.count,
        '대표기업 (Companies)': cat.companyNames.join(', ')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      try {
        if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{ description: 'Excel Workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
          await writable.close();
        } else {
          XLSX.writeFile(workbook, suggestedName);
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('Excel save failed:', err);
      }
      return;
    }

    if (!currentData || currentData.length === 0) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const baseName =
      mode === 'koaa-show'
        ? lang === 'ko' ? 'KOAA_SHOW_지사화업체_이메일목록' : 'KOAA_SHOW_Exhibitor_Candidates'
        : resultMeta?.targetMarketLabel && resultMeta?.sectorLabel
          ? `${resultMeta.targetMarketLabel}_${resultMeta.sectorLabel}_시장개척단_후보기업`
          : lang === 'ko' ? '해외시장개척단_참가기업_목록' : 'Trade_Mission_Company_Candidates';
    const cleanBaseName = baseName.replace(/[/\\:*?"<>|]/g, '_');
    const suggestedName = `${cleanBaseName}_${dateStr}.xlsx`;
    const sheetName = lang === 'ko' ? config.sheetNameKo : config.sheetNameEn;

    const exportRows = currentData.map((item) =>
      Object.fromEntries(
        resultColumns.map((column) => {
          const definition = RESULT_COLUMN_DEFS[column];
          const header = `${definition.ko} (${definition.en})`;
          return [header, getColumnValue(item, column, lang)];
        })
      )
    );
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    try {
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: 'Excel Workbook',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(
          new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        );
        await writable.close();
      } else {
        XLSX.writeFile(workbook, suggestedName);
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return;
      }
      console.error('Excel save failed:', err);
    }
  };

/* ──────────────────────────────────────────────
   Fallback AI Company DB Removed
────────────────────────────────────────────── */

  const handleSend = async (e, overrideText) => {
    e?.preventDefault();
    const userMessage = (overrideText || input).trim();
    if (!userMessage) return;

    if (userMessage === 'demostatra 참가 권유 업체를 업종별로 추천해 줘') {
      setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
      setInput('');
      setIsLoading(true);
      setCurrentData(null);
      setResultMeta(null);
      setResultStatus('idle');

      try {
        const response = await fetch(`${BASE_URL}/companies/cluster-stats/summary`);
        if (response.ok) {
          const result = await response.json();
          setResultMeta({
            isSummary: true,
            total: result.domesticCompanies.total,
            classified: result.domesticCompanies.productClassification.classified,
            unclassified: result.domesticCompanies.productClassification.unclassified,
            categories: result.domesticCompanies.categories
          });
          setMessages((prev) => [
            ...prev,
            {
              role: 'agent',
              text: lang === 'ko' ? 'demostatra 6대 제품군 총괄표를 표시합니다.' : 'Displaying demostatra 6-product group summary.',
            }
          ]);
          setResultStatus('success');
        } else {
          throw new Error('Summary fetch failed');
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            text: lang === 'ko' ? '실데이터 검색에 실패했습니다 · 다시 시도' : 'Failed to search real data · Try again',
          }
        ]);
        setResultStatus('empty');
      }
      setIsLoading(false);
      return;
    }

    // Prefix mode context for the backend
    const contextualQuery =
      mode === 'koaa-show'
        ? `[업무유형: demostatra 부스 참가업체 유치] ${userMessage}`
        : `[업무유형: 해외시장개척단 참가기업 유치] ${userMessage}`;

    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);
    setCurrentData(null);
    setResultMeta(null);
    setResultStatus('idle');

    let result = null;
    let succeeded = false;

    try {
      const response = await fetch(`${BASE_URL}/agent/data-engineer-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: contextualQuery }),
      });

      if (response.ok) {
        result = await response.json();
        succeeded = result && result.success !== false;
      }
    } catch (err) {
      console.warn('Backend endpoint fetch failed', err);
    }

    if (!succeeded || !result) {
      result = {
        success: false,
        message: lang === 'ko'
          ? '실데이터 검색에 실패했습니다 · 다시 시도'
          : 'Failed to search real data · Try again',
        data: [],
        columns: [],
        meta: { total: 0 },
      };
      succeeded = false;
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    setMessages((prev) => [
      ...prev,
      {
        role: 'agent',
        text:
          result.message ||
          (rows.length > 0
            ? lang === 'ko'
              ? `${rows.length}건의 기업 데이터를 찾았습니다.`
              : `Found ${rows.length} company records.`
            : lang === 'ko'
              ? '조건에 맞는 업체가 없습니다. 검색 조건을 조정해 주세요.'
              : 'No matching companies found. Please adjust your criteria.'),
      },
    ]);
    
    if (succeeded) {
      setResultColumns(normalizeResultColumns(result.columns));
      setResultMeta(result.meta || null);
      if (rows.length > 0) {
        setCurrentData(rows);
        setResultStatus('success');
      } else {
        setCurrentData([]);
        setResultStatus('empty');
      }
    } else {
      setResultColumns([]);
      setResultMeta(null);
      setCurrentData(null);
      setResultStatus('empty');
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = lang === 'ko' ? config.quickPromptsKo : config.quickPromptsEn;
  const agentLabel = lang === 'ko'
    ? (mode === 'koaa-show' ? 'demostatra 유치 Agent' : '해외시장개척단 유치 Agent')
    : (mode === 'koaa-show' ? 'demostatra Agent' : 'Trade Mission Agent');
  const placeholder = lang === 'ko' ? config.placeholderKo : config.placeholderEn;

  return (
    <div className="recruitment-workspace">
      {/* Workspace header */}
      <div className="recruitment-workspace-header">
        <button
          type="button"
          className={`rw-back-btn ${config.tone}`}
          onClick={onBack}
        >
          ← {lang === 'ko' ? '유치 유형 다시 선택' : 'Change Recruitment Type'}
        </button>
        <div className="rw-agent-label">
          <span className="rw-agent-icon" aria-hidden="true">{config.icon}</span>
          <div>
            <p className="rw-agent-mode-tag">
              {lang === 'ko' ? config.labelKo : config.labelEn}
            </p>
            <h2 className="rw-agent-title">
              {lang === 'ko' ? config.titleKo : config.titleEn}
            </h2>
          </div>
        </div>

        {mode === 'trade-mission' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', width: '100%' }}>
            <div style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: '#EEF2FF', borderRadius: '10px', border: '1px solid #C7D2FE', width: '100%' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#3730A3', display: 'flex', alignItems: 'center', marginRight: '6px' }}>
                해외시장개척단 업무:
              </span>
              <button
                type="button"
                style={{ background: '#4F46E5', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
              >
                🔍 1. 후보기업 발굴
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/trade-mission-events')}
                style={{ background: '#FFF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
              >
                🔗 2. 온라인 참가신청서 만들기
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/trade-mission-applications')}
                style={{ background: '#FFF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
              >
                📋 3. 신청서 접수현황 (관리자)
              </button>
            </div>

            {/* 23 Targets x 4 Sectors Selector Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#FFF', padding: '10px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', width: '100%', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap' }}>
                🎯 23개 국가 × 4대 품목 조합 탐색:
              </span>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                목표국가
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, background: '#FFF' }}
                >
                  {TRADE_MISSION_MARKET_OPTIONS.map((grp) => (
                    <optgroup key={grp.region} label={grp.region}>
                      {grp.items.map((item) => (
                        <option key={item.id} value={item.label}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                품목군
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, background: '#FFF' }}
                >
                  {TRADE_MISSION_SECTOR_OPTIONS.map((sec) => (
                    <option key={sec.id} value={sec.label}>
                      {sec.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => handleSend(null, `${selectedCountry} 시장개척단 검토용 국내 ${selectedSector} 기업 후보를 찾아줘`)}
                style={{ padding: '6px 16px', background: '#312E81', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
              >
                🔍 후보기업 찾기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat + Preview grid */}
      <div className={`recruitment-workspace-grid ${currentData ? 'has-data' : ''}`}>
        {/* Chat Panel */}
        <div className="recruitment-chat-panel">
          {/* Messages */}
          <div className="rw-messages" ref={messagesContainerRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`rw-message ${msg.role === 'user' ? 'user' : 'agent'}`}
              >
                {msg.role === 'agent' && (
                  <div className={`rw-agent-name ${config.tone}`}>{agentLabel}</div>
                )}
                <div className="rw-bubble">{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="rw-message agent">
                <div className={`rw-agent-name ${config.tone}`}>{agentLabel}</div>
                <div className="rw-bubble rw-loading">
                  <span className="spinner" />
                  <span>{lang === 'ko' ? '데이터를 검색하고 있습니다…' : 'Searching data…'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts + input */}
          <div className="rw-input-area">
            <div className="rw-quick-prompts">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={`rw-quick-btn ${config.tone}`}
                  onClick={() => handleSend(null, p)}
                >
                  <span style={{ color: '#94A3B8', fontWeight: 900, marginRight: '4px' }}>Q.</span>{p}
                </button>
              ))}
            </div>
            <div className="rw-textarea-row">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="rw-textarea"
                rows={3}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`rw-send-btn ${config.tone}`}
              >
                {lang === 'ko' ? '전송' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Preview Panel */}
        {(currentData || resultMeta?.isSummary) && (
          <div className="recruitment-data-panel">
            <div className="rdp-header">
              <div>
                <h3 className="rdp-title">
                  {lang === 'ko' ? '데이터 미리보기' : 'Data Preview'}
                </h3>
                {resultMeta?.targetMarketLabel && resultMeta?.sectorLabel && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0 6px 0', flexWrap: 'wrap' }}>
                    <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px', border: '1px solid #C7D2FE' }}>
                      🌍 목표시장: {resultMeta.targetMarketLabel}
                    </span>
                    <span style={{ background: '#F0FDF4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px', border: '1px solid #BBF7D0' }}>
                      🚗 품목군: {resultMeta.sectorLabel}
                    </span>
                    <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11px', border: '1px solid #FDE68A' }}>
                      ⚠️ DB 텍스트 기반 1차 후보 ({resultMeta.targetMarketLabel} 진출의향/수출실적 추가확인 필요)
                    </span>
                  </div>
                )}
                <span className="rdp-count">
                  {lang === 'ko'
                    ? (resultMeta?.isSummary 
                        ? `총 ${resultMeta?.total || 0}개 유효기업 중 카테고리별 분류 표시` 
                        : `총 ${resultMeta?.totalMatched ?? currentData?.length}건 중 ${currentData?.length}건 표시 (유효 이메일 ${resultMeta?.validEmailCount ?? 0}건)`)
                    : (resultMeta?.isSummary 
                        ? `Showing breakdown for ${resultMeta?.total || 0} valid companies` 
                        : `Showing ${currentData?.length} of ${resultMeta?.totalMatched ?? currentData?.length} records (${resultMeta?.validEmailCount ?? 0} with emails)`)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={!resultMeta?.isSummary && (!currentData || currentData.length === 0)}
                  className="rdp-export-btn"
                  title={lang === 'ko' ? 'Excel 저장 위치 및 파일명 선택' : 'Save As Excel'}
                >
                  📊 {lang === 'ko' ? 'Excel 다른 이름으로 저장' : 'Save As Excel'}
                </button>

                <button
                  type="button"
                  onClick={handlePdfPrint}
                  disabled={!selectedCompanyId || !axProfileState.hasPdf || axProfileState.loading}
                  className={`rdp-pdf-btn ${axProfileState.hasPdf ? 'active' : 'disabled'}`}
                  title={
                    !selectedCompanyId
                      ? (lang === 'ko' ? 'PDF를 내려받을 기업을 먼저 선택해 주세요.' : 'Please select a company first.')
                      : !axProfileState.hasPdf
                        ? (lang === 'ko' ? '선택한 기업에 AX 프로필 PDF가 없습니다.' : 'No AX profile PDF for selected company.')
                        : (lang === 'ko' ? '선택한 기업 AX 프로필 PDF 다운로드' : 'Download Selected AX Profile PDF')
                  }
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: '1px solid var(--border)',
                    background: axProfileState.hasPdf ? '#625AF5' : '#e2e8f0',
                    color: axProfileState.hasPdf ? '#ffffff' : '#64748b',
                    cursor: axProfileState.hasPdf ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📄 {
                    axProfileState.loading
                      ? (lang === 'ko' ? '프로필 확인 중…' : 'Checking profile…')
                      : !selectedCompanyId
                        ? (lang === 'ko' ? 'AX 프로필 (미선택)' : 'AX Profile (Unselected)')
                        : !axProfileState.hasPdf
                          ? (lang === 'ko' ? 'AX 프로필 (없음)' : 'AX Profile (No PDF)')
                          : (lang === 'ko' ? 'AX 프로필 PDF 다운로드' : 'Download AX Profile PDF')
                  }
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailComposer(!showEmailComposer)}
                  className={`rdp-email-btn ${showEmailComposer ? 'active' : ''}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: '1px solid #625AF5',
                    background: showEmailComposer ? '#625AF5' : '#ffffff',
                    color: showEmailComposer ? '#ffffff' : '#625AF5',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ✉️ {showEmailComposer ? (lang === 'ko' ? '메일 작성 접기' : 'Hide Email Composer') : (lang === 'ko' ? '업체유치 메일 작성' : 'Compose Recruitment Email')}
                </button>
              </div>
            </div>

            {/* Fallback applied warning badge */}
            {resultMeta?.fallbackApplied && (
              <div
                style={{
                  padding: '10px 14px',
                  margin: '12px 16px 0',
                  borderRadius: '8px',
                  background: '#fff7ed',
                  border: '1px solid #ffedd5',
                  color: '#c2410c',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚠</span>
                <span>북미 수출 경험 미확인 · 진출 검토 후보</span>
              </div>
            )}

            {/* Collapsible Email Campaign Composer Panel */}
            {showEmailComposer && (
              <div
                className="email-campaign-composer"
                style={{
                  padding: '20px',
                  background: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                    ✉️ {mode === 'koaa-show' ? 'demostatra' : '해외시장개척단'} 업체유치 메일 작성
                  </h4>
                  <div style={{ fontSize: '12px', background: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                    선택 수신자: {selectedRecipientIds.length}건
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      발신자 (From)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="GRANOSOAI <contact@granosoai.com>"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f1f5f9', color: '#64748b' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      회신 주소 (Reply-To)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="contact@granosoai.com"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f1f5f9', color: '#64748b' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    메일 제목 (Subject)
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="메일 제목을 입력하세요"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      메일 본문 (Body)
                    </label>
                    <span style={{ fontSize: '11px', color: '#625AF5', fontWeight: 600 }}>
                      사용 가능 변수: &#123;&#123;company_name&#125;&#125;
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', lineHeight: 1.5, resize: 'vertical' }}
                  />
                </div>

                {/* Attachment Drop Zone */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    첨부파일 드래그앤드롭 (최대 5개, 파일당 8MB, 전체 15MB 이하)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => validateAndAddFiles(e.target.files)}
                    style={{ display: 'none' }}
                  />

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); validateAndAddFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? '2px dashed #625AF5' : '2px dashed #cbd5e1',
                      background: isDragging ? 'rgba(98, 90, 245, 0.08)' : '#ffffff',
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '28px', display: 'block', marginBottom: '4px' }}>📎</span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      demostatra 브로슈어 또는 첨부파일을 여기에 드롭하세요
                    </p>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      또는 클릭하여 파일 선택 (.pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .png, .jpg, .jpeg)
                    </span>
                  </div>

                  {/* Attachment Files List */}
                  {attachments.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📄</span>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{att.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              ({(att.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                          >
                            삭제 ✕
                          </button>
                        </div>
                      ))}
                      <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', marginTop: '2px' }}>
                        전체 첨부 용량: {(attachments.reduce((sum, a) => sum + a.size, 0) / (1024 * 1024)).toFixed(2)} MB / 15 MB
                      </div>
                    </div>
                  )}
                </div>

                {/* Campaign Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}
                  >
                    👁️ 미리보기
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSend}
                    disabled={isCampaignLoading}
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}
                  >
                    🧪 테스트 발송
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenReview}
                    disabled={isCampaignLoading || selectedRecipientIds.length === 0}
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, borderRadius: '6px', border: 'none', background: '#625AF5', color: '#ffffff', cursor: selectedRecipientIds.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedRecipientIds.length === 0 ? 0.6 : 1 }}
                  >
                    🚀 최종 발송 검토
                  </button>
                </div>

                {/* Action message banner */}
                {campaignActionMsg && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: campaignActionMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                      border: campaignActionMsg.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      color: campaignActionMsg.type === 'success' ? '#166534' : '#991b1b',
                    }}
                  >
                    {campaignActionMsg.text}
                  </div>
                )}
              </div>
            )}

            {resultMeta?.isSummary ? (
              <div className="rdp-summary-wrap" style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>
                  {lang === 'ko' ? 'demostatra 6대 제품군 기업 분포' : 'demostatra 6 Product Groups Distribution'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {resultMeta?.categories?.map((cat) => (
                    <div key={cat.categoryId} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                        {cat.categoryName} ({cat.count}개사)
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569' }}>
                        {cat.companyNames.length > 0 ? cat.companyNames.slice(0, 10).join(', ') + (cat.companyNames.length > 10 ? ' 등' : '') : '해당 기업 없음'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
            <>
            {/* Recipient Selection Bar */}
            <div
              style={{
                padding: '8px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px',
              }}
            >
              <div>
                <strong>이메일 수신자 선택:</strong> {selectedRecipientIds.length}건 선택됨 (전체 {currentData?.length || 0}건 중)
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  style={{ border: 'none', background: 'none', color: '#625AF5', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                >
                  {selectedRecipientIds.length === (currentData?.length || 0) ? '전체 해제' : '전체 선택'}
                </button>
              </div>
            </div>

            <div className="rdp-table-wrap">
              <table className="rdp-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={currentData && currentData.length > 0 && selectedRecipientIds.length === currentData.length}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    {resultColumns.map((column) => (
                      <th key={column}>
                        {lang === 'ko'
                          ? RESULT_COLUMN_DEFS[column].ko
                          : RESULT_COLUMN_DEFS[column].en}
                      </th>
                    ))}
                    <th style={{ width: '110px', textAlign: 'center' }}>
                      AX 프로필
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, idx) => {
                    const compId = item.companyId || item._id;
                    const isRecipientSelected = selectedRecipientIds.includes(compId);
                    const isProfileSelected = selectedCompanyId === compId;

                    return (
                      <tr
                        key={compId || `${item.company_name || item.name || 'company'}-${idx}`}
                        style={{
                          background: isRecipientSelected
                            ? 'rgba(98, 90, 245, 0.06)'
                            : isProfileSelected
                              ? 'rgba(98, 90, 245, 0.12)'
                              : undefined,
                        }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isRecipientSelected}
                            onChange={() => handleToggleRecipient(compId)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        {resultColumns.map((column) => (
                          <td
                            key={column}
                            className={
                              column === 'company_name' || column === 'name'
                                ? 'rdp-company-name'
                                : column === 'email'
                                  ? 'rdp-email'
                                  : column === 'source'
                                    ? 'rdp-source'
                                    : undefined
                            }
                          >
                            {getColumnValue(item, column, lang)}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSelectCompany(item)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: isProfileSelected ? '1px solid #625AF5' : '1px solid #cbd5e1',
                              background: isProfileSelected ? '#625AF5' : '#ffffff',
                              color: isProfileSelected ? '#ffffff' : '#475569',
                              cursor: 'pointer',
                            }}
                          >
                            {isProfileSelected ? '선택됨' : '프로필 보기'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
            )}
          </div>
        )}

        {/* Mail Preview Modal */}
        {showPreviewModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '640px',
                padding: '24px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>👁️ 이메일 미리보기</h3>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                <div><strong>제목:</strong> {emailSubject}</div>
                <div><strong>샘플 수신자:</strong> 주식회사 한국오토텍 (sample@example.com)</div>
                <div><strong>첨부파일:</strong> {attachments.length > 0 ? attachments.map(a => a.name).join(', ') : '없음'}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                {emailBody.replace(/\{\{\s*company_name\s*\}\}/g, '주식회사 한국오토텍')}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Final Review & Send Confirmation Modal */}
        {showReviewModal && reviewData && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                padding: '24px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  🚀 {mode === 'koaa-show' ? 'demostatra' : '해외시장개척단'} 업체유치 메일 발송 검토
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Mode Badge */}
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: reviewData.mode === 'dry-run' ? '#eff6ff' : '#fff7ed', border: reviewData.mode === 'dry-run' ? '1px solid #bfdbfe' : '1px solid #ffedd5', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: reviewData.mode === 'dry-run' ? '#1d4ed8' : '#c2410c' }}>
                  발송 모드: {reviewData.mode.toUpperCase()} {reviewData.mode === 'dry-run' ? '(테스트 모드 — 실제 이메일 발송되지 않음)' : '(LIVE — 실제 이메일 발송됨)'}
                </span>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <div><strong>선택 수신자:</strong> {reviewData.stats.totalSelected}건</div>
                <div><strong>유효 발송 가능:</strong> {reviewData.stats.validRecipients}건</div>
                <div><strong>중복 이메일 제외:</strong> {reviewData.stats.excludedDuplicate}건</div>
                <div><strong>무효/차단 제외:</strong> {reviewData.stats.excludedInvalid + reviewData.stats.excludedSuppressed}건</div>
                <div><strong>첨부파일 수:</strong> {reviewData.attachments.length}개</div>
                <div><strong>전체 용량:</strong> {(reviewData.totalAttachmentSizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
              </div>

              {/* Checkbox validations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmCheck1}
                    onChange={(e) => setConfirmCheck1(e.target.checked)}
                  />
                  <span>수신자와 첨부파일 목록을 확인했습니다.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmCheck2}
                    onChange={(e) => setConfirmCheck2(e.target.checked)}
                  />
                  <span>발송 권한과 수신거부 기준을 확인했습니다.</span>
                </label>
              </div>

              {/* Text confirmation */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  확인 문구 입력 ( <span style={{ color: '#625AF5', fontWeight: 700 }}>demostatra 발송</span> 입력 )
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="demostatra 발송"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSend}
                  disabled={!confirmCheck1 || !confirmCheck2 || confirmInput.trim() !== 'demostatra 발송' || isCampaignLoading}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: (!confirmCheck1 || !confirmCheck2 || confirmInput.trim() !== 'demostatra 발송') ? '#cbd5e1' : '#625AF5',
                    color: '#ffffff',
                    cursor: (!confirmCheck1 || !confirmCheck2 || confirmInput.trim() !== 'demostatra 발송') ? 'not-allowed' : 'pointer',
                  }}
                >
                  발송 실행
                </button>
              </div>
            </div>
          </div>
        )}

        {axProfileState.available && axProfileState.profile && (
          <div className="printable-ax-profile" style={{ display: 'none' }}>
            <div style={{ borderBottom: '2px solid #625AF5', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#625AF5', fontWeight: 800 }}>
                AIN GLOBAL · demostatra 2026 OFFICIAL AX PROFILE
              </div>
              <h1 style={{ margin: '6px 0 2px', fontSize: '24px', color: '#0d1727' }}>
                {axProfileState.profile.companyNameKo}
              </h1>
              {axProfileState.profile.companyNameEn && (
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {axProfileState.profile.companyNameEn}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {axProfileState.profile.industry && (
                <div>
                  <strong>산업 분야:</strong> {axProfileState.profile.industry}
                </div>
              )}
              {axProfileState.profile.subIndustry && (
                <div>
                  <strong>세부 업종:</strong> {axProfileState.profile.subIndustry}
                </div>
              )}
            </div>

            {axProfileState.profile.companySummary && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  기업 개요
                </h3>
                <p style={{ lineHeight: 1.6, fontSize: '13px' }}>{axProfileState.profile.companySummary}</p>
              </div>
            )}

            {axProfileState.profile.mainProducts?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  주요 제품
                </h3>
                <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>
                  {axProfileState.profile.mainProducts.map((p, i) => (
                    <li key={i} style={{ fontSize: '13px' }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {axProfileState.profile.targetMarkets?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  타겟 시장
                </h3>
                <div>{axProfileState.profile.targetMarkets.join(', ')}</div>
              </div>
            )}

            {axProfileState.profile.matchSummary && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  매칭 분석 요약
                </h3>
                <p style={{ lineHeight: 1.6, fontSize: '13px' }}>{axProfileState.profile.matchSummary}</p>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                데이터 출처
              </h3>
              {axProfileState.profile.axDataSources?.length > 0 ? (
                <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>
                  {axProfileState.profile.axDataSources.map((src, i) => (
                    <li key={i} style={{ fontSize: '13px' }}>
                      {src.sourceName || src.sourceType} ({src.url || 'URL 없음'})
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '13px', color: '#64748b' }}>등록된 데이터 출처 없음</div>
              )}
            </div>

            <div style={{ marginTop: '30px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>프로필 상태: {axProfileState.profile.axProfileStatus}</span>
              <span>생성일: {axProfileState.profile.axProfileGeneratedAt ? new Date(axProfileState.profile.axProfileGeneratedAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        )}

        {/* Empty state when no data yet */}
        {resultStatus === 'empty' && !isLoading && (
          <div className="rdp-empty-state">
            <span aria-hidden="true">🔍</span>
            <p>
              {lang === 'ko'
                ? '조건에 맞는 기업 데이터가 아직 없습니다. 검색 조건을 조정해 다시 실행해 주세요.'
                : 'No matching company data found. Please adjust your search criteria and try again.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MongoDB Cluster Real-Time Live Stats Component
────────────────────────────────────────────── */
function MongoClusterDashboard({ lang }) {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('domestic'); // 'domestic' | 'buyers'
  const [exportingCategory, setExportingCategory] = useState(null);

  // 프로젝트 표준 API base (다른 페이지와 동일 패턴)
  const BASE_URL = API_BASE_URL;

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${BASE_URL}/companies/cluster-stats/summary`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setStats(null);
      }
    } catch (e) {
      setStats(null);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportExcel = async (endpoint, exportKey, fallbackFileName) => {
    if (exportingCategory) return;
    try {
      setExportingCategory(exportKey);
      const res = await fetch(`${BASE_URL}${endpoint}`);
      if (!res.ok) {
        alert('엑셀 파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const blob = await res.blob();
      let fileName = null;
      const disp = res.headers.get('content-disposition') || '';
      const utf8Match = disp.match(/filename\*=UTF-8''([^;]+)/i);
      const plainMatch = disp.match(/filename="?([^";]+)"?/i);
      if (utf8Match) fileName = decodeURIComponent(utf8Match[1]);
      else if (plainMatch) fileName = plainMatch[1];
      if (!fileName) fileName = fallbackFileName;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    } finally {
      setExportingCategory(null);
    }
  };

  const handleExportDomestic = (category, fallbackLabel) =>
    handleExportExcel(
      `/companies/cluster-stats/export-domestic-xlsx?category=${encodeURIComponent(category)}`,
      category,
      `KOAA_SHOW_국내업체_${fallbackLabel}.xlsx`
    );

  const handleExportBuyers = (status, fallbackLabel) =>
    handleExportExcel(
      `/companies/cluster-stats/export-buyers-xlsx?status=${encodeURIComponent(status)}`,
      `buyer-${status}`,
      `KOAA_SHOW_${fallbackLabel}.xlsx`
    );

  const exportButton = (category, label, count, color = '#2563eb') => {
    const busy = exportingCategory === category;
    return (
      <button
        type="button"
        onClick={() => handleExportDomestic(category, label)}
        disabled={Boolean(exportingCategory) || count === 0}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '7px 9px',
          borderRadius: '8px',
          border: `1px solid ${color}33`,
          background: busy ? '#e2e8f0' : '#ffffffcc',
          color: busy ? '#64748b' : color,
          fontSize: '10.5px',
          fontWeight: 800,
          cursor: exportingCategory || count === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        {busy ? '엑셀 생성 중...' : `📥 ${label} 엑셀 다운로드`}
      </button>
    );
  };

  const buyerExportButton = (status, label, color) => {
    const exportKey = `buyer-${status}`;
    const busy = exportingCategory === exportKey;
    return (
      <button
        type="button"
        onClick={() => handleExportBuyers(status, label)}
        disabled={Boolean(exportingCategory)}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '8px 10px',
          borderRadius: '8px',
          border: `1px solid ${color}44`,
          background: busy ? '#e2e8f0' : '#ffffffd9',
          color: busy ? '#64748b' : color,
          fontSize: '11px',
          fontWeight: 800,
          cursor: exportingCategory ? 'not-allowed' : 'pointer'
        }}
      >
        {busy ? '엑셀 생성 중...' : `📥 ${label} 엑셀 다운로드`}
      </button>
    );
  };

  // ⚠️ 가짜 폴백 숫자 금지: API 실패 시에는 빈 데이터를 표시하고
  // 화면에 "연결 실패" 안내만 남긴다. (신뢰도 최우선)
  if (!stats) {
    return (
      <div style={{
        margin: '0 0 16px 0',
        padding: '20px',
        border: '1px dashed #fca5a5',
        borderRadius: '12px',
        background: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#991b1b' }}>
            ⚠️ MongoDB 클러스터 현황을 불러오지 못했습니다
          </div>
          <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
            백엔드 서버가 실행 중인지 확인해 주세요. 가짜 통계는 표시되지 않습니다.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          disabled={refreshing}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            background: '#ffffff',
            color: '#b91c1c',
            fontSize: '12px',
            fontWeight: 700,
            cursor: refreshing ? 'not-allowed' : 'pointer'
          }}
        >
          {refreshing ? '재시도 중...' : '🔄 다시 시도'}
        </button>
      </div>
    );
  }

  const data = stats;
  const domestic = data.domesticCompanies;
  const buyers = data.buyers;

  return (
    <div className="mongo-cluster-dashboard-container" style={{ margin: '0 0 16px 0' }}>
      {/* Real-time Status Card Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '8px 16px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        overflow: 'hidden'
      }}>
        {/* Left: DB Live Badge & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#38bdf8',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            flexShrink: 0
          }}>
            🍃
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                MongoDB demostatra 실시간 클러스터 현황
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '10.5px',
                fontWeight: 700,
                border: '1px solid #a7f3d0'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }}></span>
                LIVE SYNC
              </span>
            </div>
            <p style={{ margin: '1px 0 0 0', fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>
              국내 자동차부품/모빌리티 기업 & 글로벌 바이어 DB 통합 모니터링
            </p>
          </div>
        </div>

        {/* Center: Live Summary Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Domestic Metric */}
          <div style={{
            padding: '6px 12px',
            borderRadius: '10px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '16px' }}>🚗</span>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b' }}>국내 기업 (companies · domestic)</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {domestic.total.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>개사</span>
              </div>
            </div>
          </div>

          {/* Buyer Metric */}
          <div style={{
            padding: '6px 12px',
            borderRadius: '10px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '16px' }}>🌍</span>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#0284c7' }}>글로벌 바이어 (buyers)</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0369a1', lineHeight: 1.2 }}>
                {buyers.total.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>개사</span>
                <span style={{ fontSize: '10.5px', fontWeight: 600, marginLeft: '4px', color: '#0369a1', opacity: 0.85 }}>
                  (🟡잠재 {buyers.verificationStatus.potential} | 🟢확정 {buyers.verificationStatus.verified})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <button
            type="button"
            onClick={fetchStats}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{
              display: 'inline-block',
              transform: refreshing ? 'rotate(360deg)' : 'none',
              transition: 'transform 0.5s ease'
            }}>🔄</span>
            {refreshing ? '갱신 중...' : '실시간 갱신'}
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 14px',
              borderRadius: '9px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📊</span>
            실시간 현황표 자세히 보기 →
          </button>
        </div>
      </div>

      {/* 국내업체 연락처 보유 세부 현황은 서브화면("실시간 현황표 자세히 보기")에서 제공합니다. */}

      {/* Detail Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🍃</span> MongoDB demostatra 실시간 클러스터 현황표
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  국내 기업(type=domestic) 및 해외 바이어(type=foreign/overseas) 적재 데이터 실시간 통계 — companies 컬렉션 실측
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              padding: '0 24px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('domestic')}
                style={{
                  padding: '14px 20px',
                  border: 'none',
                  borderBottom: activeTab === 'domestic' ? '3px solid #2563eb' : '3px solid transparent',
                  background: 'none',
                  fontSize: '14px',
                  fontWeight: activeTab === 'domestic' ? 800 : 600,
                  color: activeTab === 'domestic' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                🚗 국내 기업 현황 (companies · domestic: {domestic.total.toLocaleString()}개사)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('buyers')}
                style={{
                  padding: '14px 20px',
                  border: 'none',
                  borderBottom: activeTab === 'buyers' ? '3px solid #2563eb' : '3px solid transparent',
                  background: 'none',
                  fontSize: '14px',
                  fontWeight: activeTab === 'buyers' ? 800 : 600,
                  color: activeTab === 'buyers' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                🌍 바이어 현황 (buyers: {buyers.total.toLocaleString()}개사)
              </button>
            </div>

            {/* Modal Body Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {activeTab === 'domestic' && (
                <div>
                  {/* Domestic Summary Card */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>전체 국내 자동차부품 & 모빌리티 제조기업</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e3a8a' }}>
                        {domestic.total.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>개사</span>
                      </div>
                      {exportButton('all', '전체 업체', domestic.total, '#1d4ed8')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#1d4ed8', textAlign: 'right' }}>
                      데이터 출처: demostatra / 한국자동차산업협동조합 / KOTRA 지사화 / DART
                    </div>
                  </div>

                  {/* Domestic Contact Coverage (moved from main screen) */}
                  {domestic.contacts && (
                    <div style={{
                      marginBottom: '24px',
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                            📇 연락처 보유 현황
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            고유 업체 단위 실측 · 원본 {domestic.mergedFromDocuments != null ? domestic.mergedFromDocuments.toLocaleString() : domestic.total.toLocaleString()}건 병합 기준
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                        {/* Email held */}
                        <div style={{ padding: '12px 14px', borderRadius: '11px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>✉️ 이메일 보유</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#065f46', marginTop: '4px' }}>
                            {domestic.contacts.withEmail.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>개사</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                            {domestic.total > 0 ? ((domestic.contacts.withEmail / domestic.total) * 100).toFixed(1) : 0}% · 마케팅 발송 가능
                          </div>
                          {exportButton('with-email', '이메일 보유', domestic.contacts.withEmail, '#047857')}
                        </div>
                        {/* Email missing */}
                        <div style={{ padding: '12px 14px', borderRadius: '11px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>📭 이메일 미보유 (발굴 대상)</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#92400e', marginTop: '4px' }}>
                            {domestic.contacts.withoutEmail.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>개사</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>이메일 발굴·확보 서비스 대상</div>
                          {exportButton('without-email', '이메일 미보유', domestic.contacts.withoutEmail, '#b45309')}
                        </div>
                        {/* Website held */}
                        <div style={{ padding: '12px 14px', borderRadius: '11px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>🌐 웹사이트 보유</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#075985', marginTop: '4px' }}>
                            {domestic.contacts.withWebsite.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>개사</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                            {domestic.total > 0 ? ((domestic.contacts.withWebsite / domestic.total) * 100).toFixed(1) : 0}% · 원본 파일 복구 반영
                          </div>
                          {exportButton('with-website', '웹사이트 보유', domestic.contacts.withWebsite, '#0369a1')}
                        </div>
                        {/* Website missing */}
                        <div style={{ padding: '12px 14px', borderRadius: '11px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#c2410c' }}>🔍 웹사이트 미보유 (발굴 대상)</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#9a3412', marginTop: '4px' }}>
                            {(domestic.contacts.withoutWebsite ?? Math.max(domestic.total - domestic.contacts.withWebsite, 0)).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>개사</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>홈페이지 조사·확보 서비스 대상</div>
                          {exportButton('without-website', '웹사이트 미보유', domestic.contacts.withoutWebsite ?? Math.max(domestic.total - domestic.contacts.withWebsite, 0), '#c2410c')}
                        </div>
                        {/* Both held */}
                        <div style={{ padding: '12px 14px', borderRadius: '11px', background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca' }}>✅ 이메일 + 웹사이트 둘 다 보유</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#3730a3', marginTop: '4px' }}>
                            {domestic.contacts.withBoth.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>개사</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600, marginTop: '2px' }}>부스 유치 최우선 접촉 대상</div>
                          {exportButton('with-both', '이메일+웹사이트 보유', domestic.contacts.withBoth, '#4338ca')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* demostatra Product Group Breakdown */}
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      📦 demostatra 6대 제품군별 기업 분포
                    </h4>
                    {domestic.productClassification && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        국내CRM(1) 제품 칼럼 근거 · 분류 {domestic.productClassification.classified.toLocaleString()}개사 · 제품정보 미분류 {domestic.productClassification.unclassified.toLocaleString()}개사
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {domestic.categories.map((cat, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: 700 }}>
                          <span>{cat.name}</span>
                          <span style={{ color: '#2563eb' }}>{cat.count.toLocaleString()}개사 ({cat.percentage}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${cat.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Group Source Breakdown */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    🏷️ 수집 출처 & 특성 그룹별 현황
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {domestic.groups.map((grp, i) => (
                      <div key={i} style={{ padding: '14px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{grp.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                          {grp.count.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500 }}>개사</span>
                          {grp.note && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginLeft: '6px' }}>({grp.note})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'buyers' && (
                <div>
                  {/* Buyer Status Overview (Option A: Potential vs Verified) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {/* Potential Buyers */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#b45309' }}>
                        <span>🟡</span> 잠재 바이어 (Potential Buyers)
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#92400e', marginTop: '6px' }}>
                        {buyers.verificationStatus.potential.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>개사</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#d97706', lineHeight: 1.4 }}>
                        해외 전시회 참가 및 수집 데이터 중 검증 전 바이어 (마케팅 타깃)
                      </p>
                      {buyerExportButton('potential', '잠재 바이어', '#b45309')}
                    </div>

                    {/* Verified Buyers */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#047857' }}>
                        <span>🟢</span> 확정 바이어 (Verified Buyers)
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#065f46', marginTop: '6px' }}>
                        {buyers.verificationStatus.verified.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>개사</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#059669', lineHeight: 1.4 }}>
                        실제 바이어 문서와 승인·회신 기록이 모두 확인된 업체
                      </p>
                      {buyerExportButton('verified', '확정 바이어', '#047857')}
                    </div>
                  </div>

                  {/* 🛡️ 바이어 검증 방식 3그룹 세부 현황 */}
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛡️</span> 바이어 검증 방식 3그룹 세부 현황
                      </h4>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: '#ffffff', color: '#15803d', border: '1px solid #86efac' }}>
                        실시간 승격 트래킹
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {(buyers.verificationStatus.channels || [
                        { id: 'inquiry', label: '📧 소싱 인콰이어리 수신', count: 0, desc: '한국산 부품 견적/인콰이어리 수신' },
                        { id: 'email_response', label: '📩 초청/홍보 메일 회신', count: 0, desc: 'demostatra 오퍼 회신/상담 신청' },
                        { id: 'admin_verified', label: '👤 담당자 직접 검증', count: 0, desc: '아인글로벌 담당자 1-Click 승인' }
                      ]).map((channel) => (
                        <div key={channel.id} style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          border: '1px solid #bbf7d0',
                          boxShadow: '0 2px 6px rgba(22, 101, 52, 0.05)'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#14532d', marginBottom: '4px' }}>
                            {channel.label}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>
                            {channel.count} <span style={{ fontSize: '12px', fontWeight: 600 }}>개사</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px', lineHeight: 1.3 }}>
                            {channel.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Country Breakdown */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    🌍 글로벌 바이어 국가별 분포
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                    {buyers.byCountry.map((item, idx) => (
                      <div key={idx} style={{ padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>
                          <span style={{ marginRight: '6px' }}>{item.flag}</span>
                          {item.country}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#2563eb' }}>{item.count}개사</span>
                      </div>
                    ))}
                  </div>

                  {/* Buyer Interest Categories */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    🎯 바이어 주요 관심 소싱 제품군
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {buyers.byCategory.map((cat, i) => (
                      <div key={i} style={{ padding: '12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{cat.name}</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                          {cat.count} <span style={{ fontSize: '12px', fontWeight: 500 }}>개사 소싱 타깃</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                최종 갱신 시각: {new Date(data.updatedAt).toLocaleString('ko-KR')}
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main AXData Page
────────────────────────────────────────────── */
export default function AXData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const selectionRef = useRef(null);

  const rawMode = searchParams.get('mode');
  const selectedMode = VALID_MODES.includes(rawMode) ? rawMode : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedMode]);

  const selectMode = (mode) => {
    setSearchParams({ mode });
    window.scrollTo(0, 0);
  };

  const clearMode = () => {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSelection = () => {
    selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── If mode selected: show workspace ── */
  if (selectedMode) {
    const config = RECRUITMENT_MODES[selectedMode];
    return (
      <div className="ax-recruitment-page">
        <RecruitmentWorkspace
          mode={selectedMode}
          config={config}
          lang={lang}
          onBack={clearMode}
        />
      </div>
    );
  }

  /* ── Default: hero + selection ── */
  return (
    <div className="ax-recruitment-page">
      {/* Hero (1st Tier) */}
      <section className="ax-recruitment-hero" aria-label="업체유치 Agent 소개" style={{ minHeight: 'auto', borderRadius: '18px', marginBottom: '16px' }}>
        <div className="ax-recruitment-hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: '0 auto', padding: '36px 32px' }}>
          <h1 className="ax-hero-title" style={{ fontSize: '30px', fontWeight: 900, margin: '0 0 12px 0', textAlign: 'center', letterSpacing: '-0.8px', color: '#ffffff', lineHeight: 1.3 }}>
            {lang === 'ko'
              ? 'AX 프로필에 기반한 demostatra 부스참가 및 시장개척단 업체 유치 Agent'
              : 'AX Profile-based demostatra Exhibitor & Trade Mission Recruitment Agent'}
          </h1>
          <p className="ax-hero-desc" style={{ fontSize: '15.5px', fontWeight: 500, margin: 0, textAlign: 'center', maxWidth: '920px', lineHeight: 1.6, color: '#E2E8F0', opacity: 0.95 }}>
            {lang === 'ko'
              ? 'demostatra 부스 참가기업과 해외시장개척단 참가기업 후보를 발굴하고, 확인 가능한 기업·담당자 정보를 정리하여 후속 유치 업무에 활용합니다.'
              : 'Identify prospective exhibitors for demostatra and trade mission participants, and organize verifiable company and contact information for outreach.'}
          </p>
        </div>
      </section>

      {/* Live MongoDB Cluster Dashboard (2nd Tier) */}
      <MongoClusterDashboard lang={lang} />

      {/* Mode selection (3rd Tier) */}
      <section className="recruitment-mode-section" ref={selectionRef} aria-labelledby="mode-section-title" style={{ gap: '16px', marginTop: '0px' }}>
        <header className="rms-header" style={{ marginBottom: '0px' }}>
          <h2 id="mode-section-title" style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>
            {lang === 'ko' ? '유치 업무 유형을 선택하세요' : 'Select Recruitment Type'}
          </h2>
        </header>

        <div className="recruitment-mode-grid">
          {VALID_MODES.map((modeKey) => {
            const cfg = RECRUITMENT_MODES[modeKey];
            return (
              <button
                key={modeKey}
                type="button"
                className={`recruitment-mode-card ${cfg.tone}`}
                onClick={() => selectMode(modeKey)}
                aria-label={lang === 'ko' ? cfg.titleKo : cfg.titleEn}
              >
                <div className="rmc-top">
                  <div className="rmc-icon-wrap">
                    <span className="rmc-icon" aria-hidden="true">{cfg.icon}</span>
                  </div>
                  <span className="rmc-label">
                    {lang === 'ko' ? cfg.labelKo : cfg.labelEn}
                  </span>
                </div>

                <h3 className="rmc-title">{lang === 'ko' ? cfg.titleKo : cfg.titleEn}</h3>
                <p className="rmc-desc">{lang === 'ko' ? cfg.descKo : cfg.descEn}</p>

                <div className="rmc-tags">
                  {(lang === 'ko' ? cfg.tagsKo : cfg.tagsEn).map((tag) => (
                    <span key={tag} className={`rmc-tag ${cfg.tone}`}>{tag}</span>
                  ))}
                </div>

                <div className="rmc-prompts">
                  <p className="rmc-prompts-label">
                    {lang === 'ko' ? '업무 예시' : 'Sample Tasks'}
                  </p>
                  <ul>
                    {(lang === 'ko' ? cfg.quickPromptsKo : cfg.quickPromptsEn).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <span className={`rmc-cta ${cfg.tone}`}>
                  {lang === 'ko' ? cfg.ctaKo : cfg.ctaEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
