import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calculator, Plus, Trash2, Menu, 
  LayoutDashboard, Layers, Component, Pickaxe, Hammer, Briefcase,
  FileText, CheckSquare, Square, Save, Moon, Sun, ClipboardList, CheckCircle2,
  X, Image as ImageIcon, Download, Printer, FileSignature, Edit, ListPlus, Settings, Camera,
  Building2, User, ArrowUp, ArrowDown, Copy, ChevronLeft, ImageDown
} from 'lucide-react';

// --- Helpers & Utilities ---
const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) return resolve();
  const script = document.createElement('script');
  script.src = src;
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

// ฟังก์ชันแปลงตัวเลขเป็นอักษรไทย (Thai Baht Text)
const NumberToThaiText = (number) => {
  if (number === 0) return 'ศูนย์บาทถ้วน';
  const txtNumArr = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const txtDigitArr = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  let bahtText = '';
  let parts = Number(number).toFixed(2).split('.');
  let baht = parts[0];
  let satang = parts[1];

  if (baht.length > 7) return 'จำนวนเงินเยอะเกินกำหนด';

  const parseNumber = (numStr) => {
    let text = '';
    let length = numStr.length;
    for (let i = 0; i < length; i++) {
      let n = parseInt(numStr.charAt(i));
      let pos = length - i - 1;
      if (n !== 0) {
        if (pos === 1 && n === 1) text += 'สิบ';
        else if (pos === 1 && n === 2) text += 'ยี่สิบ';
        else if (pos === 0 && n === 1 && length > 1) text += 'เอ็ด';
        else text += txtNumArr[n] + txtDigitArr[pos];
      }
    }
    return text;
  };

  if (parseInt(baht) > 0) bahtText += parseNumber(baht) + 'บาท';
  if (parseInt(satang) > 0) bahtText += parseNumber(satang) + 'สตางค์';
  else bahtText += 'ถ้วน';
  return bahtText;
};

const PRODUCT_CATALOG = {
  'W-001': { name: 'แผ่นรั้วมาตรฐาน 24.5x6 ซม.', price: 250, unit: 'แผ่น' },
  'W-002': { name: 'แผ่นกันดิน 35x5 ซม. (ลวด 4 เส้น)', price: 100, unit: 'เมตร' },
  'T-001': { name: 'ทับหลังแบบครอบ 15x7 ซม.', price: 260, unit: 'แผ่น' },
  'T-002': { name: 'ทับหลังแบบตัวที 29x6 ซม.', price: 460, unit: 'แผ่น' },
  'T-003': { name: 'คานรั้วคาวบอย 12.5x6 ซม.', price: 280, unit: 'ตัว' },
  'C-001': { name: 'เสารั้ว 15x15 ซม.', price: 140, unit: 'เมตร' },
  'C-002': { name: 'เสารั้วมุม 18x18 ซม.', price: 650, unit: 'ต้น' },
  'C-003': { name: 'เสารั้วมุม 3 ทาง 18x18 ซม.', price: 650, unit: 'ต้น' },
  'C-004': { name: 'เสาเข็มไอ 15x15 ซม.', price: 120, unit: 'เมตร' },
  'C-005': { name: 'เสาเข็มไอ 18x18 ซม.', price: 170, unit: 'เมตร' },
  'C-006': { name: 'เสาเข็มไอ 22x22 ซม.', price: 220, unit: 'เมตร' },
  'F-001': { name: 'ฐานรากสำเร็จรูป แบบเข็มเดี่ยว', price: 280, unit: 'ตัว' },
  'F-002': { name: 'ฐานรากสำเร็จรูป แบบเข็มคู่', price: 380, unit: 'ตัว' },
  'CUSTOM': { name: 'กำหนดเอง / วัสดุอื่นๆ', price: 0, unit: 'หน่วย' }
};

const useLocalState = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalState('wpt_theme_dark', true);
  const [projectName, setProjectName] = useLocalState('wpt_project_name', '');
  const [appLogo, setAppLogo] = useLocalState('wpt_main_app_logo', ''); // โลโก้แอปที่มุมซ้ายบน
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef(null);

  // --- Settings & Core States ---
  const [spanLength, setSpanLength] = useLocalState('wpt_span_length', 3.0);
  const [beamLength, setBeamLength] = useLocalState('wpt_beam_length', 10.0);
  const [stayLength, setStayLength] = useLocalState('wpt_stay_length', 10.0);
  const [activeSections, setActiveSections] = useLocalState('wpt_active_sections', { retaining: true, fence: true, beam: true, stay: true, labor: true });
  const [beamMultiplier, setBeamMultiplier] = useLocalState('wpt_beam_multi', 1);

  // --- Data States ---
  const [retainingItems, setRetainingItems] = useLocalState('wpt_retaining_items', [
    { id: 1, code: 'C-006', customName: '', qty: 1, itemLength: 3.0, unitPrice: 220, customUnit: 'เมตร' }, 
    { id: 2, code: 'W-002', customName: '', qty: 1, itemLength: 3.0, unitPrice: 100, customUnit: 'เมตร' }
  ]);
  const [fenceItems, setFenceItems] = useLocalState('wpt_fence_items', [
    { id: 3, code: 'C-001', customName: '', qty: 1, itemLength: 3.0, unitPrice: 140, customUnit: 'เมตร' }, 
    { id: 4, code: 'W-001', customName: '', qty: 10, itemLength: '', unitPrice: 250, customUnit: 'แผ่น' }, 
    { id: 5, code: 'T-001', customName: '', qty: 1, itemLength: '', unitPrice: 260, customUnit: 'แผ่น' }, 
    { id: 6, code: 'F-001', customName: '', qty: 1, itemLength: '', unitPrice: 280, customUnit: 'ตัว' }
  ]);
  const [beamItems, setBeamItems] = useLocalState('wpt_beam_items', [
    { id: 'fb1', code: 'CUSTOM', customName: 'คอนกรีต', isFixed: true, isConcrete: true, width: 0.30, height: 0.30, unitPrice: 2500, customUnit: 'ลบ.ม.' }, 
    { id: 'fb2', code: 'CUSTOM', customName: 'เหล็ก DB12', isFixed: true, qty: 4, unitPrice: 250, customUnit: 'เส้น' }, 
    { id: 'fb3', code: 'CUSTOM', customName: 'เหล็ก RB6', isFixed: true, qty: 70, unitPrice: 15, customUnit: 'ปลอก' }
  ]);
  const [stayItems, setStayItems] = useLocalState('wpt_stay_items', [
    { id: 'fs1', code: 'CUSTOM', customName: 'คอนกรีต', isFixed: true, isConcrete: true, width: 0.25, height: 0.25, unitPrice: 2500, customUnit: 'ลบ.ม.' }, 
    { id: 'fs2', code: 'CUSTOM', customName: 'เหล็ก DB12', isFixed: true, qty: 4, unitPrice: 250, customUnit: 'เส้น' }, 
    { id: 'fs3', code: 'CUSTOM', customName: 'เหล็ก RB6', isFixed: true, qty: 70, unitPrice: 15, customUnit: 'ปลอก' }
  ]);
  const [laborItems, setLaborItems] = useLocalState('wpt_labor_items', [
    { id: 13, name: 'ค่าไม้แบบ', pricePerMeter: 200 }, 
    { id: 14, name: 'ค่าแรง', pricePerMeter: 500 }, 
    { id: 15, name: 'ค่าแบคโฮ', pricePerMeter: 200 }, 
    { id: 16, name: 'ค่าปูนเก็บงาน', pricePerMeter: 50 }, 
    { id: 17, name: 'ค่าเบ็ดเตล็ด', pricePerMeter: 200 }, 
    { id: 18, name: 'ค่าดำเนินการ', pricePerMeter: 500 }
  ]);

  const [savedEstimates, setSavedEstimates] = useLocalState('wpt_saved_estimates', []);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  // --- Company Settings ---
  const [companies, setCompanies] = useLocalState('wpt_companies', [
    { id: 'comp_default', logo: 'https://ui-avatars.com/api/?name=WPT&background=2563eb&color=fff&rounded=true', name: 'WPT ระบบรั้วสำเร็จรูป', address: '123 ถ.สุขุมวิท กรุงเทพฯ 10110', taxId: '0105555555555', phone: '02-123-4567' }
  ]);
  const [activeCompanyId, setActiveCompanyId] = useLocalState('wpt_active_company_id', 'comp_default');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // --- Quotation System States ---
  const defaultCustomerInfo = { contactName: '', contactPhone: '', companyName: '', address: '', taxId: '', project: '', projectDetails: '', siteAddress: '' };
  const generateQuoteNumber = () => {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
    let lastSeq = parseInt(localStorage.getItem(`wpt_quote_seq_${ym}`) || '0');
    lastSeq += 1;
    localStorage.setItem(`wpt_quote_seq_${ym}`, lastSeq);
    return `QT-${ym}${String(lastSeq).padStart(3,'0')}`;
  };

  const defaultQuoteSettings = {
    quoteNumber: '', date: new Date().toISOString().split('T')[0], discount: 0, useVat: false,
    remark: 'ยืนราคา 30 วันนับจากวันที่เสนอราคา', paymentTerms: 'มัดจำ 50% ก่อนเริ่มงาน, 50% เมื่องานแล้วเสร็จ',
    bankName: 'ธนาคารกสิกรไทย', accountNo: '123-4-56789-0', accountName: 'บจก. WPT รั้วสำเร็จรูป',
    preparerName: '', preparerSignature: ''
  };

  const [quoteView, setQuoteView] = useState('list'); // 'list' or 'form'
  const [savedQuotations, setSavedQuotations] = useLocalState('wpt_saved_quotations', []);
  const [editingQuoteId, setEditingQuoteId] = useState(null);

  const [customerInfo, setCustomerInfo] = useLocalState('wpt_customer_info_draft', defaultCustomerInfo);
  const [quoteSettings, setQuoteSettings] = useLocalState('wpt_quote_settings_draft', defaultQuoteSettings);
  const [quoteSelectedItems, setQuoteSelectedItems] = useLocalState('wpt_quote_selected_draft', []);
  
  const [quoteDatabase, setQuoteDatabase] = useLocalState('wpt_quote_db', [
    { id: 'qdb1', type: 'product', code: 'FW-01', name: 'แผ่นรั้วคอนกรีต', description: 'แผ่นรั้วสำเร็จรูป เสริมเหล็ก', unit: 'แผ่น', price: 250, image: '' },
    { id: 'qdb2', type: 'service', code: 'SV-01', name: 'บริการติดตั้งรั้ว', description: 'รวมค่าแรงและเครื่องจักร', unit: 'เมตร', price: 800, image: '' }
  ]);

  // Modals for Quotation
  const [isQuoteDbModalOpen, setIsQuoteDbModalOpen] = useState(false);
  const [isQuoteFormModalOpen, setIsQuoteFormModalOpen] = useState(false);
  const [isQuoteSelectorModalOpen, setIsQuoteSelectorModalOpen] = useState(false);
  const [isCustomerInfoModalOpen, setIsCustomerInfoModalOpen] = useState(false);
  const [isQuoteSaveModalOpen, setIsQuoteSaveModalOpen] = useState(false);
  
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const showDialog = (type, message, onConfirm = null) => setDialogConfig({ isOpen: true, type, message, onConfirm });
  const closeDialog = () => setDialogConfig({ isOpen: false, type: 'alert', message: '', onConfirm: null });

  const [dbFormData, setDbFormData] = useState({ id: null, type: 'product', code: '', name: '', description: '', unit: '', price: 0, image: '' });
  const [quoteItemEditData, setQuoteItemEditData] = useState(null); // สำหรับป๊อปอัปแก้ไขสินค้ารายตัวในบิล

  // --- Calculations ---
  const getConcreteVolume = (item, sectionLength) => (parseFloat(item.width) || 0) * (parseFloat(item.height) || 0) * (parseFloat(sectionLength) || 0);

  const getItemTotal = (item, sectionLength = 1) => {
    const price = parseFloat(item.unitPrice) || 0;
    if (item.isConcrete) return getConcreteVolume(item, sectionLength) * price;
    const qty = parseFloat(item.qty) || 0;
    const unit = item.code === 'CUSTOM' ? item.customUnit : (PRODUCT_CATALOG[item.code]?.unit || item.customUnit);
    if (unit === 'เมตร') return qty * (isNaN(parseFloat(item.itemLength)) ? 1 : parseFloat(item.itemLength)) * price;
    return qty * price;
  };

  const totals = useMemo(() => {
    const retainingTotal = retainingItems.reduce((sum, item) => sum + getItemTotal(item), 0);
    const retainingPerMeter = spanLength > 0 ? retainingTotal / spanLength : 0;
    const fenceTotal = fenceItems.reduce((sum, item) => sum + getItemTotal(item), 0);
    const fencePerMeter = spanLength > 0 ? fenceTotal / spanLength : 0;
    const beamTotal = beamItems.reduce((sum, item) => sum + getItemTotal(item, beamLength), 0);
    const beamPerMeter = (beamLength > 0 ? beamTotal / beamLength : 0) * beamMultiplier;
    const stayTotal = stayItems.reduce((sum, item) => sum + getItemTotal(item, stayLength), 0);
    const stayPerMeter = stayLength > 0 ? stayTotal / stayLength : 0;

    const materialsPerMeter = (activeSections.retaining ? retainingPerMeter : 0) + (activeSections.fence ? fencePerMeter : 0) + (activeSections.beam ? beamPerMeter : 0) + (activeSections.stay ? stayPerMeter : 0);
    const laborPerMeterRaw = laborItems.reduce((sum, item) => sum + (parseFloat(item.pricePerMeter) || 0), 0);
    const laborPerMeter = activeSections.labor ? laborPerMeterRaw : 0;
    const grandTotalPerMeter = materialsPerMeter + laborPerMeter;

    return { retainingTotal, retainingPerMeter, fenceTotal, fencePerMeter, beamTotal, beamPerMeter, stayTotal, stayPerMeter, laborPerMeterRaw, laborPerMeter, materialsPerMeter, grandTotalPerMeter };
  }, [retainingItems, fenceItems, beamItems, stayItems, laborItems, spanLength, beamLength, stayLength, activeSections, beamMultiplier]);

  const toggleSection = (sectionKey) => setActiveSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));

  // --- Handlers: App Main Logo Upload ---
  const handleAppLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAppLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers: Estimate Saving & Reordering ---
  const handleSaveEstimate = () => {
    if (!saveNameInput.trim()) return;
    setSaveStatus('success');
    const newItem = { id: Date.now(), name: saveNameInput, total: totals.grandTotalPerMeter, date: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }), isSelected: false };
    setTimeout(() => {
      setSavedEstimates([newItem, ...savedEstimates]);
      setSaveStatus('idle'); setIsSaveModalOpen(false); setSaveNameInput(''); setActiveTab('estimate');
    }, 1200);
  };
  const handleSelectEstimate = (id, checked) => {
    if (checked && savedEstimates.filter(e => e.isSelected).length >= 6) return showDialog('alert', 'เลือกแสดงได้สูงสุด 6 รายการเท่านั้น');
    setSavedEstimates(prev => prev.map(e => e.id === id ? { ...e, isSelected: checked } : e));
  };
  const deleteEstimate = (id) => setSavedEstimates(prev => prev.filter(e => e.id !== id));
  
  const moveEstimate = (index, direction) => {
    const newEst = [...savedEstimates];
    if (direction === 'up' && index > 0) {
      [newEst[index - 1], newEst[index]] = [newEst[index], newEst[index - 1]];
    } else if (direction === 'down' && index < newEst.length - 1) {
      [newEst[index + 1], newEst[index]] = [newEst[index], newEst[index + 1]];
    }
    setSavedEstimates(newEst);
  };

  // --- Handlers: Quotation System ---
  const calcQuoteTotals = (items, discount, useVat) => {
    const subTotal = items.reduce((sum, item) => sum + ((parseFloat(item.price)||0) * (parseFloat(item.qty)||0)), 0);
    const discountAmt = parseFloat(discount) || 0;
    const afterDiscount = subTotal - discountAmt;
    const vatAmt = useVat ? afterDiscount * 0.07 : 0;
    const grandTotal = afterDiscount + vatAmt;
    return { subTotal, grandTotal };
  };

  const handleCreateNewQuote = () => {
    setQuoteSettings({...defaultQuoteSettings, quoteNumber: generateQuoteNumber(), date: new Date().toISOString().split('T')[0]});
    setCustomerInfo(defaultCustomerInfo);
    setQuoteSelectedItems([]);
    setEditingQuoteId(null);
    setQuoteView('form');
  };

  const handleEditQuote = (q) => {
    setQuoteSettings(q.settings);
    setCustomerInfo(q.customer);
    setQuoteSelectedItems(q.items);
    setEditingQuoteId(q.id);
    setQuoteView('form');
  };

  const handleDuplicateQuote = (q) => {
    setQuoteSettings({...q.settings, quoteNumber: generateQuoteNumber(), date: new Date().toISOString().split('T')[0]});
    setCustomerInfo(q.customer);
    setQuoteSelectedItems(q.items);
    setEditingQuoteId(null);
    setQuoteView('form');
  };

  const handleSaveQuotationDoc = () => {
    if (!customerInfo.contactName && !customerInfo.companyName) return showDialog('alert', 'กรุณากรอกชื่อลูกค้าหรือบริษัทลูกค้า');
    
    // แสดง Modal โหลด/สำเร็จ
    setIsQuoteSaveModalOpen(true);

    setTimeout(() => {
      const { grandTotal } = calcQuoteTotals(quoteSelectedItems, quoteSettings.discount, quoteSettings.useVat);
      const newDoc = {
        id: editingQuoteId || Date.now().toString(),
        settings: quoteSettings,
        customer: customerInfo,
        items: quoteSelectedItems,
        total: grandTotal,
        timestamp: Date.now()
      };

      if (editingQuoteId) {
        setSavedQuotations(prev => prev.map(q => q.id === editingQuoteId ? newDoc : q));
      } else {
        setSavedQuotations(prev => [newDoc, ...prev]);
      }
      
      setIsQuoteSaveModalOpen(false);
      setQuoteView('list');
    }, 1200); // ดีเลย์โชว์ติ๊กถูก 1.2 วิ
  };

  const handleDeleteQuote = (id) => {
    showDialog('confirm', 'ยืนยันการลบใบเสนอราคานี้?', () => {
      setSavedQuotations(prev => prev.filter(q => q.id !== id));
    });
  };

  const handleSaveDbItem = () => {
    if (!dbFormData.name || dbFormData.price === '') return showDialog('alert', 'กรุณากรอกชื่อและราคาให้ครบถ้วน');
    if (dbFormData.id) {
      setQuoteDatabase(prev => prev.map(item => item.id === dbFormData.id ? dbFormData : item));
    } else {
      setQuoteDatabase([...quoteDatabase, { ...dbFormData, id: `qdb_${Date.now()}` }]);
    }
    setIsQuoteFormModalOpen(false);
  };
  const handleDeleteDbItem = (id) => {
    showDialog('confirm', 'คุณต้องการลบรายการนี้ออกจากฐานข้อมูลหรือไม่?', () => {
      setQuoteDatabase(prev => prev.filter(item => item.id !== id));
      // เราอาจจะไม่ลบออกจาก quoteSelectedItems เพื่อป้องกันบิลเก่าที่เคยทำไว้มีปัญหา
    });
  };
  const openDbForm = (item = null) => {
    if (item) setDbFormData(item);
    else setDbFormData({ id: null, type: 'product', code: '', name: '', description: '', unit: '', price: 0, image: '' });
    setIsQuoteFormModalOpen(true);
  };
  const handleDbImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDbFormData({...dbFormData, image: reader.result});
      reader.readAsDataURL(file);
    }
  };
  const addItemsToQuote = (dbItem) => {
    const exists = quoteSelectedItems.find(i => i.dbId === dbItem.id);
    if(exists) setQuoteSelectedItems(prev => prev.map(i => i.dbId === dbItem.id ? {...i, qty: i.qty + 1} : i));
    else setQuoteSelectedItems([...quoteSelectedItems, { id: `qi_${Date.now()}_${Math.random()}`, dbId: dbItem.id, ...dbItem, qty: 1 }]);
    setIsQuoteSelectorModalOpen(false);
  };
  const updateQuoteItemQty = (id, val) => setQuoteSelectedItems(prev => prev.map(i => i.id === id ? {...i, qty: parseFloat(val)||0} : i));
  const updateQuoteItemPrice = (id, val) => setQuoteSelectedItems(prev => prev.map(i => i.id === id ? {...i, price: parseFloat(val)||0} : i));
  const removeQuoteItem = (id) => setQuoteSelectedItems(prev => prev.filter(i => i.id !== id));
  
  // สำหรับบันทึกการแก้ไขเฉพาะสินค้ารายตัวในบิล
  const saveQuoteItemEdit = () => {
    setQuoteSelectedItems(prev => prev.map(i => i.id === quoteItemEditData.id ? quoteItemEditData : i));
    setQuoteItemEditData(null);
  };

  const openSavedQuotePreview = (q) => {
    setQuoteSettings(q.settings);
    setCustomerInfo(q.customer);
    setQuoteSelectedItems(q.items);
    setEditingQuoteId(q.id);
    setActiveTab('quotation');
    setQuoteView('list');
    setIsPreviewModalOpen(true);
  };

  // --- Handlers: Company Info ---
  const handleSaveCompany = () => {
    if (!editingCompany.name) return showDialog('alert', 'กรุณากรอกชื่อบริษัท');
    if (editingCompany.id) {
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? editingCompany : c));
    } else {
      const newComp = { ...editingCompany, id: `comp_${Date.now()}` };
      setCompanies([...companies, newComp]);
      setActiveCompanyId(newComp.id);
    }
    setEditingCompany(null);
  };
  const handleDeleteCompany = (id) => {
    if(companies.length === 1) return showDialog('alert', 'ต้องมีข้อมูลบริษัทอย่างน้อย 1 รายการ');
    showDialog('confirm', 'ยืนยันการลบข้อมูลบริษัท?', () => {
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (activeCompanyId === id) setActiveCompanyId(companies.find(c => c.id !== id).id);
    });
  };
  const handleCompanyLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingCompany({...editingCompany, logo: reader.result});
      reader.readAsDataURL(file);
    }
  };
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQuoteSettings({...quoteSettings, preparerSignature: reader.result});
      reader.readAsDataURL(file);
    }
  };

  const getActiveCompany = () => companies.find(c => c.id === activeCompanyId) || companies[0];

  // --- Export / Print ---
  const getA4PageCanvases = async () => {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    const sourceCanvas = await window.html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: printRef.current.scrollWidth,
      windowHeight: printRef.current.scrollHeight,
    });

    // อัตราส่วน A4 แนวตั้ง 210 x 297 มม.
    const pageHeight = Math.floor(sourceCanvas.width * (297 / 210));
    const pages = [];
    for (let offsetY = 0; offsetY < sourceCanvas.height; offsetY += pageHeight) {
      const sliceHeight = Math.min(pageHeight, sourceCanvas.height - offsetY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = sourceCanvas.width;
      pageCanvas.height = pageHeight;
      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        sourceCanvas,
        0, offsetY, sourceCanvas.width, sliceHeight,
        0, 0, pageCanvas.width, sliceHeight
      );
      pages.push(pageCanvas);
    }
    return pages;
  };

  const canvasToBlob = (canvas, type = 'image/jpeg', quality = 0.94) => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('ไม่สามารถสร้างไฟล์รูปภาพได้')), type, quality);
  });

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const pages = await getA4PageCanvases();
      const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      pages.forEach((pageCanvas, index) => {
        if (index > 0) pdf.addPage('a4', 'p');
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.94);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      });
      pdf.save(`${activeTab === 'quotation' ? (quoteSettings.quoteNumber || 'Quotation') : 'WPT-Report'}.pdf`);
    } catch (e) {
      console.error(e);
      showDialog('alert', 'เกิดข้อผิดพลาดในการสร้าง PDF');
    }
    setIsExporting(false);
  };

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const pages = await getA4PageCanvases();
      const baseName = activeTab === 'quotation' ? (quoteSettings.quoteNumber || 'Quotation') : 'WPT-Report';
      const files = [];
      for (let i = 0; i < pages.length; i += 1) {
        const blob = await canvasToBlob(pages[i]);
        files.push(new File([blob], `${baseName}-page-${i + 1}.jpg`, { type: 'image/jpeg' }));
      }

      // iPhone/iPad/Android: เปิด Share Sheet เพื่อเลือก “บันทึกรูปภาพ” ลงแกลเลอรี่
      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          files,
          title: baseName,
          text: `เอกสาร ${baseName} จำนวน ${files.length} หน้า`,
        });
      } else {
        files.forEach((file, index) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.download = file.name;
          link.href = url;
          document.body.appendChild(link);
          setTimeout(() => {
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
          }, index * 250);
        });
        showDialog('alert', 'บันทึกเป็นไฟล์รูปภาพแล้ว หากใช้ iPhone/iPad ให้เปิดไฟล์แล้วเลือก “บันทึกรูปภาพ”');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        showDialog('alert', 'เกิดข้อผิดพลาดในการสร้างรูปภาพ');
      }
    }
    setIsExporting(false);
  };

  const handleActualPrint = () => { setIsPreviewModalOpen(false); setTimeout(() => window.print(), 300); };


  // --- TABS DEFINITION ---
  const TABS = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'retaining', label: 'กำแพงกันดิน', icon: Layers },
    { id: 'fence', label: 'รั้วคอนกรีต', icon: Component },
    { id: 'beam', label: 'คอนกรีตคาน', icon: Pickaxe },
    { id: 'stay', label: 'คอนกรีตสเตย์', icon: Hammer },
    { id: 'labor', label: 'ค่าดำเนินการ', icon: Briefcase },
    { id: 'estimate', label: 'ประมาณราคา', icon: ClipboardList },
    { id: 'quotation', label: 'ใบเสนอราคา', icon: FileSignature },
  ];

  // ==========================================
  // RENDER: STANDARD TABLE (EDITABLE PRICES)
  // ==========================================
  const renderStandardTable = (items, setItems, title, dividerLabel, dividerValue, setDividerValue, isPreview = false) => {
    const addItem = () => setItems([...items, { id: Date.now(), code: 'W-001', customName: '', qty: 0, itemLength: '', unitPrice: PRODUCT_CATALOG['W-001'].price, customUnit: 'แผ่น' }]);
    const updateItem = (id, field, value) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    const handleCodeChange = (id, newCode) => {
      const product = PRODUCT_CATALOG[newCode];
      setItems(items.map(item => item.id === id ? { ...item, code: newCode, unitPrice: product?.price || 0, customUnit: product?.unit || 'หน่วย' } : item));
    };
    const removeItem = (id) => setItems(items.filter(item => item.id !== id));

    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6 ${isPreview ? 'border-gray-300 dark:border-gray-300 shadow-none text-black' : ''}`}>
        <div className={`bg-blue-50/50 dark:bg-slate-700/50 border-b border-blue-200 dark:border-slate-600 p-4 flex justify-between items-center ${isPreview ? 'bg-blue-50/30 dark:bg-blue-50/30' : ''}`}>
          <div className={`font-semibold text-lg ${isPreview ? 'text-slate-900' : 'text-blue-800 dark:text-blue-400'}`}>{title}</div>
          <div className={`flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border shadow-sm ${isPreview ? 'border-gray-300 text-slate-900' : 'dark:bg-slate-800 border-gray-200 dark:border-slate-600'}`}>
            <span className={`${isPreview ? 'text-slate-700' : 'text-gray-600 dark:text-gray-300'} whitespace-nowrap`}>{dividerLabel}:</span>
            {isPreview ? <span className="w-10 text-right font-bold text-blue-700">{dividerValue}</span> : <input type="number" value={dividerValue} onChange={(e) => setDividerValue(e.target.value)} className="w-16 text-right font-semibold text-blue-700 dark:text-blue-400 outline-none bg-transparent" />}
            <span className={`${isPreview ? 'text-slate-700' : 'text-gray-600 dark:text-gray-300'}`}>เมตร</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm text-left ${isPreview ? 'text-slate-800' : 'text-gray-700 dark:text-gray-200'}`}>
            <thead className={`text-xs uppercase border-b ${isPreview ? 'bg-gray-100 text-slate-700 border-gray-300' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700'}`}>
              <tr>
                <th className="px-4 py-3">รายการสินค้า</th>
                <th className="px-4 py-3 text-center w-28">ความยาว(ม.)</th>
                <th className="px-4 py-3 text-right w-24">จำนวน</th>
                <th className="px-4 py-3 text-center w-20">หน่วย</th>
                <th className="px-4 py-3 text-right w-28 text-blue-600 dark:text-blue-400">ราคา/หน่วย</th>
                <th className="px-4 py-3 text-right w-32">รวม (บาท)</th>
                {!isPreview && <th className="px-4 py-3 text-center w-16">ลบ</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isCustom = item.code === 'CUSTOM';
                const product = PRODUCT_CATALOG[item.code];
                const unit = item.customUnit || product?.unit || '-';
                return (
                  <tr key={item.id} className={`border-b last:border-0 ${isPreview ? 'border-gray-200' : 'dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50'}`}>
                    <td className="px-4 py-3">
                      {isPreview ? (
                        <div className="font-medium py-1">{isCustom ? item.customName : product?.name}</div>
                      ) : (
                        <>
                          <select value={item.code} onChange={(e) => handleCodeChange(item.id, e.target.value)} className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md block w-full p-2 mb-1 dark:text-white">{Object.entries(PRODUCT_CATALOG).map(([code, p]) => <option key={code} value={code}>{p.name}</option>)}</select>
                          {isCustom && <input type="text" placeholder="ระบุชื่อรายการ..." value={item.customName} onChange={(e) => updateItem(item.id, 'customName', e.target.value)} className="bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-md block w-full p-2 dark:text-white" />}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPreview ? (
                        <div className={`py-1 ${unit === 'เมตร' ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>{item.itemLength || '-'}</div>
                      ) : (
                        <input type="number" step="0.01" placeholder={unit === 'เมตร' ? "ระบุความยาว" : "-"} value={item.itemLength} onChange={(e) => updateItem(item.id, 'itemLength', e.target.value)} disabled={unit !== 'เมตร'} className={`border border-gray-300 dark:border-slate-600 rounded-md block w-full p-2 text-center ${unit === 'เมตร' ? 'text-blue-600 dark:text-blue-400 focus:ring-blue-500 bg-white dark:bg-slate-700' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'}`} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPreview ? <div className="py-1">{item.qty}</div> : <input type="number" min="0" step="0.01" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md block w-full p-2 text-right dark:text-white" />}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      {isPreview ? <div className="py-1">{unit}</div> : (isCustom ? <input type="text" value={item.customUnit || ''} placeholder="หน่วย" onChange={(e) => updateItem(item.id, 'customUnit', e.target.value)} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md block w-full p-2 text-center dark:text-white" /> : unit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPreview ? <div className="py-1">{parseFloat(item.unitPrice).toLocaleString()}</div> : <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md block w-full p-2 text-right text-blue-700 dark:text-blue-300 font-medium" />}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isPreview ? 'text-slate-900' : 'text-blue-700 dark:text-blue-400'}`}>
                      {getItemTotal(item).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    {!isPreview && <td className="px-4 py-3 text-center"><button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><Trash2 size={18} /></button></td>}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 ${isPreview ? 'bg-gray-50 border-gray-300' : 'bg-blue-50/50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'}`}>
                <td colSpan="5" className={`px-4 py-3 text-right font-semibold ${isPreview ? 'text-slate-800' : 'text-blue-800 dark:text-blue-300'}`}>เฉลี่ยต่อเมตร (หาร {dividerValue} ม.):</td>
                <td className={`px-4 py-3 text-right font-bold text-lg ${isPreview ? 'text-slate-900' : 'text-blue-700 dark:text-blue-400'}`}>{((items.reduce((sum, item) => sum + getItemTotal(item), 0)) / (parseFloat(dividerValue) || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                {!isPreview && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
        {!isPreview && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
            <button onClick={addItem} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium border text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700 border-blue-200 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"><Plus size={16} /> เพิ่มรายการ</button>
          </div>
        )}
      </div>
    );
  };

  const renderConcreteTable = (items, setItems, title, dividerLabel, sectionLength, setSectionLength, isPreview = false) => {
    const addItem = () => setItems([...items, { id: Date.now(), code: 'CUSTOM', customName: 'รายการใหม่', qty: 0, unitPrice: 0, customUnit: 'หน่วย' }]);
    const updateItem = (id, field, value) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    const handleCodeChange = (id, newCode) => {
      const product = PRODUCT_CATALOG[newCode];
      setItems(items.map(item => item.id === id ? { ...item, code: newCode, unitPrice: product?.price || 0, customUnit: product?.unit || 'หน่วย' } : item));
    };
    const removeItem = (id) => setItems(items.filter(item => item.id !== id));

    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6 ${isPreview ? 'border-gray-300 shadow-none text-black' : ''}`}>
        <div className={`bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 p-4 flex justify-between items-center ${isPreview ? 'bg-gray-100/50' : ''}`}>
          <div className={`font-semibold text-lg ${isPreview ? 'text-slate-900' : 'text-slate-800 dark:text-slate-200'}`}>{title}</div>
          <div className={`flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border shadow-sm ${isPreview ? 'border-gray-300 text-slate-900' : 'dark:bg-slate-800 border-gray-200 dark:border-slate-600'}`}>
            <span className={`${isPreview ? 'text-slate-700' : 'text-gray-600 dark:text-gray-300'} whitespace-nowrap`}>{dividerLabel}:</span>
            {isPreview ? <span className="w-10 text-right font-bold text-slate-800">{sectionLength}</span> : <input type="number" value={sectionLength} onChange={(e) => setSectionLength(e.target.value)} className="w-16 text-right font-semibold text-slate-700 dark:text-slate-200 outline-none bg-transparent" />}
            <span className={`${isPreview ? 'text-slate-700' : 'text-gray-600 dark:text-gray-300'}`}>เมตร</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm text-left ${isPreview ? 'text-slate-800' : 'text-gray-700 dark:text-gray-200'}`}>
            <thead className={`text-xs uppercase border-b ${isPreview ? 'bg-gray-100 text-slate-700 border-gray-300' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700'}`}>
              <tr>
                <th className="px-4 py-3">รายการสินค้า</th>
                <th className="px-4 py-3 text-right w-24">จำนวน</th>
                <th className="px-4 py-3 text-center w-24">หน่วย</th>
                <th className="px-4 py-3 text-right w-32 text-blue-600 dark:text-blue-400">ราคา/หน่วย</th>
                <th className="px-4 py-3 text-right w-32">รวม (บาท)</th>
                {!isPreview && <th className="px-4 py-3 text-center w-16">ลบ</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const unit = item.customUnit || PRODUCT_CATALOG[item.code]?.unit || '-';
                return (
                  <tr key={item.id} className={`border-b last:border-0 ${isPreview ? 'border-gray-200' : 'dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50'} ${item.isFixed ? (isPreview ? 'bg-slate-50/50' : 'bg-slate-50/30 dark:bg-slate-800/80') : ''}`}>
                    <td className="px-4 py-3">
                      {isPreview ? (
                        <div className="flex flex-col gap-1 py-1">
                          <div className="font-medium">{item.customName || PRODUCT_CATALOG[item.code]?.name}</div>
                          {item.isConcrete && <div className="text-xs text-gray-500">กว้าง {item.width} x สูง {item.height} x ยาว {sectionLength} ม.</div>}
                        </div>
                      ) : (
                        item.isConcrete ? (
                          <div className="flex flex-col gap-2">
                            <div className="font-semibold">{item.customName}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              กว้าง <input type="number" step="0.01" value={item.width} onChange={e => updateItem(item.id, 'width', e.target.value)} className="w-16 p-1 border dark:border-slate-600 rounded text-center bg-white dark:bg-slate-700 dark:text-white" />
                              x สูง <input type="number" step="0.01" value={item.height} onChange={e => updateItem(item.id, 'height', e.target.value)} className="w-16 p-1 border dark:border-slate-600 rounded text-center bg-white dark:bg-slate-700 dark:text-white" />
                              x ยาว <span className="font-bold w-12 text-center bg-gray-100 dark:bg-slate-900 rounded p-1">{sectionLength}</span> ม.
                            </div>
                          </div>
                        ) : (item.isFixed ? <div className="font-semibold py-2">{item.customName}</div> : (
                          <div className="flex flex-col gap-2">
                            <select value={item.code} onChange={(e) => handleCodeChange(item.id, e.target.value)} className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md block w-full p-2 dark:text-white">{Object.entries(PRODUCT_CATALOG).map(([code, p]) => <option key={code} value={code}>{p.name}</option>)}</select>
                            {item.code === 'CUSTOM' && <input type="text" placeholder="ระบุชื่อ..." value={item.customName} onChange={(e) => updateItem(item.id, 'customName', e.target.value)} className="bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-md block w-full p-2 dark:text-white" />}
                          </div>
                        ))
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPreview ? <div className={`py-1 ${item.isConcrete ? 'font-semibold text-blue-700' : ''}`}>{item.isConcrete ? getConcreteVolume(item, sectionLength).toFixed(3) : item.qty}</div> : (item.isConcrete ? <div className="font-semibold text-blue-600 dark:text-blue-400 py-2">{getConcreteVolume(item, sectionLength).toFixed(3)}</div> : <input type="number" min="0" step="0.01" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md block w-full p-2 text-right dark:text-white" />)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      {isPreview ? <div className="py-1">{unit}</div> : (item.isFixed ? item.customUnit : (item.code === 'CUSTOM' ? <input type="text" value={item.customUnit || ''} onChange={(e) => updateItem(item.id, 'customUnit', e.target.value)} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md w-full p-2 text-center dark:text-white" /> : unit))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPreview ? <div className="py-1">{parseFloat(item.unitPrice).toLocaleString()}</div> : <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md block w-full p-2 text-right text-blue-700 dark:text-blue-300 font-medium" />}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isPreview ? 'text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}>{getItemTotal(item, sectionLength).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    {!isPreview && <td className="px-4 py-3 text-center">{!item.isFixed && <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><Trash2 size={18} /></button>}</td>}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 ${isPreview ? 'bg-gray-50 border-gray-300' : 'bg-gray-50/50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'}`}>
                <td colSpan="4" className={`px-4 py-3 text-right font-semibold ${isPreview ? 'text-slate-800' : 'text-slate-800 dark:text-slate-300'}`}>เฉลี่ยต่อเมตร (หาร {sectionLength} ม.):</td>
                <td className={`px-4 py-3 text-right font-bold text-lg ${isPreview ? 'text-slate-900' : 'text-slate-700 dark:text-slate-200'}`}>{((items.reduce((sum, item) => sum + getItemTotal(item, sectionLength), 0)) / (parseFloat(sectionLength) || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                {!isPreview && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
        {!isPreview && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
            <button onClick={addItem} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium border text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"><Plus size={16} /> เพิ่มรายการ</button>
          </div>
        )}
      </div>
    );
  };

  const renderLaborTable = (isPreview = false) => {
    const addItem = () => setLaborItems([...laborItems, { id: Date.now(), name: '', pricePerMeter: 0 }]);
    const updateItem = (id, field, value) => setLaborItems(laborItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    const removeItem = (id) => setLaborItems(laborItems.filter(item => item.id !== id));

    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6 ${isPreview ? 'border-gray-300 shadow-none text-black' : ''}`}>
         <div className={`border-b p-4 font-semibold text-lg ${isPreview ? 'bg-yellow-50/50 text-yellow-900 border-gray-300' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50'}`}>ค่าดำเนินการและค่าแรง (ราคาต่อ 1 เมตร)</div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm text-left ${isPreview ? 'text-slate-800' : 'text-gray-700 dark:text-gray-200'}`}>
            <thead className={`text-xs uppercase border-b ${isPreview ? 'bg-gray-100 text-slate-700 border-gray-300' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700'}`}>
              <tr>
                <th className="px-4 py-3">รายการ</th>
                <th className="px-4 py-3 text-right w-48">ราคาต่อเมตร (บาท)</th>
                {!isPreview && <th className="px-4 py-3 text-center w-16">ลบ</th>}
              </tr>
            </thead>
            <tbody>
              {laborItems.map((item) => (
                <tr key={item.id} className={`border-b last:border-0 ${isPreview ? 'border-gray-200' : 'dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50'}`}>
                  <td className="px-4 py-3">{isPreview ? <div className="py-1 font-medium">{item.name}</div> : <input type="text" placeholder="ชื่อรายการ..." value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md w-full p-2 dark:text-white" />}</td>
                  <td className="px-4 py-3 text-right">{isPreview ? <div className="py-1 font-semibold text-yellow-700">{parseFloat(item.pricePerMeter).toLocaleString()}</div> : <input type="number" min="0" value={item.pricePerMeter} onChange={(e) => updateItem(item.id, 'pricePerMeter', e.target.value)} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md w-full p-2 text-right font-medium text-yellow-700 dark:text-yellow-400" />}</td>
                  {!isPreview && <td className="px-4 py-3 text-center"><button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><Trash2 size={18} /></button></td>}
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className={`border-t-2 ${isPreview ? 'bg-gray-50 border-gray-300' : 'bg-yellow-50/50 dark:bg-yellow-900/10 border-gray-200 dark:border-slate-600'}`}>
                <td className={`px-4 py-3 text-right font-semibold ${isPreview ? 'text-yellow-900' : 'text-yellow-800 dark:text-yellow-400'}`}>รวมค่าดำเนินการ (ต่อเมตร):</td>
                <td className={`px-4 py-3 text-right font-bold text-lg ${isPreview ? 'text-yellow-800' : 'text-yellow-700 dark:text-yellow-300'}`}>{totals.laborPerMeterRaw.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                {!isPreview && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
        {!isPreview && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
            <button onClick={addItem} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-slate-700 border border-yellow-200 dark:border-slate-600 hover:bg-yellow-100 dark:hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors"><Plus size={16} /> เพิ่มรายการ</button>
          </div>
        )}
      </div>
    );
  }

  const renderDashboard = (isPreview = false) => {
    const costRows = [
      { key: 'retaining', label: 'กำแพงกันดิน', icon: Layers, val: totals.retainingPerMeter, accent: 'cyan' },
      { key: 'fence', label: 'รั้วคอนกรีต', icon: Component, val: totals.fencePerMeter, accent: 'blue' },
      { key: 'beam', label: 'คอนกรีตคาน', icon: Pickaxe, val: totals.beamPerMeter, accent: 'indigo' },
      { key: 'stay', label: 'คอนกรีตสเตย์', icon: Hammer, val: totals.stayPerMeter, accent: 'violet' },
      { key: 'labor', label: 'ค่าดำเนินการ', icon: Briefcase, val: totals.laborPerMeterRaw, accent: 'amber' },
    ];
    const safeTotal = totals.grandTotalPerMeter || 1;
    const selectedRows = costRows.filter(row => activeSections[row.key]);
    const materialPct = Math.min(100, (totals.materialsPerMeter / safeTotal) * 100);
    const laborPct = Math.min(100, (totals.laborPerMeter / safeTotal) * 100);

    if (isPreview) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              ['รวมวัสดุที่เลือก (ต่อเมตร)', totals.materialsPerMeter],
              ['รวมค่าดำเนินการที่เลือก', totals.laborPerMeter],
              ['ต้นทุนสุทธิรวม (ต่อเมตร)', totals.grandTotalPerMeter],
            ].map(([label, value], i) => (
              <div key={label} className={`p-5 rounded-xl border ${i === 2 ? 'bg-blue-700 text-white' : 'bg-white border-gray-300'}`}>
                <div className="text-sm font-semibold opacity-75">{label}</div>
                <div className="text-3xl font-black mt-2">{value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ฿</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
            {selectedRows.map(row => <div key={row.key} className="flex justify-between px-6 py-4 border-b last:border-0"><span className="font-medium">{row.label}</span><span className="font-bold">{row.val.toLocaleString(undefined,{minimumFractionDigits:2})} ฿</span></div>)}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="tech-card group relative overflow-hidden p-5 min-h-[164px]">
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,.12)]"><Layers size={23}/></div>
              <span className="tech-badge">MATERIAL</span>
            </div>
            <div className="mt-5 text-xs tracking-[.14em] uppercase text-slate-400 font-semibold">รวมวัสดุที่เลือก / เมตร</div>
            <div className="mt-1 text-3xl sm:text-4xl font-black text-white tracking-tight">{totals.materialsPerMeter.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} <span className="text-xl text-cyan-300">฿</span></div>
            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{width:`${materialPct}%`}} /></div>
          </div>

          <div className="tech-card group relative overflow-hidden p-5 min-h-[164px] border-amber-400/20">
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center text-amber-300 shadow-[0_0_24px_rgba(251,191,36,.12)]"><Calculator size={23}/></div>
              <span className="tech-badge text-amber-300 border-amber-300/20 bg-amber-400/10">OPERATION</span>
            </div>
            <div className="mt-5 text-xs tracking-[.14em] uppercase text-slate-400 font-semibold">รวมค่าดำเนินการที่เลือก</div>
            <div className="mt-1 text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">{totals.laborPerMeter.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} <span className="text-xl">฿</span></div>
            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style={{width:`${laborPct}%`}} /></div>
          </div>

          <div className="tech-card tech-card-primary relative overflow-hidden p-5 min-h-[164px]">
            <div className="absolute inset-0 tech-grid opacity-30" />
            <div className="relative flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-400/15 border border-blue-300/30 flex items-center justify-center text-blue-200 shadow-[0_0_28px_rgba(59,130,246,.25)]"><LayoutDashboard size={23}/></div>
              <span className="tech-badge text-blue-100 border-blue-300/30 bg-blue-400/15">NET COST</span>
            </div>
            <div className="relative mt-5 text-xs tracking-[.14em] uppercase text-blue-100/70 font-semibold">ต้นทุนสุทธิรวม / เมตร</div>
            <div className="relative mt-1 text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_0_16px_rgba(96,165,250,.5)]">{totals.grandTotalPerMeter.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} <span className="text-xl text-blue-200">฿</span></div>
            <div className="relative mt-4 flex items-center gap-2 text-xs text-blue-100/70"><CheckCircle2 size={14} className="text-cyan-300"/> คำนวณจากรายการที่เปิดใช้งาน</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.25fr] gap-4">
          <section className="tech-card p-5">
            <div className="flex items-center justify-between mb-5"><div><div className="text-white font-bold text-lg">สัดส่วนต้นทุน</div><div className="text-slate-500 text-xs mt-1">Cost distribution per meter</div></div><span className="tech-badge">LIVE</span></div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-44 h-44 rounded-full p-[14px] shadow-[0_0_35px_rgba(37,99,235,.15)]" style={{background:`conic-gradient(#22d3ee 0 ${materialPct}%, #f59e0b ${materialPct}% 100%)`}}>
                <div className="w-full h-full rounded-full bg-[#071322] border border-slate-700/80 flex flex-col items-center justify-center">
                  <span className="text-slate-500 text-xs">รวมทั้งหมด</span><span className="text-white text-2xl font-black mt-1">{totals.grandTotalPerMeter.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span className="text-cyan-300 text-xs mt-1">บาท / เมตร</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-3">
                {costRows.map(row => {
                  const pct = row.val > 0 ? (row.val / safeTotal) * 100 : 0;
                  return <div key={row.key} className="flex items-center gap-3"><span className={`w-2.5 h-2.5 rounded-full ${row.accent==='amber'?'bg-amber-400':row.accent==='cyan'?'bg-cyan-400':row.accent==='violet'?'bg-violet-400':row.accent==='indigo'?'bg-indigo-400':'bg-blue-400'}`} /><span className="text-slate-300 text-sm flex-1">{row.label}</span><span className="text-slate-500 text-xs w-12 text-right">{pct.toFixed(1)}%</span><span className="text-white text-sm font-semibold w-24 text-right">{row.val.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
                })}
              </div>
            </div>
          </section>

          <section className="tech-card p-5 overflow-hidden">
            <div className="flex items-center justify-between"><div><div className="text-white font-bold text-lg">ภาพรวมต้นทุน</div><div className="text-slate-500 text-xs mt-1">Cost comparison by category</div></div><span className="tech-badge">บาท / เมตร</span></div>
            <div className="mt-7 h-52 flex items-end gap-3 sm:gap-5 border-b border-l border-slate-700/70 px-4 pb-0 relative">
              {[...Array(4)].map((_,i)=><div key={i} className="absolute left-0 right-0 border-t border-dashed border-slate-800" style={{bottom:`${(i+1)*20}%`}} />)}
              {costRows.map(row => {
                const h = Math.max(8, Math.min(100,(row.val/safeTotal)*100));
                return <div key={row.key} className="flex-1 h-full flex flex-col justify-end items-center relative z-10 group"><div className="text-[10px] text-slate-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{row.val.toFixed(0)}</div><div className={`w-full max-w-14 rounded-t-lg border border-white/10 ${row.accent==='amber'?'bg-gradient-to-t from-amber-700 to-amber-300':row.accent==='cyan'?'bg-gradient-to-t from-cyan-800 to-cyan-300':row.accent==='violet'?'bg-gradient-to-t from-violet-800 to-violet-400':row.accent==='indigo'?'bg-gradient-to-t from-indigo-800 to-indigo-400':'bg-gradient-to-t from-blue-800 to-blue-400'} shadow-[0_0_20px_rgba(59,130,246,.12)] transition-all duration-500`} style={{height:`${h}%`}} /></div>
              })}
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3 text-[10px] text-slate-500 text-center"><span>กันดิน</span><span>รั้ว</span><span>คาน</span><span>สเตย์</span><span>ดำเนินการ</span></div>
          </section>
        </div>

        <section className="tech-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><div className="text-white font-bold text-lg">เลือกรายการเพื่อบวกยอดรวม</div><div className="text-slate-500 text-xs mt-1">เปิดหรือปิดหมวดต้นทุนได้ทันที</div></div><div className="text-xs text-slate-400"><span className="text-cyan-300 font-bold">{selectedRows.length}</span> / {costRows.length} หมวดถูกเลือก</div></div>
          <div className="divide-y divide-slate-800">
            {costRows.map(row => {
              const Icon=row.icon; const active=activeSections[row.key];
              return <div key={row.key} className={`px-5 py-4 flex items-center gap-4 transition-colors ${active?'bg-blue-500/[.035]':'opacity-45 bg-slate-950/20'}`}>
                <button onClick={()=>toggleSection(row.key)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${active?'bg-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,.45)]':'border-slate-600'}`}>{active&&<CheckCircle2 size={14} className="text-white"/>}</button>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${row.accent==='amber'?'bg-amber-400/10 border-amber-300/20 text-amber-300':'bg-blue-400/10 border-blue-300/20 text-blue-300'}`}><Icon size={18}/></div>
                <div className="flex-1 min-w-0"><div className={`font-medium ${active?'text-slate-100':'text-slate-500 line-through'}`}>{row.label}{row.key==='beam'&&active&&<select value={beamMultiplier} onClick={e=>e.stopPropagation()} onChange={e=>setBeamMultiplier(Number(e.target.value))} className="ml-3 bg-slate-900 border border-blue-400/30 text-cyan-300 text-xs rounded-md px-2 py-1 outline-none"><option value={1}>x1 ชั้น</option><option value={2}>x2 ชั้น</option><option value={3}>x3 ชั้น</option></select>}</div><div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden max-w-md"><div className={`h-full ${row.accent==='amber'?'bg-amber-400':'bg-blue-500'}`} style={{width:`${Math.min(100,(row.val/safeTotal)*100)}%`}} /></div></div>
                <div className={`font-bold text-right ${row.accent==='amber'?'text-amber-300':'text-white'}`}>{row.val.toLocaleString(undefined,{minimumFractionDigits:2})} ฿</div>
              </div>
            })}
          </div>
          <div className="px-5 py-4 bg-gradient-to-r from-blue-600/10 to-cyan-400/5 border-t border-blue-400/20 flex items-center justify-between"><span className="text-slate-300 font-semibold">ยอดรวมสุทธิต่อเมตร</span><span className="text-2xl sm:text-3xl font-black text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,.25)]">{totals.grandTotalPerMeter.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ฿</span></div>
        </section>
      </div>
    );
  };

  const renderEstimation = (isPreview = false) => {
    const selectedItems = savedEstimates.filter(e => e.isSelected);
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {selectedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 break-inside-avoid">
            {selectedItems.map((item) => (
              <div key={item.id} className={`${isPreview ? 'bg-white border-2 border-blue-600 text-slate-900' : 'bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white shadow-lg'} p-6 rounded-xl flex flex-col relative overflow-hidden`}>
                <div className={`${isPreview ? 'text-blue-800 font-bold' : 'text-blue-100 font-semibold'} text-sm mb-2 truncate pr-6`}>{item.name}</div>
                <div className={`text-3xl font-black ${isPreview ? 'text-slate-900' : ''}`}>{item.total.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className={`text-lg font-medium ${isPreview ? 'text-slate-500' : 'text-blue-200'}`}>฿</span></div>
                <div className={`text-xs mt-auto pt-4 ${isPreview ? 'text-slate-500' : 'text-blue-200/80'}`}>{item.date}</div>
              </div>
            ))}
          </div>
        )}
        <div className={`rounded-xl overflow-hidden ${isPreview ? 'bg-white border border-gray-300' : 'bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700'}`}>
          <div className={`border-b p-4 font-semibold flex justify-between items-center ${isPreview ? 'bg-gray-100 text-slate-800 border-gray-300' : 'bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}>
            <span>รายการประวัติประมาณราคา</span>
            {!isPreview && <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded-full">เลือกแสดงได้ {selectedItems.length}/6</span>}
          </div>
          <div className="overflow-x-auto">
            {savedEstimates.length > 0 ? (
              <table className={`w-full text-sm text-left ${isPreview ? 'text-slate-800' : 'text-gray-700 dark:text-gray-300'}`}>
                <thead className={`text-xs uppercase border-b ${isPreview ? 'bg-gray-50 text-slate-600 border-gray-300' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/30 border-gray-200 dark:border-slate-700'}`}>
                  <tr>
                    {!isPreview && <th className="px-4 py-3 w-16 text-center">แสดง</th>}
                    <th className="px-4 py-3">ชื่อรายการ</th>
                    <th className="px-4 py-3 text-right">ยอดรวม (บาท/เมตร)</th>
                    <th className="px-4 py-3 text-center">วันที่บันทึก</th>
                    {!isPreview && <th className="px-4 py-3 text-center w-24">จัดลำดับ</th>}
                    {!isPreview && <th className="px-4 py-3 text-center w-16">ลบ</th>}
                  </tr>
                </thead>
                <tbody>
                  {savedEstimates.map((item, index) => {
                    if (isPreview && !item.isSelected) return null;
                    return (
                      <tr key={item.id} className={`border-b last:border-0 ${isPreview ? 'border-gray-200' : 'dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                        {!isPreview && <td className="px-4 py-3 text-center"><input type="checkbox" checked={item.isSelected} onChange={(e) => handleSelectEstimate(item.id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /></td>}
                        <td className={`px-4 py-3 font-medium ${isPreview ? 'text-slate-900' : 'text-gray-900 dark:text-white'}`}>{item.name}</td>
                        <td className={`px-4 py-3 text-right font-bold ${isPreview ? 'text-blue-700' : 'text-blue-600 dark:text-blue-400'}`}>{item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{item.date}</td>
                        {!isPreview && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => moveEstimate(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"><ArrowUp size={16}/></button>
                              <button onClick={() => moveEstimate(index, 'down')} disabled={index === savedEstimates.length - 1} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"><ArrowDown size={16}/></button>
                            </div>
                          </td>
                        )}
                        {!isPreview && <td className="px-4 py-3 text-center"><button onClick={() => deleteEstimate(item.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full"><Trash2 size={16} /></button></td>}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : <div className="p-8 text-center text-gray-500">ยังไม่มีรายการประมาณราคาที่บันทึกไว้</div>}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: QUOTATION
  // ==========================================
  const renderQuotationList = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><FileSignature className="text-blue-600"/> รายการใบเสนอราคา</h2>
         <button onClick={handleCreateNewQuote} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Plus size={18}/> เพิ่มใบเสนอราคา</button>
      </div>

      <div className="rounded-xl border overflow-hidden bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 w-32">เลขที่เอกสาร</th>
                  <th className="px-4 py-3 w-28">วันที่</th>
                  <th className="px-4 py-3">ชื่อลูกค้า / บริษัท</th>
                  <th className="px-4 py-3">ผู้จัดทำ</th>
                  <th className="px-4 py-3 text-right">ยอดสุทธิ (บาท)</th>
                  <th className="px-4 py-3 text-center w-36">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {savedQuotations.length > 0 ? savedQuotations.map(q => (
                  <tr key={q.id} onClick={() => openSavedQuotePreview(q)} className="border-b dark:border-slate-700 hover:bg-blue-50/70 dark:hover:bg-blue-500/10 cursor-pointer transition-colors" title="แตะเพื่อเปิดภาพพรีวิว">
                    <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{q.settings.quoteNumber}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(q.settings.date).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3">
                       <div className="font-bold text-gray-800 dark:text-white">{q.customer.contactName || '-'}</div>
                       <div className="text-xs text-gray-500">{q.customer.companyName || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{q.settings.preparerName || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{q.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-center">
                       <div className="flex justify-center gap-1">
                         <button onClick={(e) => { e.stopPropagation(); handleEditQuote(q); }} title="เปิด/แก้ไข" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"><Edit size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); handleDuplicateQuote(q); }} title="คัดลอกสร้างใหม่" className="p-1.5 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-slate-700 rounded"><Copy size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteQuote(q.id); }} title="ลบ" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">ยังไม่มีข้อมูลใบเสนอราคา กดปุ่ม "+ เพิ่มใบเสนอราคา" เพื่อเริ่มต้นใช้งาน</td></tr>}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );

  const renderQuotationForm = () => {
    const activeCompany = getActiveCompany();
    const { subTotal, grandTotal } = calcQuoteTotals(quoteSelectedItems, quoteSettings.discount, quoteSettings.useVat);
    const vatAmt = quoteSettings.useVat ? (subTotal - (parseFloat(quoteSettings.discount)||0)) * 0.07 : 0;
    const afterDiscount = subTotal - (parseFloat(quoteSettings.discount)||0);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3 items-center border-b dark:border-slate-700 pb-4">
          <button onClick={() => setQuoteView('list')} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 dark:hover:text-white px-2 py-1"><ChevronLeft size={20}/> กลับ</button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          <button onClick={() => setIsQuoteDbModalOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Settings size={18}/> จัดการสินค้า</button>
          <button onClick={() => setIsCustomerInfoModalOpen(true)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><User size={18}/> ข้อมูลลูกค้า</button>
          <button onClick={() => setIsCompanyModalOpen(true)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Building2 size={18}/> ข้อมูลบริษัท</button>
          
          <div className="flex-1"></div>
          
          <button onClick={handleSaveQuotationDoc} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Save size={18}/> บันทึกเอกสารนี้</button>
          <button onClick={() => setIsQuoteSelectorModalOpen(true)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><ListPlus size={18}/> เลือกรายการเข้าตาราง</button>
        </div>

        {/* HEADER QUOTE INFO */}
        <div className="rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm text-sm">
          <div className="flex justify-between items-start border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
             <div className="flex items-center gap-4">
                <img src={activeCompany.logo} alt="Logo" className="w-16 h-16 object-cover rounded-lg border bg-white"/>
                <div>
                  <div className="font-bold text-lg text-blue-700 dark:text-blue-400">{activeCompany.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">เลขประจำตัวผู้เสียภาษี: {activeCompany.taxId}</div>
                  <div className="text-gray-500 dark:text-gray-400">โทร: {activeCompany.phone}</div>
                </div>
             </div>
             <div className="text-right">
               <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ใบเสนอราคา / Quotation</h2>
               <div className="flex items-center justify-end gap-2 mb-1">
                 <span className="text-gray-500 dark:text-gray-400 font-medium">เลขที่:</span>
                 <input type="text" value={quoteSettings.quoteNumber} onChange={e=>setQuoteSettings({...quoteSettings, quoteNumber:e.target.value})} className="border rounded px-2 py-1 w-36 text-right bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
               </div>
               <div className="flex items-center justify-end gap-2">
                 <span className="text-gray-500 dark:text-gray-400 font-medium">วันที่:</span>
                 <input type="date" value={quoteSettings.date} onChange={e=>setQuoteSettings({...quoteSettings, date:e.target.value})} className="border rounded px-2 py-1 w-36 text-right bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-gray-800 dark:text-gray-200">
            <div><span className="font-semibold w-24 inline-block text-gray-500">เรียน/ลูกค้า:</span> {customerInfo.contactName || '-'} {customerInfo.contactPhone ? `(${customerInfo.contactPhone})` : ''}</div>
            <div><span className="font-semibold w-24 inline-block text-gray-500">โครงการ:</span> {customerInfo.project || '-'}</div>
            <div><span className="font-semibold w-24 inline-block text-gray-500">บริษัทลูกค้า:</span> {customerInfo.companyName || '-'}</div>
            <div><span className="font-semibold w-24 inline-block text-gray-500 text-nowrap">รายละเอียด:</span> {customerInfo.projectDetails || '-'}</div>
            <div className="col-span-2"><span className="font-semibold w-24 inline-block text-gray-500 align-top">ที่อยู่ลูกค้า:</span> <span className="inline-block w-[calc(100%-6rem)]">{customerInfo.address || '-'} {customerInfo.taxId ? `(เลขผู้เสียภาษี: ${customerInfo.taxId})` : ''}</span></div>
            <div className="col-span-2"><span className="font-semibold w-24 inline-block text-gray-500 align-top">สถานที่งาน:</span> <span className="inline-block w-[calc(100%-6rem)]">{customerInfo.siteAddress || '-'}</span></div>
          </div>
        </div>

        {/* QUOTATION TABLE & TOTALS */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">ลำดับ</th>
                  <th className="px-4 py-3 w-28">รหัสสินค้า</th>
                  <th className="px-4 py-3">รายการ (คลิกเพื่อแก้ไข)</th>
                  <th className="px-4 py-3 text-right w-24">จำนวน</th>
                  <th className="px-4 py-3 text-center w-20">หน่วย</th>
                  <th className="px-4 py-3 text-right w-32">ราคา/หน่วย</th>
                  <th className="px-4 py-3 text-right w-32">จำนวนเงิน</th>
                  <th className="px-4 py-3 w-12 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody>
                {quoteSelectedItems.length > 0 ? quoteSelectedItems.map((item, idx) => (
                  <tr key={item.id} className="border-b dark:border-slate-700">
                    <td className="px-4 py-3 text-center">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold">{item.code}</td>
                    {/* คลิกที่คอลัมน์ชื่อรายการเพื่อเปิดป๊อปอัปแก้ไข */}
                    <td className="px-4 py-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setQuoteItemEditData({...item})}>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {item.name} <Edit size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                      </div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </td>
                    <td className="px-4 py-3"><input type="number" min="1" value={item.qty} onChange={(e) => updateQuoteItemQty(item.id, e.target.value)} className="w-full text-right border border-gray-300 dark:border-slate-600 rounded p-1 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></td>
                    <td className="px-4 py-3 text-center">{item.unit}</td>
                    <td className="px-4 py-3"><input type="number" min="0" value={item.price} onChange={(e) => updateQuoteItemPrice(item.id, e.target.value)} className="w-full text-right border border-gray-300 dark:border-slate-600 rounded p-1 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></td>
                    <td className="px-4 py-3 text-right font-medium text-blue-700 dark:text-blue-400">{(item.price * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => removeQuoteItem(item.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><Trash2 size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">ไม่มีรายการสินค้า กรุณากดปุ่ม "+ เลือกรายการเข้าตาราง" ด้านบนขวา</td></tr>}
              </tbody>
            </table>
          </div>

          {/* TOTALS & SETTINGS */}
          <div className="flex flex-col sm:flex-row border-t dark:border-slate-700">
            {/* THAI TEXT */}
            <div className="flex-1 p-4 bg-gray-50 dark:bg-slate-900/30 border-r dark:border-slate-700 flex flex-col justify-end text-center sm:text-left">
              <span className="text-sm text-gray-500 mb-1">จำนวนเงินตัวอักษร</span>
              <div className="font-bold text-blue-800 dark:text-blue-300 text-lg bg-blue-100 dark:bg-blue-900/30 py-2 px-4 rounded-lg inline-block">
                ( {NumberToThaiText(grandTotal)} )
              </div>
            </div>

            {/* CALCULATION */}
            <div className="w-full sm:w-80 bg-white dark:bg-slate-800 text-sm">
              <div className="flex justify-between px-6 py-2 border-b dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">รวมเป็นเงิน (Sub Total)</span>
                <span className="font-semibold">{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center px-6 py-2 border-b dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/10">
                <span className="text-yellow-700 dark:text-yellow-500 font-medium">ส่วนลด (Discount)</span>
                <input type="number" value={quoteSettings.discount} onChange={e=>setQuoteSettings({...quoteSettings, discount: e.target.value})} className="w-24 text-right border-yellow-300 dark:border-yellow-700 rounded p-1 bg-white dark:bg-slate-700 font-medium text-yellow-700 dark:text-yellow-400 outline-none focus:ring-1 focus:ring-yellow-500" />
              </div>
              <div className="flex justify-between px-6 py-2 border-b dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">ยอดหลังหักส่วนลด</span>
                <span className="font-semibold">{afterDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center px-6 py-2 border-b dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-600 dark:text-gray-400"><input type="checkbox" checked={quoteSettings.useVat} onChange={e=>setQuoteSettings({...quoteSettings, useVat: e.target.checked})} className="w-4 h-4 rounded text-blue-600" /> ภาษีมูลค่าเพิ่ม 7%</label>
                <span className="font-semibold">{vatAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between px-6 py-4 bg-blue-50 dark:bg-slate-700/50">
                <span className="font-bold text-blue-900 dark:text-blue-300">จำนวนเงินรวมทั้งสิ้น</span>
                <span className="font-black text-xl text-blue-700 dark:text-blue-400">{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border shadow-sm dark:border-slate-700 space-y-4 text-sm">
            <div><label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">หมายเหตุ / เงื่อนไข</label><textarea value={quoteSettings.remark} onChange={e=>setQuoteSettings({...quoteSettings, remark: e.target.value})} rows="2" className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">เงื่อนไขการชำระเงิน</label><textarea value={quoteSettings.paymentTerms} onChange={e=>setQuoteSettings({...quoteSettings, paymentTerms: e.target.value})} rows="2" className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border shadow-sm dark:border-slate-700 space-y-4 text-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-slate-700">ข้อมูลบัญชีธนาคาร (สำหรับชำระเงิน)</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2"><label className="block text-gray-500 mb-1">ธนาคาร</label><input type="text" value={quoteSettings.bankName} onChange={e=>setQuoteSettings({...quoteSettings, bankName: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
               <div><label className="block text-gray-500 mb-1">เลขบัญชี</label><input type="text" value={quoteSettings.accountNo} onChange={e=>setQuoteSettings({...quoteSettings, accountNo: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none font-medium focus:ring-1 focus:ring-blue-500" /></div>
               <div><label className="block text-gray-500 mb-1">ชื่อบัญชี</label><input type="text" value={quoteSettings.accountName} onChange={e=>setQuoteSettings({...quoteSettings, accountName: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border shadow-sm dark:border-slate-700 space-y-4 text-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-slate-700">ผู้เสนอราคา (เตรียมพิมพ์)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div><label className="block text-gray-500 mb-1">ชื่อผู้เสนอราคา</label><input type="text" placeholder="ชื่อ-นามสกุล..." value={quoteSettings.preparerName} onChange={e=>setQuoteSettings({...quoteSettings, preparerName: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
               <div>
                  <label className="block text-gray-500 mb-1">รูปลายเซ็น (ไม่บังคับ)</label>
                  <div className="flex gap-2 items-center">
                    {quoteSettings.preparerSignature ? <img src={quoteSettings.preparerSignature} className="h-10 object-contain border bg-white px-2 rounded" alt="sign"/> : null}
                    <label className="cursor-pointer bg-gray-100 dark:bg-slate-700 border dark:border-slate-600 px-3 py-2 rounded text-sm hover:bg-gray-200 dark:text-white transition-colors">อัปโหลด<input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload}/></label>
                    {quoteSettings.preparerSignature && <button onClick={()=>setQuoteSettings({...quoteSettings, preparerSignature:''})} className="text-red-500 text-xs hover:underline">ลบ</button>}
                  </div>
               </div>
            </div>
        </div>

      </div>
    );
  };

  const renderQuotationPrint = () => {
    const activeCompany = getActiveCompany();
    const { subTotal, grandTotal } = calcQuoteTotals(quoteSelectedItems, quoteSettings.discount, quoteSettings.useVat);
    const discountAmt = parseFloat(quoteSettings.discount) || 0;
    const afterDiscount = subTotal - discountAmt;
    const vatAmt = quoteSettings.useVat ? afterDiscount * 0.07 : 0;

    return (
      <div className="a4-document bg-white text-black text-sm p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg relative print:shadow-none print:m-0 print:w-[210mm] print:max-w-[210mm] print:p-8">
        
        {/* Print Header */}
        <div className="flex justify-between items-start border-b-2 border-blue-800 pb-4 mb-4">
           <div className="flex items-center gap-4 w-2/3 pr-4">
              <img src={activeCompany.logo} alt="Logo" className="w-20 h-20 object-contain shrink-0"/>
              <div className="flex-1 min-w-0">
                <h1 className={`font-bold text-blue-900 leading-tight break-words ${activeCompany.name.length > 25 ? 'text-xl sm:text-xl' : 'text-2xl'}`}>{activeCompany.name}</h1>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed break-words">{activeCompany.address}</p>
                <p className="text-gray-600 text-xs truncate">เลขประจำตัวผู้เสียภาษี: {activeCompany.taxId} | โทร: {activeCompany.phone}</p>
              </div>
           </div>
           <div className="text-right flex flex-col items-end w-1/3 pl-2">
             <div className="bg-blue-800 text-white font-bold text-lg sm:text-xl py-2 px-4 sm:px-6 rounded-l-full -mr-8 mb-2 shadow-sm uppercase whitespace-nowrap">ใบเสนอราคา</div>
             <table className="text-xs text-right border-collapse w-full">
               <tbody>
                 <tr><td className="font-semibold pr-2 text-gray-500 whitespace-nowrap w-full">เลขที่:</td><td className="font-bold text-blue-900 whitespace-nowrap">{quoteSettings.quoteNumber}</td></tr>
                 <tr><td className="font-semibold pr-2 text-gray-500 whitespace-nowrap w-full">วันที่:</td><td className="font-bold whitespace-nowrap">{new Date(quoteSettings.date).toLocaleDateString('th-TH')}</td></tr>
               </tbody>
             </table>
           </div>
        </div>

        {/* Customer Info */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 border border-gray-300 rounded p-3 text-xs leading-5">
            <div className="font-bold text-blue-900 border-b border-gray-200 pb-1 mb-2">ข้อมูลลูกค้า (Customer Info)</div>
            <table className="w-full">
              <tbody>
                <tr><td className="w-20 font-semibold align-top">เรียน :</td><td>{customerInfo.contactName || '-'} {customerInfo.contactPhone ? `(${customerInfo.contactPhone})` : ''}</td></tr>
                <tr><td className="font-semibold align-top">บริษัท :</td><td>{customerInfo.companyName || '-'} {customerInfo.taxId ? `(Tax ID: ${customerInfo.taxId})` : ''}</td></tr>
                <tr><td className="font-semibold align-top">ที่อยู่ :</td><td>{customerInfo.address || '-'}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex-1 border border-gray-300 rounded p-3 text-xs leading-5">
             <div className="font-bold text-blue-900 border-b border-gray-200 pb-1 mb-2">ข้อมูลโครงการ (Project Info)</div>
             <table className="w-full">
              <tbody>
                <tr><td className="w-20 font-semibold align-top">โครงการ :</td><td>{customerInfo.project || '-'}</td></tr>
                <tr><td className="font-semibold align-top">รายละเอียด :</td><td>{customerInfo.projectDetails || '-'}</td></tr>
                <tr><td className="font-semibold align-top">สถานที่ :</td><td>{customerInfo.siteAddress || '-'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Table */}
        <table className="w-full border-collapse text-xs mb-4">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-blue-800 text-gray-800">
              <th className="py-2 text-center w-12 border-x border-gray-200">ลำดับ</th>
              <th className="py-2 text-left px-2 border-x border-gray-200 w-24">รหัส</th>
              <th className="py-2 text-left px-2 border-x border-gray-200">รายการสินค้า (Description)</th>
              <th className="py-2 text-center w-16 border-x border-gray-200">จำนวน</th>
              <th className="py-2 text-center w-16 border-x border-gray-200">หน่วย</th>
              <th className="py-2 text-right px-2 w-24 border-x border-gray-200">ราคา/หน่วย</th>
              <th className="py-2 text-right px-2 w-28 border-x border-gray-200">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {quoteSelectedItems.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2 text-center border-x border-gray-200">{idx+1}</td>
                <td className="py-2 px-2 font-semibold border-x border-gray-200">{item.code}</td>
                <td className="py-2 px-2 border-x border-gray-200">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-gray-500 text-[10px]">{item.description}</div>
                </td>
                <td className="py-2 text-center border-x border-gray-200">{item.qty}</td>
                <td className="py-2 text-center border-x border-gray-200">{item.unit}</td>
                <td className="py-2 px-2 text-right border-x border-gray-200">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-2 px-2 text-right font-medium border-x border-gray-200 text-blue-900">{(item.price * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
            {Array.from({length: Math.max(0, 8 - quoteSelectedItems.length)}).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-gray-200"><td className="py-4 border-x border-gray-200"></td><td className="border-x border-gray-200"></td><td className="border-x border-gray-200"></td><td className="border-x border-gray-200"></td><td className="border-x border-gray-200"></td><td className="border-x border-gray-200"></td><td className="border-x border-gray-200"></td></tr>
            ))}
          </tbody>
        </table>

        {/* Print Totals */}
        <div className="flex border-2 border-blue-800 rounded-sm break-inside-avoid">
          <div className="flex-1 flex flex-col border-r-2 border-blue-800">
             <div className="p-3 border-b-2 border-blue-800 text-center flex items-center justify-center flex-1">
               <span className="font-bold text-blue-900 bg-blue-50 py-1 px-4 rounded-full border border-blue-200">( {NumberToThaiText(grandTotal)} )</span>
             </div>
             <div className="p-3 text-xs leading-5 flex-1 bg-gray-50">
                <div className="font-bold text-blue-900 underline mb-1">หมายเหตุและเงื่อนไข:</div>
                <div>{quoteSettings.remark}</div>
                <div className="mt-2 font-bold text-blue-900 underline mb-1">การชำระเงิน:</div>
                <div>{quoteSettings.paymentTerms}</div>
                <div className="mt-2 text-blue-800">
                  <span className="font-bold">โอนเงินเข้าบัญชี:</span> {quoteSettings.bankName} | <span className="font-bold">เลขที่:</span> {quoteSettings.accountNo} <br/> <span className="font-bold">ชื่อบัญชี:</span> {quoteSettings.accountName}
                </div>
             </div>
          </div>
          <div className="w-72 bg-white text-xs">
            <div className="flex justify-between px-3 py-2 border-b border-gray-200"><span className="font-bold">รวมเป็นเงิน (Sub Total)</span><span>{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-yellow-600"><span className="font-bold">หักส่วนลด (Discount)</span><span>{discountAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between px-3 py-2 border-b border-gray-200"><span className="font-bold">ยอดหลังหักส่วนลด</span><span>{afterDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between px-3 py-2 border-b border-blue-800"><span className="font-bold">ภาษีมูลค่าเพิ่ม 7% (VAT)</span><span>{vatAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between px-3 py-3 bg-blue-50 text-blue-900 text-sm"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น (Grand Total)</span><span className="font-black border-double border-b-4 border-blue-900">{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-8 text-center text-xs break-inside-avoid">
           <div className="w-64">
              <div className="h-16 flex items-end justify-center mb-2">
                {quoteSettings.preparerSignature ? <img src={quoteSettings.preparerSignature} className="h-14 object-contain" alt="sign"/> : null}
              </div>
              <div className="border-b border-black w-48 mx-auto mb-2"></div>
              <div>({quoteSettings.preparerName || '...................................................'})</div>
              <div className="mt-1 font-bold">ผู้เสนอราคา / Prepared By</div>
           </div>
           <div className="w-64">
              <div className="h-16 mb-2"></div>
              <div className="border-b border-black w-48 mx-auto mb-2"></div>
              <div>(...................................................)</div>
              <div className="mt-1 font-bold">ผู้อนุมัติสั่งซื้อ / Accepted By</div>
              <div className="mt-1 text-gray-500">วันที่ / Date: ......./......./.......</div>
           </div>
        </div>

      </div>
    );
  };


  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <style>{`
        .dark .tech-card{background:linear-gradient(145deg,rgba(10,25,43,.96),rgba(5,16,29,.97));border:1px solid rgba(96,165,250,.16);border-radius:18px;box-shadow:0 18px 45px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.025)}
        .dark .tech-card-primary{background:radial-gradient(circle at 85% 20%,rgba(34,211,238,.18),transparent 35%),linear-gradient(135deg,#0d47a1 0%,#0b2f72 48%,#071a3d 100%);border-color:rgba(96,165,250,.38);box-shadow:0 18px 50px rgba(14,71,161,.26),inset 0 1px 0 rgba(255,255,255,.08)}
        .tech-badge{display:inline-flex;align-items:center;padding:.32rem .6rem;border-radius:9999px;font-size:.62rem;line-height:1;font-weight:800;letter-spacing:.13em;color:#67e8f9;background:rgba(34,211,238,.08);border:1px solid rgba(103,232,249,.16)}
        .tech-grid{background-image:linear-gradient(rgba(96,165,250,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,.12) 1px,transparent 1px);background-size:22px 22px;mask-image:linear-gradient(to left,black,transparent 75%)}
        .dark input,.dark select,.dark textarea{color-scheme:dark}
        .a4-document{width:210mm;min-height:297mm;background:#fff;margin:0 auto}
        @page{size:A4 portrait;margin:0}
        @media print{html,body{width:210mm;background:#fff!important}.a4-document{width:210mm;min-height:297mm;box-shadow:none!important}.print-page-break{break-before:page;page-break-before:always}.avoid-page-break{break-inside:avoid;page-break-inside:avoid}}
        @media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>
      <div className="min-h-screen bg-[#eef3f8] dark:bg-[#040b14] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
        
        {/* Header */}
        <header className="bg-white/95 dark:bg-[#07111e]/95 backdrop-blur-xl border-b border-gray-200 dark:border-blue-400/15 shadow-sm dark:shadow-[0_10px_35px_rgba(0,0,0,.28)] sticky top-0 z-30 transition-colors duration-300 print:hidden">
          <div className="flex items-center justify-between px-4 h-16 gap-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"><Menu size={24} /></button>
              
              {/* --- โลโก้แอปที่อัปโหลดได้ --- */}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer relative group flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-lg shadow-sm overflow-hidden border border-blue-500">
                  {appLogo ? (
                    <img src={appLogo} className="w-full h-full object-cover bg-white" alt="App Logo" />
                  ) : (
                    <Calculator size={20} />
                  )}
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><Camera size={16}/></div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAppLogoUpload}/>
                </label>
                <span className="font-bold text-lg text-blue-700 dark:text-blue-400 hidden sm:block">WPT ระบบต้นทุนรั้ว</span>
              </div>

            </div>
            <div className="flex-1 max-w-xl px-2 flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium text-sm hidden sm:block whitespace-nowrap">โครงการ:</span>
              <input type="text" placeholder="ระบุชื่อโครงการ..." value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 rounded-lg px-4 py-2 text-sm font-medium outline-none dark:text-white transition-colors" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:block">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
              
              {activeTab === 'dashboard' && (
                <button onClick={() => setIsSaveModalOpen(true)} className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-lg text-sm font-medium border border-yellow-200 dark:border-yellow-800"><Save size={18} /> <span className="hidden sm:block">บันทึก</span></button>
              )}
              
              <button onClick={() => setIsPreviewModalOpen(true)} className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-slate-600"><FileText size={18} /> <span className="hidden sm:block">พิมพ์เอกสาร</span></button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden print:overflow-visible">
          {/* Sidebar */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white dark:bg-[#06101d] border-r border-gray-200 dark:border-blue-400/15 shadow-lg lg:shadow-none transform transition-transform duration-300 flex flex-col print:hidden ${isSidebarOpen ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">เมนูหลัก</div>
              <nav className="space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-cyan-300 dark:border dark:border-blue-400/25 dark:shadow-[0_0_22px_rgba(37,99,235,.10)]' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-blue-500/[.06] dark:hover:text-slate-200 border border-transparent'}`}>
                      <Icon size={18} className={activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} /> {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 text-center flex flex-col gap-1 items-center">
              <div className="w-10 h-1 rounded-full bg-blue-100 dark:bg-slate-700 mb-1"></div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">Developed by</span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">X-wan</span>
            </div>
          </aside>
          {isSidebarOpen && <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-10 lg:hidden print:hidden" onClick={() => setIsSidebarOpen(false)} />}

          {/* Main Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32 w-full print:p-0 print:overflow-visible">
            <div className="max-w-[1240px] mx-auto print:max-w-none print:w-full">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'retaining' && renderStandardTable(retainingItems, setRetainingItems, "กำแพงกันดิน", "ความยาวช่วงเสา", spanLength, setSpanLength)}
              {activeTab === 'fence' && renderStandardTable(fenceItems, setFenceItems, "รั้วคอนกรีต", "ความยาวช่วงเสา", spanLength, setSpanLength)}
              {activeTab === 'beam' && renderConcreteTable(beamItems, setBeamItems, "คอนกรีตคาน", "ระยะคำนวณรวม", beamLength, setBeamLength)}
              {activeTab === 'stay' && renderConcreteTable(stayItems, setStayItems, "คอนกรีตสเตย์", "ระยะคำนวณรวม", stayLength, setStayLength)}
              {activeTab === 'labor' && renderLaborTable()}
              {activeTab === 'estimate' && renderEstimation()}
              {activeTab === 'quotation' && (quoteView === 'list' ? renderQuotationList() : renderQuotationForm())}
            </div>
          </main>
        </div>

        {/* Sticky Bottom Bar */}
        {(activeTab !== 'estimate' && activeTab !== 'quotation') && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#07111e]/95 backdrop-blur-xl border-t border-gray-200 dark:border-blue-400/15 shadow-[0_-10px_25px_rgba(0,0,0,.2)] z-20 lg:pl-64 transition-colors duration-300 print:hidden">
            <div className="max-w-[1240px] mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase">ยอดรวมสุทธิเฉพาะที่เลือก (ต่อเมตร)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-blue-700 dark:text-blue-400">
                  {totals.grandTotalPerMeter.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <span className="text-lg text-gray-500 font-medium">บาท</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* MODALS */}
        {/* ----------------------------------------------------- */}

        {/* Modal: ข้อมูลบริษัท (Company Settings) */}
        {isCompanyModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Building2 size={20} className="text-blue-600"/> ข้อมูลบริษัท (ผู้ออกเอกสาร)</h3>
                <button onClick={() => {setIsCompanyModalOpen(false); setEditingCompany(null);}} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {!editingCompany ? (
                  <>
                    <button onClick={() => setEditingCompany({ id: null, logo: '', name: '', address: '', taxId: '', phone: '' })} className="mb-4 flex items-center gap-2 bg-yellow-50 text-yellow-700 dark:bg-slate-700 dark:text-yellow-400 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 border border-yellow-200 w-full justify-center">
                      <Plus size={18}/> เพิ่มข้อมูลบริษัทใหม่
                    </button>
                    <div className="grid grid-cols-1 gap-3">
                      {companies.map(comp => (
                        <div key={comp.id} onClick={()=>setActiveCompanyId(comp.id)} className={`border rounded-xl p-4 flex gap-4 items-center cursor-pointer transition-all ${activeCompanyId===comp.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500':'border-gray-200 dark:border-slate-700 hover:border-blue-300 bg-white dark:bg-slate-800'}`}>
                           <img src={comp.logo || 'https://via.placeholder.com/150'} alt="logo" className="w-12 h-12 rounded object-cover border bg-white"/>
                           <div className="flex-1">
                             <div className="font-bold flex items-center gap-2 dark:text-white">{comp.name} {activeCompanyId===comp.id && <CheckCircle2 size={16} className="text-blue-600"/>}</div>
                             <div className="text-xs text-gray-500 line-clamp-1">{comp.address}</div>
                           </div>
                           <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
                             <button onClick={()=>setEditingCompany(comp)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                             <button onClick={()=>handleDeleteCompany(comp.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 border-b pb-4 dark:border-slate-700">
                      <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative group cursor-pointer">
                        {editingCompany.logo ? <img src={editingCompany.logo} className="w-full h-full object-contain bg-white" alt="logo"/> : <ImageIcon className="text-gray-400"/>}
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"><Camera size={24}/></div>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleCompanyLogoUpload}/>
                      </div>
                      <div className="text-sm text-gray-500">คลิกที่กรอบเพื่ออัปโหลดโลโก้บริษัท</div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อบริษัท <span className="text-red-500">*</span></label><input type="text" value={editingCompany.name} onChange={e=>setEditingCompany({...editingCompany, name:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ที่อยู่</label><textarea rows="2" value={editingCompany.address} onChange={e=>setEditingCompany({...editingCompany, address:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">เลขประจำตัวผู้เสียภาษี</label><input type="text" value={editingCompany.taxId} onChange={e=>setEditingCompany({...editingCompany, taxId:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">เบอร์โทรศัพท์</label><input type="text" value={editingCompany.phone} onChange={e=>setEditingCompany({...editingCompany, phone:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <button onClick={()=>setEditingCompany(null)} className="px-4 py-2 border rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700">ยกเลิก</button>
                      <button onClick={handleSaveCompany} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">บันทึกข้อมูล</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: ข้อมูลลูกค้า (Customer Info) */}
        {isCustomerInfoModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><User size={20} className="text-blue-600"/> ข้อมูลลูกค้า</h3>
                <button onClick={() => setIsCustomerInfoModalOpen(false)} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อผู้ติดต่อ</label><input type="text" value={customerInfo.contactName} onChange={e=>setCustomerInfo({...customerInfo, contactName:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">เบอร์โทรผู้ติดต่อ</label><input type="text" value={customerInfo.contactPhone} onChange={e=>setCustomerInfo({...customerInfo, contactPhone:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อบริษัท (ถ้ามี)</label><input type="text" value={customerInfo.companyName} onChange={e=>setCustomerInfo({...customerInfo, companyName:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ที่อยู่บริษัทลูกค้า</label><textarea value={customerInfo.address} onChange={e=>setCustomerInfo({...customerInfo, address:e.target.value})} rows="2" className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none" /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">เลขผู้เสียภาษี (ลูกค้า)</label><input type="text" value={customerInfo.taxId} onChange={e=>setCustomerInfo({...customerInfo, taxId:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <hr className="dark:border-slate-700 my-2" />
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">โปรเจค / งาน</label><input type="text" value={customerInfo.project} onChange={e=>setCustomerInfo({...customerInfo, project:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">รายละเอียดโปรเจค</label><input type="text" value={customerInfo.projectDetails} onChange={e=>setCustomerInfo({...customerInfo, projectDetails:e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">สถานที่หน้างาน / ที่จัดส่ง</label><textarea value={customerInfo.siteAddress} onChange={e=>setCustomerInfo({...customerInfo, siteAddress:e.target.value})} rows="2" className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none" /></div>
              </div>
              <div className="p-4 border-t dark:border-slate-700">
                <button onClick={() => setIsCustomerInfoModalOpen(false)} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">ตกลง</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: จัดการฐานข้อมูลสินค้า */}
        {isQuoteDbModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Settings size={20} className="text-blue-600"/> จัดการฐานข้อมูลสินค้า/บริการ</h3>
                <button onClick={() => setIsQuoteDbModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <button onClick={() => openDbForm()} className="mb-4 flex items-center gap-2 bg-yellow-500 text-slate-900 dark:bg-yellow-600 dark:text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 dark:hover:bg-yellow-500 shadow-sm">
                  <Plus size={18}/> เพิ่มรายการใหม่
                </button>
                <div className="overflow-x-auto border rounded-lg dark:border-slate-700">
                  <table className="w-full text-sm text-left dark:text-gray-200">
                    <thead className="bg-gray-100 dark:bg-slate-900/50 border-b dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 w-16 text-center">รูปภาพ</th>
                        <th className="px-4 py-3">รหัส</th>
                        <th className="px-4 py-3">ชื่อรายการ</th>
                        <th className="px-4 py-3 text-center">ประเภท</th>
                        <th className="px-4 py-3 text-right">ราคา</th>
                        <th className="px-4 py-3 text-center w-24">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteDatabase.length > 0 ? quoteDatabase.map(item => (
                        <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-2 text-center">
                            {item.image ? <img src={item.image} className="w-10 h-10 object-cover rounded border bg-white mx-auto" alt="item" /> : <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded border border-dashed flex items-center justify-center mx-auto text-gray-400"><ImageIcon size={16}/></div>}
                          </td>
                          <td className="px-4 py-2 font-medium">{item.code}</td>
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2 text-center text-xs"><span className={`px-2 py-1 rounded-full ${item.type==='product'?'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300':'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{item.type==='product'?'สินค้า':'บริการ'}</span></td>
                          <td className="px-4 py-2 text-right">{item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => openDbForm(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteDbItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="6" className="text-center py-6 text-gray-500">ไม่มีข้อมูลในระบบ</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: ฟอร์มเพิ่ม/แก้ไข ฐานข้อมูลสินค้า */}
        {isQuoteFormModalOpen && (
          <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">{dbFormData.id ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h3>
                <button onClick={() => setIsQuoteFormModalOpen(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* Image Upload Input */}
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-900/50 flex items-center justify-center relative group cursor-pointer">
                    {dbFormData.image ? <img src={dbFormData.image} className="w-full h-full object-cover bg-white" alt="product"/> : <div className="text-gray-400 flex flex-col items-center"><ImageIcon size={32}/><span className="text-xs mt-2">เพิ่มรูปภาพ</span></div>}
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"><Camera size={24}/></div>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleDbImageUpload}/>
                  </div>
                  {dbFormData.image && <button onClick={()=>setDbFormData({...dbFormData, image: ''})} className="text-xs text-red-500 hover:underline">ลบรูปภาพ</button>}
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer dark:text-white"><input type="radio" name="type" checked={dbFormData.type === 'product'} onChange={() => setDbFormData({...dbFormData, type:'product'})}/> สินค้า</label>
                  <label className="flex items-center gap-2 cursor-pointer dark:text-white"><input type="radio" name="type" checked={dbFormData.type === 'service'} onChange={() => setDbFormData({...dbFormData, type:'service'})}/> บริการ</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">รหัสสินค้า</label><input type="text" value={dbFormData.code} onChange={e=>setDbFormData({...dbFormData, code: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อรายการ <span className="text-red-500">*</span></label><input type="text" value={dbFormData.name} onChange={e=>setDbFormData({...dbFormData, name: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">รายละเอียดสินค้า</label><textarea value={dbFormData.description} onChange={e=>setDbFormData({...dbFormData, description: e.target.value})} rows="2" className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">หน่วย</label><input type="text" placeholder="เช่น แผ่น, เมตร" value={dbFormData.unit} onChange={e=>setDbFormData({...dbFormData, unit: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ราคา/หน่วย <span className="text-red-500">*</span></label><input type="number" min="0" value={dbFormData.price} onChange={e=>setDbFormData({...dbFormData, price: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>
              <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-2 bg-gray-50 dark:bg-slate-900/50 rounded-b-xl">
                <button onClick={() => setIsQuoteFormModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700">ยกเลิก</button>
                <button onClick={handleSaveDbItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">บันทึก</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: แก้ไขสินค้ารายตัวเฉพาะในบิล (ไม่กระทบฐานข้อมูลหลัก) */}
        {quoteItemEditData && (
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Edit size={18} className="text-blue-600"/> แก้ไขรายละเอียดในบิล</h3>
                <button onClick={() => setQuoteItemEditData(null)} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อรายการ</label><input type="text" value={quoteItemEditData.name} onChange={e=>setQuoteItemEditData({...quoteItemEditData, name: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">รายละเอียดเพิ่มเติม</label><textarea value={quoteItemEditData.description} onChange={e=>setQuoteItemEditData({...quoteItemEditData, description: e.target.value})} rows="2" className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">ราคา/หน่วย</label><input type="number" min="0" value={quoteItemEditData.price} onChange={e=>setQuoteItemEditData({...quoteItemEditData, price: parseFloat(e.target.value)||0})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">หน่วย</label><input type="text" value={quoteItemEditData.unit} onChange={e=>setQuoteItemEditData({...quoteItemEditData, unit: e.target.value})} className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>
              <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-2">
                <button onClick={() => setQuoteItemEditData(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700">ยกเลิก</button>
                <button onClick={saveQuoteItemEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">ตกลง</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: เลือกรายการเข้าตารางใบเสนอราคา */}
        {isQuoteSelectorModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><ListPlus size={20} className="text-yellow-500"/> เลือกรายการเข้าใบเสนอราคา</h3>
                <button onClick={() => setIsQuoteSelectorModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {quoteDatabase.length > 0 ? quoteDatabase.map(item => (
                  <div key={item.id} onClick={() => addItemsToQuote(item)} className="border dark:border-slate-700 rounded-xl p-3 flex flex-col items-center text-center cursor-pointer hover:border-yellow-500 hover:shadow-md transition-all bg-white dark:bg-slate-700 group relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-400 text-black p-1 rounded-full"><Plus size={16}/></div>
                    
                    {/* Show Image in Selector */}
                    <div className="w-full h-24 mb-3 rounded border dark:border-slate-600 bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                       {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <ImageIcon size={24} className="text-gray-300"/>}
                    </div>

                    <div className="font-bold text-sm dark:text-white line-clamp-1 w-full" title={item.name}>{item.code} - {item.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2 w-full">{item.description || '-'}</div>
                    <div className="mt-auto pt-2 font-medium text-blue-600 dark:text-blue-400">{parseFloat(item.price).toLocaleString()} ฿ / {item.unit}</div>
                  </div>
                )) : <div className="col-span-full text-center py-10 text-gray-500">ไม่มีข้อมูลในฐานสินค้า (กรุณากดปุ่ม จัดการสินค้า)</div>}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Preview Before Print */}
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-t-xl p-4 flex justify-between items-center border-b dark:border-slate-700 shadow-md print:hidden">
               <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white"><FileText size={20} className="text-blue-600"/> ตัวอย่างก่อนพิมพ์</h3>
               <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            <div className="bg-gray-200 dark:bg-slate-900 w-full flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center print:bg-white print:p-0 print:overflow-visible print:block">
               <div ref={printRef} className={`bg-white w-full ${activeTab === 'quotation' ? 'w-[210mm] max-w-[210mm] min-h-[297mm] p-0' : 'max-w-[800px] p-6 sm:p-10'} shadow-lg rounded-sm text-slate-900 print:shadow-none print:max-w-none print:w-full`}>
                   
                   {activeTab !== 'quotation' ? (
                     <>
                       <div className="mb-8 pb-4 border-b-2 border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                          <div>
                            <h1 className="text-3xl font-bold text-slate-900">สรุปราคาประเมินงานรั้ว</h1>
                            <h2 className="text-lg text-slate-700 mt-1">โครงการ: <span className="font-semibold">{projectName || 'ไม่ได้ระบุ'}</span></h2>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-blue-700 flex items-center sm:justify-end gap-2">
                              {getActiveCompany().name}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">หมวดหมู่: {TABS.find(t => t.id === activeTab)?.label}</p>
                            <p className="text-sm text-slate-500">วันที่: {new Date().toLocaleDateString('th-TH')}</p>
                          </div>
                       </div>
                       
                       {activeTab === 'dashboard' && renderDashboard(true)}
                       {activeTab === 'retaining' && renderStandardTable(retainingItems, setRetainingItems, "กำแพงกันดิน", "ความยาวช่วงเสา", spanLength, setSpanLength, true)}
                       {activeTab === 'fence' && renderStandardTable(fenceItems, setFenceItems, "รั้วคอนกรีต", "ความยาวช่วงเสา", spanLength, setSpanLength, true)}
                       {activeTab === 'beam' && renderConcreteTable(beamItems, setBeamItems, "คอนกรีตคาน", "ระยะคำนวณรวม", beamLength, setBeamLength, true)}
                       {activeTab === 'stay' && renderConcreteTable(stayItems, setStayItems, "คอนกรีตสเตย์", "ระยะคำนวณรวม", stayLength, setStayLength, true)}
                       {activeTab === 'labor' && renderLaborTable(true)}
                       {activeTab === 'estimate' && renderEstimation(true)}
                       
                       <div className="mt-16 pt-4 border-t border-gray-200 text-right text-xs text-gray-400">
                         Generated by WPT Application | Developed by X-wan
                       </div>
                     </>
                   ) : (
                     renderQuotationPrint()
                   )}
               </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl p-4 rounded-b-xl flex flex-wrap justify-end gap-3 border-t dark:border-slate-700 print:hidden">
               {/* ปุ่มบันทึกเป็นรูปภาพ */}
               <button onClick={handleDownloadImage} disabled={isExporting} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                 {isExporting ? <span className="animate-pulse">กำลังประมวลผล...</span> : <><ImageDown size={18}/> บันทึกรูปภาพ</>}
               </button>
               
               <button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                 {isExporting ? <span className="animate-pulse">กำลังสร้าง...</span> : <><Download size={18}/> โหลด PDF</>}
               </button>
               
               <button onClick={handleActualPrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                 <Printer size={18}/> พิมพ์เอกสาร
               </button>
            </div>
          </div>
        )}

        {/* Modal: แจ้งเตือนบันทึกใบเสนอราคาสำเร็จ */}
        {isQuoteSaveModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[250] animate-in fade-in p-4 print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-8 flex flex-col items-center text-center">
               <CheckCircle2 size={64} className="text-green-500 mb-4 animate-bounce" />
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">บันทึกเอกสารสำเร็จ!</h3>
               <p className="text-sm text-gray-500">กำลังกลับสู่หน้ารายการ...</p>
            </div>
          </div>
        )}

        {/* Modal: บันทึกหน้าประมาณราคา */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] animate-in fade-in p-4 print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              {saveStatus === 'success' ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <CheckCircle2 size={64} className="text-green-500 mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">บันทึกแล้ว!</h3>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Save size={20} className="text-blue-600"/> บันทึกประมาณราคา</h3>
                  <div className="mb-6">
                    <input type="text" autoFocus placeholder="เช่น บ้านลูกค้า A..." value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-sm outline-none bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-2.5 rounded-lg border font-medium hover:bg-gray-50 dark:text-white">ยกเลิก</button>
                    <button onClick={handleSaveEstimate} disabled={!saveNameInput.trim()} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 hover:bg-blue-700">บันทึก</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: แจ้งเตือน/ยืนยันทั่วไป (Custom Alert/Confirm) */}
        {dialogConfig.isOpen && (
          <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <h3 className={`text-lg font-bold mb-2 ${dialogConfig.type === 'confirm' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {dialogConfig.type === 'confirm' ? 'ยืนยันการดำเนินการ' : 'แจ้งเตือน'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">{dialogConfig.message}</p>
                <div className="flex gap-3 justify-center">
                  {dialogConfig.type === 'confirm' && (
                    <button onClick={closeDialog} className="flex-1 px-4 py-2 rounded-lg border dark:border-slate-600 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white transition-colors">ยกเลิก</button>
                  )}
                  <button onClick={() => { if(dialogConfig.onConfirm) dialogConfig.onConfirm(); closeDialog(); }} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">ตกลง</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


