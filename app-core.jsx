// ═══════════════════════════════════════
// App Core (state + functions)
// ═══════════════════════════════════════
function App() {
  const [authToken, setAuthToken] = useState("cookie"); // [FIX #7] Cookie-only auth, no localStorage
  const [currentUser, setCurrentUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  const [page, setPage] = useState("dashboard");
  const [users, setUsersLocal] = useState([]);
  const [orders, setOrdersLocal] = useState([]);
  const [workOrders, setWorkOrdersLocal] = useState([]);
  const [productionJobs, setProductionJobsLocal] = useState([]);
  const [machines, setMachinesLocal] = useState([]);
  const [operators, setOperatorsLocal] = useState([]);
  const [barStock, setBarStockLocal] = useState([]);
  const [preCutStock, setPreCutStockLocal] = useState([]);
  const stockUIRef = React.useRef({tab:"bars",openGrades:{},filterDia:"",manualOpen:false,manualGrade:"",manualDia:"",manualLength:"",manualQty:"",manualRemnantKey:""});

  const [materialCodes, setMaterialCodesLocal] = useState(DEFAULT_MATERIAL_CODES);
  const [coatingQueue, setCoatingQueueLocal] = useState([]);
  const [grindingQueue, setGrindingQueueLocal] = useState([]);
  const [purchaseRequests, setPurchaseRequestsLocal] = useState([]);
  const [invoices, setInvoicesLocal] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(() => {
    try {
      const s = localStorage.getItem("mihenkCompany");
      const parsed = s ? JSON.parse(s) : {};
      const base = { ...DEFAULT_COMPANY, ...(parsed || {}) };
      delete base.parasutClientId;
      delete base.parasutClientSecret;
      delete base.parasutCompanyId;
      return base;
    } catch (e) {
      return { ...DEFAULT_COMPANY };
    }
  });
  useEffect(() => {
    try { localStorage.setItem("mihenkCompany", JSON.stringify(companyInfo)); } catch(e){}
  }, [companyInfo]);
  const [userPerms, setUserPermsLocal] = useState({});
  const [modal, setModal] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState(() => localStorage.getItem("mihenkTheme") || "dark");
  const toggleTheme = useCallback(() => {
    setTheme(prev => { const next = prev === "dark" ? "light" : "dark"; localStorage.setItem("mihenkTheme", next); return next; });
  }, []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const [pdfViewer, setPdfViewer] = useState(null);
  const [woDetail, setWoDetail] = useState(null);
  const [expandedQc, setExpandedQc] = useState({});
  const [notifications, setNotifications] = useState(() => {
    try { const s=localStorage.getItem("mihenkNotifs"); return s?JSON.parse(s):[]; } catch(e){ return []; }
  });
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Persist notifications
  useEffect(() => { try { localStorage.setItem("mihenkNotifs", JSON.stringify(notifications.slice(0,50))); } catch(e){} }, [notifications]);

  const addNotification = useCallback((type, title, detail, targetRoles, targetPage) => {
    // Only show if current user's role matches target
    if(targetRoles && targetRoles.length>0 && !targetRoles.includes(currentUser?.role) && !targetRoles.includes("all")) return;
    const n = { id: genId(), ts: new Date().toISOString(), type, title, detail, read: false, targetPage: targetPage||null };
    setNotifications(prev => [n, ...prev].slice(0, 50));
    // Broadcast to other connected users
    if(socketRef.current?.connected){
      socketRef.current.emit("notification:broadcast", { ...n, targetRoles, fromUser: currentUser?.name });
    }
  }, [currentUser?.role, currentUser?.name]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  const navigateNotif = (n) => { markRead(n.id); if(n.targetPage) setPage(n.targetPage); setShowNotifPanel(false); };
  const markAllRead = () => setNotifications(prev => prev.map(n => ({...n, read: true})));
  const clearNotifications = () => setNotifications([]);

  // ── Synced setters: update local + emit to server ──
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data);
  }, []);

  // Server'dan taze state çek — kritik işlemler sonrası tutarsızlık önler
  const forceSync = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("state:request");
    }
  }, []);

  // ═══════════════════════════════════════════
  // [PHASE 2] DELTA HELPERS
  // Tek kayıt için granüler operasyonlar.
  // Race condition önler, ağ trafiğini azaltır.
  // Eski setXxx wrapper'larla birlikte kullanılabilir.
  // ═══════════════════════════════════════════
  const deltaCreate = useCallback((collection, item) => {
    emit(`${collection}:create`, item);
  }, [emit]);

  const deltaUpdate = useCallback((collection, id, changes) => {
    emit(`${collection}:update`, { id, changes });
  }, [emit]);

  const deltaDelete = useCallback((collection, id) => {
    emit(`${collection}:delete`, id);
  }, [emit]);

  const shallowDiff = useCallback((prevItem, nextItem) => {
    const keys = new Set([...(Object.keys(prevItem || {})), ...(Object.keys(nextItem || {}))]);
    const changes = {};
    keys.forEach((key) => {
      if (key === "id") return;
      const before = prevItem ? prevItem[key] : undefined;
      const after = nextItem ? nextItem[key] : undefined;
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes[key] = after;
      }
    });
    return changes;
  }, []);

  const syncCollectionByDelta = useCallback((collection, prev, next) => {
    if (!Array.isArray(prev) || !Array.isArray(next)) return;

    const prevMap = new Map(prev.filter(x => x && typeof x.id === "string").map(x => [x.id, x]));
    const nextMap = new Map(next.filter(x => x && typeof x.id === "string").map(x => [x.id, x]));

    next.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = typeof item.id === "string" ? item.id : "";
      if (!id) return;

      const before = prevMap.get(id);
      if (!before) {
        deltaCreate(collection, item);
        return;
      }

      const changes = shallowDiff(before, item);
      if (Object.keys(changes).length > 0) {
        deltaUpdate(collection, id, changes);
      }
    });

    prev.forEach((item) => {
      const id = item && typeof item.id === "string" ? item.id : "";
      if (id && !nextMap.has(id)) {
        deltaDelete(collection, id);
      }
    });
  }, [deltaCreate, deltaDelete, deltaUpdate, shallowDiff]);

  // Koleksiyon bazlı kısayollar — pages'in mevcut setXxx çağrısını
  // bozmaması için eski API korunuyor, yeni deltaXxx API ekleniyor.
  const updateOrder = useCallback((id, changes) => {
    setOrdersLocal(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
    deltaUpdate("orders", id, changes);
  }, [deltaUpdate]);

  const createOrder = useCallback((item) => {
    if (socketRef.current?.connected) {
      deltaCreate("orders", item);
      return;
    }

    setOrdersLocal(prev => {
      const year = new Date().getFullYear();
      const max = prev.reduce((m, o) => {
        const mm = String((o && o.id) || "").match(/^SIP-(\d{4})-(\d+)$/);
        if (!mm) return m;
        if (Number(mm[1]) !== year) return m;
        return Math.max(m, Number(mm[2]) || 0);
      }, 0);
      const fallbackId = (typeof item?.id === "string" && item.id.trim())
        ? item.id.trim()
        : `SIP-${year}-${String(max + 1).padStart(3, "0")}`;
      return [...prev, { ...item, id: fallbackId }];
    });
  }, [deltaCreate]);

  const deltaDeleteOrder = useCallback((id) => {
    setOrdersLocal(prev => prev.filter(o => o.id !== id));
    deltaDelete("orders", id);
  }, [deltaDelete]);

  const updateWorkOrder = useCallback((id, changes) => {
    setWorkOrdersLocal(prev => prev.map(wo => wo.id === id ? { ...wo, ...changes } : wo));
    deltaUpdate("workOrders", id, changes);
  }, [deltaUpdate]);

  const createWorkOrder = useCallback((item) => {
    setWorkOrdersLocal(prev => [...prev, item]);
    deltaCreate("workOrders", item);
  }, [deltaCreate]);

  const deltaDeleteWorkOrder = useCallback((id) => {
    setWorkOrdersLocal(prev => prev.filter(wo => wo.id !== id));
    deltaDelete("workOrders", id);
  }, [deltaDelete]);

  const updateProductionJob = useCallback((id, changes) => {
    setProductionJobsLocal(prev => prev.map(j => j.id === id ? { ...j, ...changes } : j));
    deltaUpdate("productionJobs", id, changes);
  }, [deltaUpdate]);

  const createProductionJob = useCallback((item) => {
    setProductionJobsLocal(prev => [...prev, item]);
    deltaCreate("productionJobs", item);
  }, [deltaCreate]);

  const deleteProductionJob = useCallback((id) => {
    setProductionJobsLocal(prev => prev.filter(j => j.id !== id));
    deltaDelete("productionJobs", id);
  }, [deltaDelete]);

  const updateBarStockItem = useCallback((id, changes) => {
    setBarStockLocal(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
    deltaUpdate("barStock", id, changes);
  }, [deltaUpdate]);

  const createBarStockItem = useCallback((item) => {
    setBarStockLocal(prev => [...prev, item]);
    deltaCreate("barStock", item);
  }, [deltaCreate]);

  const updatePreCutStockItem = useCallback((id, changes) => {
    setPreCutStockLocal(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
    deltaUpdate("preCutStock", id, changes);
  }, [deltaUpdate]);

  const createPreCutStockItem = useCallback((item) => {
    const newItem = { ...item, id: item.id || genId() };
    setPreCutStockLocal(prev => [...prev, newItem]);
    deltaCreate("preCutStock", newItem);
  }, [deltaCreate]);

  const updateMaterialCode = useCallback((id, changes) => {
    setMaterialCodesLocal(prev => { const n = prev.map(m => m.id===id ? {...m,...changes} : m); MATERIAL_CODES = n; return n; });
    deltaUpdate("materialCodes", id, changes);
  }, [deltaUpdate]);

  const createMaterialCode = useCallback((item) => {
    const newItem = { ...item, id: item.id || genId() };
    setMaterialCodesLocal(prev => { const n = [...prev, newItem]; MATERIAL_CODES = n; return n; });
    deltaCreate("materialCodes", newItem);
  }, [deltaCreate]);

  const deleteMaterialCode = useCallback((id) => {
    setMaterialCodesLocal(prev => { const n = prev.filter(m => m.id !== id); MATERIAL_CODES = n; return n; });
    deltaDelete("materialCodes", id);
  }, [deltaDelete]);

  const updatePurchaseRequest = useCallback((id, changes) => {
    setPurchaseRequestsLocal(prev => prev.map(pr => pr.id === id ? { ...pr, ...changes } : pr));
    deltaUpdate("purchaseRequests", id, changes);
  }, [deltaUpdate]);

  const createPurchaseRequest = useCallback((item) => {
    setPurchaseRequestsLocal(prev => [...prev, item]);
    deltaCreate("purchaseRequests", item);
  }, [deltaCreate]);

  const updateCoatingQueueItem = useCallback((id, changes) => {
    setCoatingQueueLocal(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
    deltaUpdate("coatingQueue", id, changes);
  }, [deltaUpdate]);

  const createCoatingQueueItem = useCallback((item) => {
    setCoatingQueueLocal(prev => [...prev, item]);
    deltaCreate("coatingQueue", item);
  }, [deltaCreate]);

  const deltaUpdateInvoice = useCallback((id, changes) => {
    setInvoicesLocal(prev => prev.map(inv => inv.id === id ? { ...inv, ...changes } : inv));
    deltaUpdate("invoices", id, changes);
  }, [deltaUpdate]);

  const deltaCreateInvoice = useCallback((item) => {
    setInvoicesLocal(prev => [...prev, item]);
    deltaCreate("invoices", item);
  }, [deltaCreate]);

  const deltaDeleteInvoice = useCallback((id) => {
    setInvoicesLocal(prev => prev.filter(inv => inv.id !== id));
    deltaDelete("invoices", id);
  }, [deltaDelete]);

  const setOrders = useCallback((updater) => {
    setOrdersLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("orders", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setWorkOrders = useCallback((updater) => {
    setWorkOrdersLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("workOrders", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setProductionJobs = useCallback((updater) => {
    setProductionJobsLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("productionJobs", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setMachines = useCallback((updater) => {
    setMachinesLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("machines", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setOperators = useCallback((updater) => {
    setOperatorsLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("operators", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setBarStock = useCallback((updater) => {
    setBarStockLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("barStock", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setCoatingQueue = useCallback((updater) => {
    setCoatingQueueLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("coatingQueue", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setGrindingQueue = useCallback((updater) => {
    setGrindingQueueLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("grindingQueue", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setPurchaseRequests = useCallback((updater) => {
    setPurchaseRequestsLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("purchaseRequests", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setInvoices = useCallback((updater) => {
    setInvoicesLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncCollectionByDelta("invoices", prev, next);
      return next;
    });
  }, [syncCollectionByDelta]);
  const setUsers = useCallback((updater) => {
    setUsersLocal(prev => { const next = typeof updater === "function" ? updater(prev) : updater; emit("users:set", next); return next; });
  }, [emit]);
  const setUserPerms = useCallback((updater) => {
    setUserPermsLocal(prev => { const next = typeof updater === "function" ? updater(prev) : updater; emit("userPerms:set", next); return next; });
  }, [emit]);

  // ── Invoice helpers ──
  const generateInvoiceNumber = useCallback(() => {
    const prefix = companyInfo.invoicePrefix || "MHK";
    const year = new Date().getFullYear();
    const existing = invoices.filter(inv => inv.id && inv.id.startsWith(prefix + "-" + year));
    const maxNum = existing.reduce((max, inv) => {
      const parts = inv.id.split("-");
      const num = parseInt(parts[parts.length - 1]) || 0;
      return num > max ? num : max;
    }, 0);
    return prefix + "-" + year + "-" + String(maxNum + 1).padStart(4, "0");
  }, [invoices, companyInfo]);

  const generateIrsaliyeNumber = useCallback(() => {
    const prefix = (companyInfo.invoicePrefix || "MHK") + "-IRS";
    const year = new Date().getFullYear();
    const allNos = invoices.map(inv => inv.irsaliyeNo).filter(n => n && n.startsWith(prefix + "-" + year));
    const maxNum = allNos.reduce((max, no) => {
      const parts = no.split("-");
      const num = parseInt(parts[parts.length - 1]) || 0;
      return num > max ? num : max;
    }, 0);
    return prefix + "-" + year + "-" + String(maxNum + 1).padStart(4, "0");
  }, [invoices, companyInfo]);

  const createInvoice = useCallback((orderData, items, opts = {}) => {
    const inv = {
      id: generateInvoiceNumber(),
      orderId: orderData.id || "",
      woId: opts.woId || "",
      customerName: orderData.customer || "",
      customerCode: orderData.customerCode || "",
      taxId: opts.taxId || "",
      taxOffice: opts.taxOffice || "",
      customerAddress: opts.customerAddress || "",
      items: items.map(it => {
        const vatRate = it.vatRate != null ? it.vatRate : (companyInfo.defaultVatRate || 20);
        const lineNet = (it.qty || 0) * (it.unitPrice || 0);
        const vatAmount = lineNet * vatRate / 100;
        return { ...it, vatRate, vatAmount: Math.round(vatAmount * 100) / 100, lineTotal: Math.round((lineNet + vatAmount) * 100) / 100, lineNet: Math.round(lineNet * 100) / 100 };
      }),
      currency: orderData.currency || "EUR",
      irsaliyeNo: opts.irsaliyeNo || "",
      irsaliyeDate: opts.irsaliyeDate || "",
      dueDate: opts.dueDate || "",
      bankInfo: opts.bankInfo || companyInfo.bankName ? { bankName: companyInfo.bankName, iban: companyInfo.iban, branch: companyInfo.bankBranch } : null,
      paymentTerms: opts.paymentTerms || "",
      status: "draft",
      parasutId: null,
      createdAt: new Date().toISOString(),
      sentAt: null, paidAt: null, cancelledAt: null,
      notes: opts.notes || "",
    };
    inv.subtotal = inv.items.reduce((s, it) => s + (it.lineNet || 0), 0);
    inv.totalVat = inv.items.reduce((s, it) => s + (it.vatAmount || 0), 0);
    inv.grandTotal = Math.round((inv.subtotal + inv.totalVat) * 100) / 100;
    inv.subtotal = Math.round(inv.subtotal * 100) / 100;
    inv.totalVat = Math.round(inv.totalVat * 100) / 100;
    setInvoices(prev => [...prev, inv]);
    addNotification("success", "Fatura Oluşturuldu", inv.id + " - " + inv.customerName, ["admin","manager"], "invoices");
    return inv;
  }, [generateInvoiceNumber, setInvoices, companyInfo, addNotification]);

  const updateInvoiceStatus = useCallback((invoiceId, status, extra = {}) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const upd = { ...inv, status, ...extra };
      if (status === "sent") upd.sentAt = new Date().toISOString();
      if (status === "paid") upd.paidAt = new Date().toISOString();
      if (status === "cancelled") upd.cancelledAt = new Date().toISOString();
      return upd;
    }));
  }, [setInvoices]);

  // Paraşüt API helper
  const parasutAPI = useCallback(async (method, path, body) => {
    let tokenData = null;
    try {
      const stored = sessionStorage.getItem("parasutToken");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at > Date.now() && parsed.access_token && parsed.company_id) tokenData = parsed;
      }
    } catch(e) {}

    if (!tokenData) {
      const tokenResp = await fetch("/api/parasut/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const td = await tokenResp.json();
      if (!tokenResp.ok || td.error || !td.access_token || !td.company_id) {
        throw new Error("Paraşüt token hatası: " + (td.error_description || td.error || "Yapılandırma eksik"));
      }
      tokenData = { ...td, expires_at: Date.now() + (td.expires_in || 7200) * 1000 };
      sessionStorage.setItem("parasutToken", JSON.stringify(tokenData));
    }

    const resp = await fetch("/api/parasut/v4/" + tokenData.company_id + "/" + path, {
      method,
      headers: { "Content-Type": "application/json", "X-Parasut-Token": tokenData.access_token },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error("Paraşüt API hatası: " + JSON.stringify(data.errors || data));
    return data;
  }, []);

  const sendToParasut = useCallback(async (invoice) => {
    // Build Paraşüt sales invoice payload (JSON:API format)
    const payload = {
      data: {
        type: "sales_invoices",
        attributes: {
          item_type: "invoice",
          description: invoice.notes || ("Fatura " + invoice.id),
          issue_date: invoice.createdAt.split("T")[0],
          due_date: invoice.dueDate || invoice.createdAt.split("T")[0],
          invoice_series: (companyInfo.invoicePrefix || "MHK"),
          invoice_id: invoice.id,
          currency: invoice.currency === "TRY" ? "TRL" : invoice.currency,
        },
        relationships: {
          details: {
            data: invoice.items.map((it, i) => ({ type: "sales_invoice_details", attributes: {
              quantity: it.qty, unit_price: it.unitPrice, vat_rate: it.vatRate,
              description: it.name,
            }, temp_id: "detail_" + i })),
          },
          contact: { data: { type: "contacts", id: invoice.parasutContactId || undefined } },
        },
      },
    };
    const result = await parasutAPI("POST", "sales_invoices", payload);
    const parasutId = result.data?.id;
    if (parasutId) {
      updateInvoiceStatus(invoice.id, "sent", { parasutId });
      addNotification("success", "Fatura Gönderildi", invoice.id + " Paraşüt'e gönderildi (ID: " + parasutId + ")", ["admin","manager"], "invoices");
    }
    return result;
  }, [parasutAPI, updateInvoiceStatus, companyInfo, addNotification]);

  // ── Socket connection ──
  useEffect(() => {
    if (!authToken) { setCurrentUser(null); setStateLoaded(false); return; }

    // Standalone/offline mode — no server needed
    if (authToken.startsWith("offline-")) {
      setMachinesLocal(MACHINES_SEED);
      setOperatorsLocal(OPERATORS_SEED);
      setBarStockLocal(BAR_STOCK_SEED);
      setUsersLocal(USERS_SEED);
      setStateLoaded(true);
      return;
    }

    const socket = io({ withCredentials: true }); // [FIX #7] Cookie-based auth
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✓ Sunucuya bağlandı");
      setSocketConnected(true);
      socket.emit("state:request");
    });

    socket.on("connect_error", (err) => {
      console.error("Bağlantı hatası:", err.message);
      setSocketConnected(false);
      if (err.message === "Yetkisiz") {
        setAuthToken(null); setCurrentUser(null);
      }
    });

    socket.on("state:init", (state) => {
      setUsersLocal(state.users || []);
      setOrdersLocal(state.orders || []);
      setWorkOrdersLocal(state.workOrders || []);
      setProductionJobsLocal(state.productionJobs || []);
      setMachinesLocal(state.machines || []);
      setOperatorsLocal(state.operators || []);
      setBarStockLocal(state.barStock || []);
      setPreCutStockLocal(state.preCutStock || []);
      if (state.materialCodes?.length) { setMaterialCodesLocal(state.materialCodes); MATERIAL_CODES = state.materialCodes; }
      setCoatingQueueLocal(state.coatingQueue || []);
      setGrindingQueueLocal(state.grindingQueue || []);
      setPurchaseRequestsLocal(state.purchaseRequests || []);
      setInvoicesLocal(state.invoices || []);
      setUserPermsLocal(state.userPerms || {});
      setStateLoaded(true);
    });

    // ── Listen for updates from other clients ──
    socket.on("orders:updated", d => setOrdersLocal(d));
    socket.on("workOrders:updated", d => setWorkOrdersLocal(d));
    socket.on("productionJobs:updated", d => setProductionJobsLocal(d));
    socket.on("machines:updated", d => setMachinesLocal(d));
    socket.on("operators:updated", d => setOperatorsLocal(d));
    socket.on("barStock:updated", d => setBarStockLocal(d));
    socket.on("preCutStock:updated", d => setPreCutStockLocal(d));
    socket.on("materialCodes:updated", d => { setMaterialCodesLocal(d); MATERIAL_CODES = d; });
    socket.on("coatingQueue:updated", d => setCoatingQueueLocal(d));
    socket.on("grindingQueue:updated", d => setGrindingQueueLocal(d));
    socket.on("purchaseRequests:updated", d => setPurchaseRequestsLocal(d));
    socket.on("invoices:updated", d => setInvoicesLocal(d));
    socket.on("users:updated", d => setUsersLocal(d));
    socket.on("userPerms:updated", d => setUserPermsLocal(d));
    socket.on("users:online", d => setOnlineUsers(d));

    // [PHASE 2] Delta incoming — diğer client'lardan gelen granüler güncellemeler
    // :created — yeni kayıt (duplicate guard ile)
    socket.on("orders:created",          item => setOrdersLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("workOrders:created",      item => setWorkOrdersLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("productionJobs:created",  item => setProductionJobsLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("barStock:created",        item => setBarStockLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("preCutStock:created",     item => setPreCutStockLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("materialCodes:created",   item => { setMaterialCodesLocal(p => { const n = p.find(x=>x.id===item.id) ? p : [...p, item]; MATERIAL_CODES = n; return n; }); });
    socket.on("coatingQueue:created",    item => setCoatingQueueLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("grindingQueue:created",   item => setGrindingQueueLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("purchaseRequests:created",item => setPurchaseRequestsLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    socket.on("invoices:created",        item => setInvoicesLocal(p => p.find(x=>x.id===item.id) ? p : [...p, item]));
    // :patched — sadece değişen alanlar
    socket.on("orders:patched",          ({id,changes}) => setOrdersLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("workOrders:patched",      ({id,changes}) => setWorkOrdersLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("productionJobs:patched",  ({id,changes}) => setProductionJobsLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("barStock:patched",        ({id,changes}) => setBarStockLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("preCutStock:patched",     ({id,changes}) => setPreCutStockLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("materialCodes:patched",   ({id,changes}) => { setMaterialCodesLocal(p => { const n = p.map(x => x.id===id ? {...x,...changes} : x); MATERIAL_CODES = n; return n; }); });
    socket.on("coatingQueue:patched",    ({id,changes}) => setCoatingQueueLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("grindingQueue:patched",   ({id,changes}) => setGrindingQueueLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("purchaseRequests:patched",({id,changes}) => setPurchaseRequestsLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    socket.on("invoices:patched",        ({id,changes}) => setInvoicesLocal(p => p.map(x => x.id===id ? {...x,...changes} : x)));
    // :deleted — kaydı kaldır
    socket.on("orders:deleted",          id => setOrdersLocal(p => p.filter(x => x.id !== id)));
    socket.on("workOrders:deleted",      id => setWorkOrdersLocal(p => p.filter(x => x.id !== id)));
    socket.on("productionJobs:deleted",  id => setProductionJobsLocal(p => p.filter(x => x.id !== id)));
    socket.on("barStock:deleted",        id => setBarStockLocal(p => p.filter(x => x.id !== id)));
    socket.on("preCutStock:deleted",     id => setPreCutStockLocal(p => p.filter(x => x.id !== id)));
    socket.on("materialCodes:deleted",   id => { setMaterialCodesLocal(p => { const n = p.filter(x => x.id !== id); MATERIAL_CODES = n; return n; }); });
    socket.on("coatingQueue:deleted",    id => setCoatingQueueLocal(p => p.filter(x => x.id !== id)));
    socket.on("grindingQueue:deleted",   id => setGrindingQueueLocal(p => p.filter(x => x.id !== id)));
    socket.on("purchaseRequests:deleted",id => setPurchaseRequestsLocal(p => p.filter(x => x.id !== id)));
    socket.on("invoices:deleted",        id => setInvoicesLocal(p => p.filter(x => x.id !== id)));

    socket.on("notification:broadcast", n => {
      const roles = Array.isArray(n?.targetRoles) ? n.targetRoles : [];
      const blockedByRole = roles.length > 0 && !roles.includes("all") && !roles.includes(currentUser?.role);
      if (blockedByRole) return;
      if(n.fromUser !== currentUser?.name){
        setNotifications(prev => [{
          id: genId(),
          ts: n.ts || new Date().toISOString(),
          type: n.type || "info",
          title: n.title || n.message || "Bildirim",
          detail: n.detail || "",
          targetPage: n.targetPage || null,
          read: false,
          fromUser: n.fromUser || "",
        }, ...prev].slice(0, 50));
      }
    });

    socket.on("disconnect", () => { setSocketConnected(false); });

    return () => { socket.disconnect(); socketRef.current = null; setSocketConnected(false); };
  }, [authToken, currentUser?.name, currentUser?.role]);

  // ── Fetch current user on token change ──
  // [FIX #7] Cookie-based auth — check session on load
  useEffect(() => {
    if (!authToken) return;
    if (authToken.startsWith("offline-")) {
      const uid = authToken.replace("offline-", "");
      const u = USERS_SEED.find(u => u.id === uid);
      if (u) setCurrentUser({ id: u.id, name: u.name, username: u.username, role: u.role, avatar: u.avatar });
      else { setAuthToken(null); }
      return;
    }
    fetch("/api/me", { credentials: "same-origin" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setCurrentUser(d.user))
      .catch(() => { setAuthToken(null); });
  }, [authToken]);

  const hasPerm = useCallback((perm) => {
    if(!currentUser) return false;
    const perms = userPerms[currentUser.id] || DEFAULT_ROLES[currentUser.role]?.permissions || [];
    return perms.includes("admin") || perms.includes(perm);
  }, [currentUser, userPerms]);

  const canPrice = hasPerm("orders_price");

  // ── Operator role: filter views to own assignments ──
  const isOperatorRole = currentUser?.role === "operator" && !hasPerm("admin");
  const myOperator = useMemo(() => {
    if(!isOperatorRole || !currentUser) return null;
    // Match user to operator by name (case-insensitive)
    return operators.find(o => o.name.toLowerCase().trim() === currentUser.name?.toLowerCase().trim()) || null;
  }, [isOperatorRole, currentUser, operators]);
  const myOperatorId = myOperator?.id || null;

  // Helper: is this item assigned to me?
  const isMyJob = useCallback((job) => {
    if(!isOperatorRole) return true; // non-operators see everything
    return job.operatorId === myOperatorId;
  }, [isOperatorRole, myOperatorId]);

  // Helper: is this WO item mine?
  const isMyWoItem = useCallback((item) => {
    if(!isOperatorRole) return true;
    if(item.operatorId === myOperatorId) return true;
    // Also check production jobs
    return productionJobs.some(j => j.itemId === item.id && j.operatorId === myOperatorId);
  }, [isOperatorRole, myOperatorId, productionJobs]);

  //  PDF HELPERS (Phase 2.4 — disk storage, base64 kaldırıldı)
  // PDF'ler artık /api/upload'a POST edilir, data.json'da sadece { id, name, path, stage, date } kalır

  // Yardımcı: dosyayı server'a yükle, meta obje döndür
  const uploadPdfFile = async (file) => {
    if (!file.type || !file.type.startsWith("application/pdf")) {
      addNotification("error", "PDF Hatası", "Sadece PDF dosyası yüklenebilir"); return null;
    }
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      const json = await res.json();
      if (!res.ok) { addNotification("error", "Yükleme Hatası", json.error || "Yükleme başarısız"); return null; }
      return { id: genId(), name: json.name, path: json.path, size: json.size, date: new Date().toISOString() };
    } catch (e) {
      addNotification("error", "Yükleme Hatası", "Sunucuya bağlanılamadı"); return null;
    }
  };

  const addPdfToOrderItem = useCallback(async (orderId, itemId, file) => {
    const pdfMeta = await uploadPdfFile(file);
    if (!pdfMeta) return;
    const pdf = { ...pdfMeta, stage: "Sipariş" };
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newItems = order.items.map(it => it.id === itemId ? { ...it, pdfs: [...(it.pdfs || []), pdf] } : it);
    updateOrder(orderId, { items: newItems });
  }, [orders, updateOrder]);

  const addPdfToWoItem = useCallback(async (woId, itemId, file, stage) => {
    const pdfMeta = await uploadPdfFile(file);
    if (!pdfMeta) return;
    const pdf = { ...pdfMeta, stage: stage || "İş Emri" };
    const wo = workOrders.find(w => w.id === woId);
    if (!wo) return;
    const newWoItems = wo.items.map(it => it.id === itemId ? { ...it, pdfs: [...(it.pdfs || []), pdf] } : it);
    updateWorkOrder(woId, { items: newWoItems });
    // Sync back to order
    const order = orders.find(o => o.id === wo.orderId);
    if (order) {
      const newOrderItems = order.items.map(it => it.id === itemId ? { ...it, pdfs: [...(it.pdfs || []), pdf] } : it);
      updateOrder(wo.orderId, { items: newOrderItems });
    }
  }, [workOrders, orders, updateWorkOrder, updateOrder]);

  const removePdf = useCallback(async (woId, itemId, pdfId) => {
    if (!woId) return;
    const wo = workOrders.find(w => w.id === woId);
    if (!wo) return;
    const pdfToRemove = wo.items.flatMap(it => it.pdfs || []).find(p => p.id === pdfId);
    // Sunucudan sil (path varsa — disk storage)
    if (pdfToRemove?.path) {
      const filename = pdfToRemove.path.replace("/uploads/", "");
      fetch(`/api/upload/${filename}`, { method: "DELETE", credentials: "include" }).catch(() => {});
    }
    const newItems = wo.items.map(it => it.id === itemId ? { ...it, pdfs: (it.pdfs || []).filter(p => p.id !== pdfId) } : it);
    updateWorkOrder(woId, { items: newItems });
  }, [workOrders, updateWorkOrder]);

  // Reusable PDF display + upload component
  // Reusable PDF display + upload component (Phase 2.4 — disk storage)
  const PdfChips = ({ pdfs = [], onUpload, canEdit = true, size = "sm" }) => {
    const fileRef = useRef(null);
    const camRef = useRef(null);
    const [uploading, setUploading] = React.useState(false);
    const handleUpload = async (f) => {
      setUploading(true);
      await onUpload(f);
      setUploading(false);
    };
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {pdfs.map(pdf => (
          <button key={pdf.id}
            onClick={() => {
              if (pdf.path) { window.open(pdf.path, "_blank"); }
              else if (pdf.data) { setPdfViewer({ name: pdf.name, data: pdf.data }); }
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: size === "sm" ? "2px 8px" : "4px 10px", borderRadius: 5, fontSize: size === "sm" ? 11 : 12, fontWeight: 600, color: pdf.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "#f59e0b" : "#3b82f6", background: pdf.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)", border: "none", cursor: "pointer", maxWidth: 160, overflow: "hidden" }}
            title={`${pdf.name} — ${pdf.stage || ""} (${fmtDate(pdf.date)})`}>
            <File size={size === "sm" ? 10 : 12} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdf.name}</span>
          </button>
        ))}
        {canEdit && onUpload && (
          <>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600, color: uploading ? "var(--text-mute)" : "#10b981", background: "rgba(16,185,129,0.1)", border: "1px dashed rgba(16,185,129,0.3)", cursor: uploading ? "wait" : "pointer" }}>
              <Upload size={10} /> {uploading ? "Yükleniyor..." : "PDF Ekle"}
            </button>
            <button onClick={() => camRef.current?.click()} disabled={uploading}
              style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600, color: uploading ? "var(--text-mute)" : "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px dashed rgba(245,158,11,0.3)", cursor: uploading ? "wait" : "pointer" }}>
              📷 Fotoğraf
            </button>
          </>
        )}
      </div>
    );
  };

  // Schedule
  const schedule = useMemo(() => buildSchedule(productionJobs, workOrders, new Date("2026-02-14")), [productionJobs, workOrders]);

  //  ACTIONS 
  const addWoLog = useCallback((woId, action, detail) => {
    if(socketRef.current?.connected) {
      socketRef.current.emit("woLog:add", {woId, action, detail: detail||""});
    } else {
      const entry = { ts: new Date().toISOString(), user: currentUser?.name || "Sistem", action, detail: detail || "" };
      setWorkOrders(p => p.map(wo => wo.id === woId ? { ...wo, log: [...(wo.log || []), entry] } : wo));
    }
  }, [currentUser]);

  const generateWorkOrder = useCallback((order) => {
    const now = new Date().toISOString();
    const yearSuffix = String(new Date().getFullYear()).slice(-2); // "26"
    // Find highest İE number for this year
    const yearPrefix = `İE-`;
    const yearSuffixPattern = `-${yearSuffix}`;
    const existingNums = workOrders
      .filter(wo => wo.id && wo.id.startsWith(yearPrefix) && wo.id.endsWith(yearSuffixPattern))
      .map(wo => {
        const parts = wo.id.split("-");
        return parts.length === 3 ? parseInt(parts[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    let nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

    const newWOs = order.items.map((item, idx) => {
      const woNum = String(nextNum + idx).padStart(2, "0");
      return {
      id:`İE-${woNum}-${yearSuffix}`, orderId:order.id, customerName:order.customerName, customerCode:order.customerCode||"",
      date:now, deliveryDate:order.deliveryDate, status:"pending",
      currentStep:"workorder", orderType:order.orderType, currency:order.currency,
      log: [{ ts: now, user: currentUser?.name || "Sistem", action: "İş emri oluşturuldu", detail: `Sipariş: ${order.id}` }],
      items:[{
        ...item, woStatus:"pending", machineId:null, operatorId:null, startTime:null, endTime:null,
        qcChecks:{dimensionOk:false,surfaceOk:false,runoutOk:false,visualOk:false},
        laserDone:false, coatingSent:false, coatingReceived:false,
      }],
      priority:order.priority,
    };});
    setWorkOrders(p=>[...p,...newWOs]);
    setOrders(p=>p.map(o=>o.id===order.id?{...o,status:"workorder"}:o));
    if(order.priority==="urgent"||order.priority==="high"){
      addNotification("urgent",`⚡ ${order.priority==="urgent"?"ACİL":"Yüksek Öncelikli"} İş Emri`,`${order.customerName} — ${order.items.length} kalem`,["admin","planlama","imalat_muduru","all"],"workorders");
    }
    addNotification("info","📋 Yeni İş Emri",`${order.id} → ${order.customerName} (${order.items.length} kalem)`,["all"],"workorders");
  },[currentUser,addNotification,workOrders]);

  const [confirmDel, setConfirmDel] = useState(null);

  const deleteOrder = useCallback((orderId) => {
    const relatedWOs = workOrders.filter(wo => wo.orderId === orderId);
    const relatedWoIds = relatedWOs.map(wo => wo.id);
    setProductionJobs(p => p.filter(j => !relatedWoIds.includes(j.woId)));
    setCoatingQueue(p => p.filter(d => !relatedWoIds.includes(d.woId)));
    setWorkOrders(p => p.filter(wo => wo.orderId !== orderId));
    setOrders(p => p.filter(o => o.id !== orderId));
    setConfirmDel(null);
    setModal(null);
  }, [workOrders]);

  const deleteWorkOrder = useCallback((woId) => {
    setProductionJobs(p => p.filter(j => j.woId !== woId));
    setCoatingQueue(p => p.filter(d => d.woId !== woId));
    setWorkOrders(p => p.filter(wo => wo.id !== woId));
    // Check if parent order has any remaining WOs; if not, revert order status
    const wo = workOrders.find(w => w.id === woId);
    if (wo) {
      const remaining = workOrders.filter(w => w.orderId === wo.orderId && w.id !== woId);
      if (remaining.length === 0) {
        setOrders(p => p.map(o => o.id === wo.orderId ? { ...o, status: "pending" } : o));
      }
    }
    setConfirmDel(null);
    setWoDetail(null);
  }, [workOrders]);

  const [rescheduleModal, setRescheduleModal] = useState(null);

  const rescheduleJob = useCallback((jobId, { planDate, planStartMin, estimatedMinutes, machineId }) => {
    const job = productionJobs.find(j => j.id === jobId);
    if (!job) return;
    const updates = {};
    if (planDate !== undefined) updates.planDate = planDate;
    if (planStartMin !== undefined) updates.planStartMin = planStartMin;
    if (estimatedMinutes !== undefined) updates.estimatedMinutes = estimatedMinutes;
    if (machineId !== undefined) updates.machineId = machineId;
    updateProductionJob(jobId, updates);
    // Sync changes to WO item
    const wo = workOrders.find(w => w.id === job.woId);
    if (wo) {
      const itemUpdates = {};
      if (estimatedMinutes !== undefined) itemUpdates.estimatedMinutes = estimatedMinutes;
      if (machineId !== undefined) itemUpdates.machineId = machineId;
      if (Object.keys(itemUpdates).length > 0) {
        const newItems = wo.items.map(it => it.id === job.itemId ? { ...it, ...itemUpdates } : it);
        updateWorkOrder(job.woId, { items: newItems });
      }
    }
    setRescheduleModal(null);
  }, [productionJobs, workOrders, updateProductionJob, updateWorkOrder]);

  const clearManualSchedule = useCallback((jobId) => {
    updateProductionJob(jobId, { planDate: null, planStartMin: null });
    setRescheduleModal(null);
  }, [updateProductionJob]);

  //  CUTTING FUNCTIONS 
  const calculateCutting = useCallback((diameter, materialCode, itemLength, qty) => {
    const entry = barStock.find(s => s.diameter === diameter && s.materialCode === materialCode);
    const piecesPerBar = Math.floor(BAR_LENGTH / itemLength);
    if (!entry) {
      const barsNeeded = piecesPerBar > 0 ? Math.ceil(qty / piecesPerBar) : 0;
      return { found: false, availableBars: 0, barsNeeded, barsNeededWithoutRemnants: barsNeeded, piecesPerBar, remnant: 0, sufficient: false, usableRemnants: [], remnantPlan: [], piecesFromRemnants: 0, piecesFromFullBars: qty, fullBarRemnant: piecesPerBar > 0 ? BAR_LENGTH - (piecesPerBar * itemLength) : 0, lastBarRemnant: 0, totalRemnantBars: 0 };
    }
    if (piecesPerBar === 0) return { found: true, availableBars: entry.fullBars, barsNeeded: 0, piecesPerBar: 0, remnant: 0, sufficient: false, error: "Ürün boyu çubuk boyundan (330mm) büyük!", remnantPlan: [] };

    // ── Remnant-first cutting plan ──
    let remaining = qty;
    const remnantPlan = []; // { rangeKey, label, useCount, piecesPerRemnant, totalPieces, wastePerRemnant }

    // Sort usable remnants: prefer smallest usable range first (less waste)
    const usableRanges = REMNANT_RANGES
      .filter(range => range.min >= itemLength && (entry.remnants[range.key] || 0) > 0)
      .sort((a, b) => a.min - b.min); // smallest first = least waste

    usableRanges.forEach(range => {
      if (remaining <= 0) return;
      const available = entry.remnants[range.key] || 0;
      const piecesPerRemnant = Math.floor(range.min / itemLength);
      if (piecesPerRemnant <= 0) return;
      const maxNeededRemnants = Math.ceil(remaining / piecesPerRemnant);
      const useCount = Math.min(available, maxNeededRemnants);
      const totalPieces = Math.min(useCount * piecesPerRemnant, remaining);
      const wastePerRemnant = range.min - (piecesPerRemnant * itemLength);
      if (useCount > 0) {
        remnantPlan.push({ rangeKey: range.key, label: range.label, useCount, piecesPerRemnant, totalPieces, wastePerRemnant });
        remaining -= totalPieces;
      }
    });

    const piecesFromRemnants = qty - remaining;
    const fullBarsNeeded = remaining > 0 ? Math.ceil(remaining / piecesPerBar) : 0;
    const totalBarsNeeded = fullBarsNeeded; // only full bars counted for stock deduction
    const lastBarPieces = remaining > 0 ? (remaining % piecesPerBar || piecesPerBar) : 0;
    const fullBarRemnant = BAR_LENGTH - (piecesPerBar * itemLength);
    const lastBarRemnant = lastBarPieces > 0 ? BAR_LENGTH - (lastBarPieces * itemLength) : 0;

    // Check old-style usable remnants for display
    const usableRemnants = [];
    REMNANT_RANGES.forEach(range => {
      const count = entry.remnants[range.key] || 0;
      if (count > 0 && range.min >= itemLength) {
        usableRemnants.push({ rangeKey: range.key, label: range.label, count, piecesCanCut: Math.floor(range.min / itemLength) });
      }
    });

    return {
      found: true,
      availableBars: entry.fullBars,
      barsNeeded: totalBarsNeeded, // full bars needed (after remnant usage)
      barsNeededWithoutRemnants: Math.ceil(qty / piecesPerBar), // if we ignored remnants
      piecesPerBar,
      fullBarRemnant,
      lastBarRemnant,
      sufficient: entry.fullBars >= totalBarsNeeded,
      usableRemnants,
      remnantPlan, // detailed plan for remnant usage
      piecesFromRemnants,
      piecesFromFullBars: remaining,
      totalRemnantBars: fullBarsNeeded > 1 ? fullBarsNeeded - 1 : 0,
    };
  }, [barStock]);

  const performCutting = useCallback((woId, itemId, barsUsed, remnantLength, useRemnant, remnantPlan) => {
    // useRemnant: { rangeKey, count } — legacy single remnant usage
    // remnantPlan: [{ rangeKey, useCount }] — new multi-remnant plan
    const wo = workOrders.find(w => w.id === woId);
    const item = wo?.items.find(i => i.id === itemId);
    if (!wo || !item) return;

    // ── BarStock: delta update (tek kayıt) ──
    const entry = barStock.find(e => e.diameter === item.diameter && e.materialCode === item.materialCode);
    if (entry) {
      const newRemnants = { ...entry.remnants };
      // Deduct remnants from plan
      if (remnantPlan && remnantPlan.length > 0) {
        remnantPlan.forEach(rp => {
          newRemnants[rp.rangeKey] = Math.max(0, (newRemnants[rp.rangeKey] || 0) - rp.useCount);
        });
      } else if (useRemnant) {
        newRemnants[useRemnant.rangeKey] = Math.max(0, (newRemnants[useRemnant.rangeKey] || 0) - useRemnant.count);
      }
      // Add remnant from last bar to appropriate range (if > 0)
      if (remnantLength > 0) {
        const range = getRemnantRange(remnantLength);
        if (range) { newRemnants[range.key] = (newRemnants[range.key] || 0) + 1; }
      }
      // Add remnants from all full bars that produce remainders
      if (barsUsed > 1) {
        const piecesPerBar = Math.floor(BAR_LENGTH / item.length);
        const fullBarRem = BAR_LENGTH - (piecesPerBar * item.length);
        if (fullBarRem > 0) {
          const range = getRemnantRange(fullBarRem);
          if (range) { newRemnants[range.key] = (newRemnants[range.key] || 0) + (barsUsed - 1); }
        }
      }
      updateBarStockItem(entry.id, { fullBars: entry.fullBars - barsUsed, remnants: newRemnants });
    }

    // ── WorkOrder: delta update (tek kayıt) ──
    let nextStatus = "cut";
    let grindMachine = null;
    if (item.grinding && item.grindingType === "Kares Taşlama") nextStatus = "grinding_dispatch";
    else if (item.grinding && item.grindingType === "Studer Taşlama") { nextStatus = "grinding"; grindMachine = "M4"; }
    const newItems = wo.items.map(it => {
      if (it.id !== itemId) return it;
      return { ...it, woStatus: nextStatus, cutDate: new Date().toISOString(), cutBarsUsed: barsUsed, cutRemnant: remnantLength, ...(grindMachine ? { grindMachineId: grindMachine } : {}) };
    });
    updateWorkOrder(woId, { currentStep: "cutting", items: newItems });

    addWoLog(woId, "Kesim tamamlandı", `${barsUsed} çubuk, ${remnantLength}mm fire`);
    // Low stock check
    if (entry) {
      const newFullBars = entry.fullBars - barsUsed;
      if (newFullBars <= 2) {
        addNotification("warning",`⚠️ Stok Azaldı: ${item.materialCode} Ø${item.diameter}`,`Kalan: ${newFullBars} çubuk — Satın alma gerekebilir`,["admin","satin_alma","imalat_muduru","all"],"stock");
      }
    }
  }, [workOrders, barStock, updateBarStockItem, updateWorkOrder, addWoLog, addNotification]);

  // BILEME CUTTING (uç kesimi — stok düşmez)
  const performBilemeCutting = useCallback((woId, itemId) => {
    const wo = workOrders.find(w => w.id === woId); if (!wo) return;
    const newItems = wo.items.map(it => it.id === itemId ? { ...it, woStatus: "cut", cutDate: new Date().toISOString(), bilemeCut: true } : it);
    updateWorkOrder(woId, { currentStep: "cutting", items: newItems });
    addWoLog(woId, "Uç kesimi tamamlandı", "Bileme kesim");
  }, [workOrders, updateWorkOrder, addWoLog]);

  //  GRINDING FUNCTIONS 
  const completeInternalGrinding = useCallback((woId, itemId) => {
    const wo = workOrders.find(w => w.id === woId); if (!wo) return;
    const newItems = wo.items.map(it => it.id === itemId ? { ...it, woStatus: "cut", grindingDone: true, grindingDate: new Date().toISOString() } : it);
    updateWorkOrder(woId, { currentStep: "grinding", items: newItems });
    addWoLog(woId, "İç taşlama tamamlandı", "Studer");
  }, [workOrders, updateWorkOrder, addWoLog]);

  const updateKaresDispatchFields = useCallback((woId, itemId, fields) => {
    const wo = workOrders.find(w => w.id === woId); if (!wo) return;
    const newItems = wo.items.map(it => it.id === itemId ? { ...it, ...fields } : it);
    updateWorkOrder(woId, { items: newItems });
  }, [workOrders, updateWorkOrder]);

  const createKaresWaybill = useCallback((items) => {
    const waybill = {
      id: `IRS-K-${String(grindingQueue.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString(), status: "sent",
      sender: MIHENG_INFO, receiver: KARES_INFO,
      items: items.map(it => ({
        itemId: it.id, woId: it.woId, productCode: it.productCode || `Ø${it.diameter}x${it.length}`,
        rawDiameter: it.diameter, toolDiameter: Number(it.grindDiameter) || it.diameter,
        grindLength: Number(it.grindLength) || it.length, grindTolerance: it.grindTolerance || "", qty: it.qty,
        toolCode: it.toolCode, productType: it.productType, materialCode: it.materialCode,
        customerName: it.customerName
      })),
    };
    setGrindingQueue(p => [...p, waybill]);
    items.forEach(it => {
      const wo = workOrders.find(w => w.id === it.woId); if (!wo) return;
      const newItems = wo.items.map(i => i.id === it.id ? { ...i, woStatus: "grinding_shipped", grindingDispatchId: waybill.id } : i);
      updateWorkOrder(it.woId, { currentStep: "grinding", items: newItems });
      addWoLog(it.woId, "Kares'e sevk edildi", `İrsaliye: ${waybill.id}`);
    });
  }, [grindingQueue, workOrders, updateWorkOrder, addWoLog]);

  const receiveKaresGrinding = useCallback((waybillId) => {
    setGrindingQueue(p => p.map(d => d.id === waybillId ? { ...d, status: "received" } : d));
    const wb = grindingQueue.find(d => d.id === waybillId); if (!wb) return;
    wb.items.forEach(it => {
      const wo = workOrders.find(w => w.id === it.woId); if (!wo) return;
      const newItems = wo.items.map(i => i.id === it.itemId ? { ...i, woStatus: "cut", grindingDone: true, grindingDate: new Date().toISOString() } : i);
      updateWorkOrder(it.woId, { items: newItems });
      addWoLog(it.woId, "Kares'ten teslim alındı", `İrsaliye: ${waybillId}`);
    });
  }, [grindingQueue, workOrders, updateWorkOrder, addWoLog]);

  const assignToMachine = useCallback((woId,itemId,machineId,operatorId,estMin)=>{
    const wo=workOrders.find(w=>w.id===woId); if(!wo) return;
    const newItems=wo.items.map(it=>it.id===itemId?{...it,machineId,operatorId,woStatus:"assigned"}:it);
    updateWorkOrder(woId, {items:newItems});
    createProductionJob({id:genId(),woId,itemId,machineId,operatorId,status:"assigned",startTime:null,endTime:null,estimatedMinutes:estMin||60,assignedAt:Date.now()});
    const mn=machines.find(m=>m.id===machineId)?.name||machineId;
    const on=operators.find(o=>o.id===operatorId)?.name||operatorId;
    addWoLog(woId, "Makineye atandı", `${mn} — ${on}, ${estMin||60}dk`);
  },[workOrders, machines, operators, updateWorkOrder, createProductionJob, addWoLog]);

  const startProduction = useCallback((jobId)=>{
    const now=new Date().toISOString();
    const job=productionJobs.find(j=>j.id===jobId);
    if(!job) return;
    updateProductionJob(job.id, {status:"running", startTime:now});
    const wo=workOrders.find(w=>w.id===job.woId);
    if(wo){
      const newItems=wo.items.map(it=>it.id===job.itemId?{...it,woStatus:"running",startTime:now}:it);
      updateWorkOrder(wo.id, {currentStep:"production", items:newItems});
    }
    addWoLog(job.woId, "Üretim başladı", "");
  },[productionJobs, workOrders, updateProductionJob, updateWorkOrder, addWoLog]);

  const stopProduction = useCallback((jobId)=>{
    const now=new Date().toISOString();
    const job=productionJobs.find(j=>j.id===jobId);
    if(!job) return;
    updateProductionJob(job.id, {status:"completed", endTime:now});
    const wo=workOrders.find(w=>w.id===job.woId);
    if(wo){
      const newItems=wo.items.map(it=>{
        if(it.id!==job.itemId) return it;
        const defChecks=initQcObj(it.productType,wo.orderType);
        return {...it, woStatus:"qc", endTime:now, qcChecks:it.qcChecks&&Object.keys(it.qcChecks).length>0?it.qcChecks:defChecks};
      });
      updateWorkOrder(wo.id, {currentStep:"qc", items:newItems});
    }
    addWoLog(job.woId, "Üretim tamamlandı", "KK'ya gönderildi");
    const item=wo?.items.find(i=>i.id===job.itemId);
    addNotification("info","✅ Üretim Bitti → KK",`${item?.productCode||"Ürün"} — ${wo?.customerName||""} — KK bekliyor`,["kalite_kontrol","admin","all"],"qc");
  },[productionJobs, workOrders, updateProductionJob, updateWorkOrder, addWoLog, addNotification]);

  //  DEFECT REPORTING 
  const reportDefect = useCallback((woId, itemId, rejectCount, reason, stage) => {
    const wo = workOrders.find(w => w.id === woId); if (!wo) return;
    const newItems = wo.items.map(it => {
      if (it.id !== itemId) return it;
      const prevReject = Number(it.rejectQty) || 0;
      const newReject = prevReject + Number(rejectCount);
      const log = it.defectLog || [];
      return { ...it, rejectQty: newReject, defectLog: [...log, {
        date: new Date().toISOString(), qty: Number(rejectCount), reason, stage,
        reportedBy: currentUser?.name || "Bilinmiyor"
      }]};
    });
    updateWorkOrder(woId, { items: newItems });
    addWoLog(woId, "Fire raporu", `${rejectCount} adet — ${reason} (${stage})`);
    const item = wo.items.find(i => i.id === itemId);
    addNotification("danger",`🔴 Fire Bildirimi: ${rejectCount} adet`,`${item?.productCode||"Ürün"} — ${reason} (${stage}) — ${wo?.customerName||""}`,["admin","imalat_muduru","kalite_kontrol","all"],"production");
  }, [currentUser, workOrders, updateWorkOrder, addWoLog, addNotification]);

  const completeQC = useCallback((woId,itemId,checks)=>{
    const wo=workOrders.find(w=>w.id===woId); if(!wo) return;
    const isBileme=wo.orderType==="bileme";
    const newItems=wo.items.map(it=>it.id===itemId?{...it,qcChecks:checks,woStatus:isBileme?"coating_ready":"laser"}:it);
    updateWorkOrder(woId, {currentStep:isBileme?"coating":"laser", items:newItems});
    addWoLog(woId, "KK onaylandı", "");
    const it2=wo.items.find(i=>i.id===itemId);
    addNotification("success","✅ KK Onaylandı",`${it2?.productCode||"Ürün"} — ${wo?.customerName||""} → ${isBileme?"Kaplama":"Lazer"}`,["admin","all"],"workorders");
  },[workOrders, updateWorkOrder, addWoLog, addNotification]);

  const completeLaser = useCallback((woId,itemId)=>{
    const wo=workOrders.find(w=>w.id===woId); if(!wo) return;
    const newItems=wo.items.map(it=>it.id===itemId?{...it,laserDone:true,woStatus:"coating_ready"}:it);
    updateWorkOrder(woId, {currentStep:"coating", items:newItems});
    addWoLog(woId, "Lazer tamamlandı", "");
  },[workOrders, updateWorkOrder, addWoLog]);

  const sendToCoating = useCallback((woId,itemIds)=>{
    const wo=workOrders.find(w=>w.id===woId); if(!wo) return;
    const items=wo.items.filter(it=>itemIds.includes(it.id));
    const cc=[...COATING_COMPANIES_PRODUCTION,...COATING_COMPANIES_BILEME];
    const dispatch={id:`IRS-${Date.now()}`,woId,date:new Date().toISOString(),items:items.map(it=>({itemId:it.id,productCode:it.productCode||`Ø${it.diameter} ${it.islem||""}`,qty:it.qty,coatingType:it.coatingType,coatingCompanyId:it.coatingCompanyId})),coatingCompany:cc.find(c=>c.id===items[0]?.coatingCompanyId),status:"sent"};
    setCoatingQueue(p=>[...p,dispatch]);
    const newItems=wo.items.map(it=>itemIds.includes(it.id)?{...it,coatingSent:true,woStatus:"coating"}:it);
    updateWorkOrder(woId, {currentStep:"coating", items:newItems});
    addWoLog(woId, "Kaplamaya gönderildi", `${cc.find(c=>c.id===items[0]?.coatingCompanyId)?.name||""}`);
    addNotification("info","🎨 Kaplamaya Gönderildi",`${wo.customerName} — ${items.length} kalem → ${cc.find(c=>c.id===items[0]?.coatingCompanyId)?.name||""}`,["admin","all"],"coating");
  },[workOrders, updateWorkOrder, addWoLog, addNotification]);

  const receiveCoating = useCallback((dispatchId)=>{
    setCoatingQueue(p=>p.map(d=>d.id===dispatchId?{...d,status:"received"}:d));
    const dispatch=coatingQueue.find(d=>d.id===dispatchId); if(!dispatch) return;
    // Build lookup: woId → [itemIds]
    const woItemMap={};
    dispatch.items.forEach(i=>{const wid=i.woId||dispatch.woId;if(wid){if(!woItemMap[wid])woItemMap[wid]=[];woItemMap[wid].push(i.itemId);}});
    Object.entries(woItemMap).forEach(([wid, ids]) => {
      const wo = workOrders.find(w => w.id === wid); if (!wo) return;
      const newItems = wo.items.map(it => {
        if (!ids.includes(it.id)) return it;
        // Test ürünleri → ARGE, normal → Sevkiyat
        const nextStatus = it.isTest ? "arge" : "shipping";
        return { ...it, coatingReceived: true, woStatus: nextStatus };
      });
      const hasArge = newItems.some(it => it.woStatus === "arge");
      const hasShip = newItems.some(it => it.woStatus === "shipping");
      const step = hasArge && !hasShip ? "arge" : hasShip ? "shipping" : wo.currentStep;
      updateWorkOrder(wid, { currentStep: step, items: newItems });
      addWoLog(wid, "Kaplama teslim alındı", `İrsaliye: ${dispatchId}${hasArge?" — Test ürünleri ARGE'ye yönlendirildi":""}`);
    });
    addNotification("success","🎨 Kaplama Teslim Alındı",`${dispatch.coatingCompany?.name||""} — ${dispatch.items.length} kalem`,["admin","sevkiyat","all"],"shipping");
  },[coatingQueue, workOrders, updateWorkOrder, addWoLog, addNotification]);

  const completeShipping = useCallback((woId)=>{
    const wo=workOrders.find(w=>w.id===woId); if(!wo) return;
    const newItems=wo.items.map(it=>({...it,woStatus:"completed"}));
    updateWorkOrder(woId, {currentStep:"completed", status:"completed", items:newItems});
    if(wo.orderId) updateOrder(wo.orderId, {status:"completed"});
    addWoLog(woId, "Sevk edildi", "Tamamlandı");
    addNotification("success","🚚 Sevkiyat Tamamlandı",`${wo?.customerName||""} — ${woId}`,["admin","all"],"shipping");
  },[workOrders, updateWorkOrder, updateOrder, addWoLog, addNotification]);

  // ═══ ARGE ═══
  const completeArge = useCallback((woId, itemId, argeData) => {
    // argeData: { result: "olumlu"|"olumsuz", notes, testParams: [{name,value,unit,ok}], photos: [...] }
    const wo = workOrders.find(w => w.id === woId); if (!wo) return;
    const newItems = wo.items.map(it => {
      if (it.id !== itemId) return it;
      return { ...it, woStatus: "completed", argeResult: argeData.result, argeNotes: argeData.notes || "", argeTestParams: argeData.testParams || [], argePhotos: argeData.photos || [], argeDate: new Date().toISOString(), argeCompletedBy: currentUser?.name || "Sistem" };
    });
    const allDone = newItems.every(it => it.woStatus === "completed");
    updateWorkOrder(woId, { currentStep: allDone ? "completed" : wo.currentStep, status: allDone ? "completed" : wo.status, items: newItems });
    addWoLog(woId, `ARGE sonucu: ${argeData.result === "olumlu" ? "✅ Olumlu" : "❌ Olumsuz"}`, argeData.notes || "");
    addNotification(argeData.result === "olumlu" ? "success" : "danger", `🧪 ARGE: ${argeData.result === "olumlu" ? "Olumlu" : "Olumsuz"}`, `${wo.items.find(i=>i.id===itemId)?.productCode || "Ürün"} — ${wo.customerName}`, ["admin", "all"], "arge");
  }, [workOrders, currentUser, updateWorkOrder, addWoLog, addNotification]);

  const stats = useMemo(()=>{
    const myJobs = isOperatorRole&&myOperatorId ? productionJobs.filter(j=>j.operatorId===myOperatorId) : productionJobs;
    const myWoItems = isOperatorRole&&myOperatorId ? workOrders.flatMap(wo=>wo.items.filter(it=>isMyWoItem(it))) : workOrders.flatMap(wo=>wo.items);
    const t=orders.length, a=orders.filter(o=>o.status!=="completed"&&o.status!=="pending").length;
    const pend=orders.filter(o=>o.status==="pending").length;
    const pr=orders.filter(o=>o.orderType==="production").length;
    const bl=orders.filter(o=>o.orderType==="bileme").length;
    const run=myJobs.filter(j=>j.status==="running").length;
    const ml=machines.map(m=>({...m,jobs:myJobs.filter(j=>j.machineId===m.id&&j.status!=="completed"),done:myJobs.filter(j=>j.machineId===m.id&&j.status==="completed")}));
    const cp=coatingQueue.filter(c=>c.status==="sent").length;
    const cutting=workOrders.flatMap(wo=>wo.items.filter(it=>it.woStatus==="pending"||it.woStatus==="pending_stock")).length;
    const grindPend=workOrders.flatMap(wo=>wo.items).filter(it=>["grinding","grinding_dispatch","grinding_shipped"].includes(it.woStatus)).length;
    const myActive=myJobs.filter(j=>j.status!=="completed").length;
    const myDone=myJobs.filter(j=>j.status==="completed").length;
    const myQc=myWoItems.filter(it=>it.woStatus==="qc").length;
    const myAssigned=myJobs.filter(j=>j.status==="assigned").length;
    const myRunning=myJobs.filter(j=>j.status==="running").length;

    // ═══ REPORTING METRICS ═══
    const now=new Date();
    const thisMonthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
    const allItems=workOrders.flatMap(wo=>wo.items.map(it=>({...it,woId:wo.id,orderType:wo.orderType,customerName:wo.customerName,customerCode:wo.customerCode})));

    // Completed this month
    const completedJobs=productionJobs.filter(j=>j.status==="completed");
    const completedThisMonth=completedJobs.filter(j=>j.endTime&&j.endTime>=thisMonthStart).length;
    const completedWosThisMonth=workOrders.filter(wo=>wo.status==="completed"&&wo.items.some(it=>it.endTime&&it.endTime>=thisMonthStart)).length;

    // Average production time (minutes)
    const jobsWithTime=completedJobs.filter(j=>j.startTime&&j.endTime);
    const avgProdMin=jobsWithTime.length>0?Math.round(jobsWithTime.reduce((s,j)=>{
      return s+(new Date(j.endTime)-new Date(j.startTime))/60000;
    },0)/jobsWithTime.length):0;

    // Defect rate
    const totalProduced=allItems.reduce((s,it)=>s+(Number(it.qty)||0),0);
    const totalReject=allItems.reduce((s,it)=>s+(Number(it.rejectQty)||0),0);
    const defectRate=totalProduced>0?((totalReject/totalProduced)*100).toFixed(1):0;

    // Stage distribution
    const stageMap={};
    allItems.forEach(it=>{
      const st=it.woStatus||"pending";
      stageMap[st]=(stageMap[st]||0)+1;
    });
    const stageLabels={pending:"Bekleyen",pending_stock:"Stok Bekl.",cut:"Kesildi",grinding:"Taşlamada",grinding_dispatch:"Taş. Sevk Bekl.",grinding_shipped:"Kares'te",assigned:"Atandı",running:"Üretimde",qc:"Kalite Kontrol",laser:"Lazer",coating_ready:"Kaplama Haz.",coating:"Kaplamada",shipping:"Sevkiyat",arge:"ARGE",completed:"Tamamlandı"};
    const stageColors={pending:"#94a3b8",pending_stock:"#ef4444",cut:"#8b5cf6",grinding:"#d946ef",grinding_dispatch:"#d946ef",grinding_shipped:"#d946ef",assigned:"#f59e0b",running:"#3b82f6",qc:"#14b8a6",laser:"#a855f7",coating_ready:"#14b8a6",coating:"#06b6d4",shipping:"#f97316",arge:"#f59e0b",completed:"#10b981"};
    const stageDist=Object.entries(stageMap).map(([k,v])=>({key:k,label:stageLabels[k]||k,count:v,color:stageColors[k]||"#64748b"})).sort((a,b)=>b.count-a.count);

    // Machine utilization
    const machineUtil=machines.map(m=>{
      const mJobs=productionJobs.filter(j=>j.machineId===m.id);
      const mDone=mJobs.filter(j=>j.status==="completed");
      const mActive=mJobs.filter(j=>j.status==="running"||j.status==="assigned");
      const totalMin=mDone.filter(j=>j.startTime&&j.endTime).reduce((s,j)=>s+(new Date(j.endTime)-new Date(j.startTime))/60000,0);
      return{id:m.id,name:m.name,active:mActive.length,done:mDone.length,totalJobs:mJobs.length,totalMin:Math.round(totalMin)};
    });

    // Top customers
    const custMap={};
    orders.forEach(o=>{
      const key=o.customerCode||o.customerName;
      if(!custMap[key]) custMap[key]={name:o.customerName,code:o.customerCode,orders:0,items:0,completed:0};
      custMap[key].orders++;
      custMap[key].items+=o.items.length;
      if(o.status==="completed") custMap[key].completed++;
    });
    const topCustomers=Object.values(custMap).sort((a,b)=>b.orders-a.orders).slice(0,6);

    // Operator performance
    const operatorPerf=operators.map(op=>{
      const opJobs=completedJobs.filter(j=>j.operatorId===op.id);
      const opMin=opJobs.filter(j=>j.startTime&&j.endTime).reduce((s,j)=>s+(new Date(j.endTime)-new Date(j.startTime))/60000,0);
      const opReject=allItems.filter(it=>it.operatorId===op.id).reduce((s,it)=>s+(Number(it.rejectQty)||0),0);
      return{id:op.id,name:op.name,completed:opJobs.length,totalMin:Math.round(opMin),avgMin:opJobs.length>0?Math.round(opMin/opJobs.length):0,rejects:opReject};
    }).filter(op=>op.completed>0).sort((a,b)=>b.completed-a.completed);

    // Monthly order trend (last 6 months)
    const monthlyTrend=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const mStart=d.toISOString();
      const mEnd=new Date(d.getFullYear(),d.getMonth()+1,1).toISOString();
      const mName=d.toLocaleDateString("tr",{month:"short"});
      const created=orders.filter(o=>o.date>=mStart&&o.date<mEnd).length;
      const done=orders.filter(o=>o.status==="completed"&&workOrders.filter(wo=>wo.orderId===o.id).some(wo=>wo.items.some(it=>it.endTime&&it.endTime>=mStart&&it.endTime<mEnd))).length;
      monthlyTrend.push({month:mName,created,done});
    }

    return{total:t,active:a,pending:pend,production:pr,bileme:bl,running:run,machineLoad:ml,coatingPending:cp,cuttingPending:cutting,grindingPending:grindPend,purchasePending:purchaseRequests.filter(p=>p.status!=="received").length,myActive,myDone,myQc,myAssigned,myRunning,
      completedThisMonth,completedWosThisMonth,avgProdMin,defectRate,totalReject,totalProduced,
      stageDist,machineUtil,topCustomers,operatorPerf,monthlyTrend};
  },[orders,productionJobs,machines,coatingQueue,workOrders,purchaseRequests,grindingQueue,isOperatorRole,myOperatorId,operators]);










