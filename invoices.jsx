// ═══════════════════════════════════════
// Invoices Page (Faturalar)
// ═══════════════════════════════════════
  //  INVOICES 
  const InvoicesPage = () => {
    const [invSearch, setInvSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCreate, setShowCreate] = useState(null); // null or {orderId, woId, items}
    const [viewInvoice, setViewInvoice] = useState(null);
    const [editInvoice, setEditInvoice] = useState(null);
    const [confirmDel, setConfirmDel] = useState(null);
    const [editItems, setEditItems] = useState([]);
    const [editFields, setEditFields] = useState({});
    const [parasutLoading, setParasutLoading] = useState(null);
    const [parasutError, setParasutError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const canEdit = hasPerm("invoices_edit");

    // Listen for create-from-order events from shipping page
    useEffect(() => {
      const handler = (e) => {
        if (e.detail) setShowCreate(e.detail);
      };
      window.addEventListener("createInvoiceFromOrder", handler);
      return () => window.removeEventListener("createInvoiceFromOrder", handler);
    }, []);

    // Filter invoices
    const filtered = invoices.filter(inv => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (!invSearch) return true;
      const s = invSearch.toLowerCase();
      return (inv.id||"").toLowerCase().includes(s) || (inv.customerName||"").toLowerCase().includes(s) || (inv.customerCode||"").toLowerCase().includes(s) || (inv.orderId||"").toLowerCase().includes(s);
    }).sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||""));

    // Stats
    const totalDraft = invoices.filter(i=>i.status==="draft").length;
    const totalSent = invoices.filter(i=>i.status==="sent").length;
    const totalPaid = invoices.filter(i=>i.status==="paid").length;
    const totalRevenue = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.grandTotal||0),0);

    // Currency helper
    const curr = (val, currency) => {
      const sym = CURRENCIES.find(c=>c.value===currency)?.symbol || currency;
      return sym + " " + (val||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
    };

    // ── Create Invoice Form ──
    const CreateInvoiceModal = () => {
      const [custName, setCustName] = useState(showCreate?.customerName || "");
      const [custCode, setCustCode] = useState(showCreate?.customerCode || "");
      const [taxId, setTaxId] = useState("");
      const [taxOffice, setTaxOffice] = useState("");
      const [custAddr, setCustAddr] = useState("");
      const [currency, setCurrency] = useState(showCreate?.currency || "EUR");
      const [items, setItems] = useState(showCreate?.items || [{name:"",qty:1,unitPrice:0,vatRate:companyInfo.defaultVatRate||20}]);
      const [irsaliyeNo, setIrsaliyeNo] = useState("");
      const [irsaliyeDate, setIrsaliyeDate] = useState(new Date().toISOString().split("T")[0]);
      const [dueDate, setDueDate] = useState("");
      const [payTerms, setPayTerms] = useState("");
      const [notes, setNotes] = useState("");

      const addItem = () => setItems(p=>[...p,{name:"",qty:1,unitPrice:0,vatRate:companyInfo.defaultVatRate||20}]);
      const removeItem = (i) => setItems(p=>p.filter((_,idx)=>idx!==i));
      const updateItem = (i, field, val) => setItems(p=>p.map((it,idx)=>idx===i?{...it,[field]:val}:it));

      const subtotal = items.reduce((s,it)=>s+(it.qty||0)*(it.unitPrice||0),0);
      const totalVat = items.reduce((s,it)=>s+((it.qty||0)*(it.unitPrice||0)*(it.vatRate||0)/100),0);
      const grand = subtotal + totalVat;

      const handleCreate = () => {
        if(!custName.trim()) return;
        createInvoice(
          {id: showCreate?.orderId||"", customer: custName, customerCode: custCode, currency},
          items,
          {woId: showCreate?.woId||"", taxId, taxOffice, customerAddress: custAddr, irsaliyeNo, irsaliyeDate, dueDate, paymentTerms: payTerms, notes}
        );
        setShowCreate(null);
      };

      const inp = {background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",fontSize:13,width:"100%"};
      const lbl = {fontSize:11,fontWeight:600,color:"var(--text-mute)",marginBottom:4,display:"block"};

      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowCreate(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:24,width:"100%",maxWidth:720,maxHeight:"90vh",overflow:"auto",border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:18}}>Yeni Fatura Oluştur</h3>
              <button onClick={()=>setShowCreate(null)} style={{background:"none",border:"none",color:"var(--text-mute)",cursor:"pointer",fontSize:20}}>✕</button>
            </div>

            {/* Customer Info */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={lbl}>Müşteri Adı *</label><input style={inp} value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Firma adı"/></div>
              <div><label style={lbl}>Müşteri Kodu</label><input style={inp} value={custCode} onChange={e=>setCustCode(e.target.value)} placeholder="Müşteri kodu"/></div>
              <div><label style={lbl}>VKN / TCKN</label><input style={inp} value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="Vergi No"/></div>
              <div><label style={lbl}>Vergi Dairesi</label><input style={inp} value={taxOffice} onChange={e=>setTaxOffice(e.target.value)} placeholder="Vergi Dairesi"/></div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Adres</label><input style={inp} value={custAddr} onChange={e=>setCustAddr(e.target.value)} placeholder="Fatura adresi"/></div>
            </div>

            {/* Items */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{...lbl,marginBottom:0}}>Kalemler</label>
                <button onClick={addItem} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Kalem Ekle</button>
              </div>
              <div style={{background:"var(--bg-subtle)",borderRadius:10,padding:10}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 0.7fr 1fr 0.8fr 0.3fr",gap:6,marginBottom:6,padding:"0 4px"}}>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>Açıklama</span>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>Adet</span>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>Birim Fiyat</span>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>KDV %</span>
                  <span></span>
                </div>
                {items.map((it,i) => (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 0.7fr 1fr 0.8fr 0.3fr",gap:6,marginBottom:4}}>
                    <input style={{...inp,padding:"6px 8px"}} value={it.name} onChange={e=>updateItem(i,"name",e.target.value)} placeholder="Ürün adı"/>
                    <input type="number" style={{...inp,padding:"6px 8px"}} value={it.qty} onChange={e=>updateItem(i,"qty",Number(e.target.value))} min={1}/>
                    <input type="number" style={{...inp,padding:"6px 8px"}} value={it.unitPrice} onChange={e=>updateItem(i,"unitPrice",Number(e.target.value))} step="0.01" min={0}/>
                    <select style={{...inp,padding:"6px 8px"}} value={it.vatRate} onChange={e=>updateItem(i,"vatRate",Number(e.target.value))}>
                      {VAT_RATES.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                    {items.length>1 && <button onClick={()=>removeItem(i)} style={{background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:14}}>✕</button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div style={{display:"flex",justifyContent:"flex-end",gap:16,marginBottom:16,padding:"10px 16px",background:"var(--bg-subtle)",borderRadius:10}}>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Ara Toplam:</span><br/><span style={{fontWeight:600}}>{curr(subtotal,currency)}</span></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>KDV:</span><br/><span style={{fontWeight:600,color:"#f59e0b"}}>{curr(totalVat,currency)}</span></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Genel Toplam:</span><br/><span style={{fontWeight:700,fontSize:16,color:"#10b981"}}>{curr(grand,currency)}</span></div>
            </div>

            {/* Additional fields */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={lbl}>Döviz</label>
                <select style={inp} value={currency} onChange={e=>setCurrency(e.target.value)}>
                  {CURRENCIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>İrsaliye No</label><div style={{display:"flex",gap:4}}><input style={{...inp,flex:1}} value={irsaliyeNo} onChange={e=>setIrsaliyeNo(e.target.value)} placeholder="İrsaliye numarası"/><button onClick={()=>setIrsaliyeNo(generateIrsaliyeNumber())} type="button" style={{background:"rgba(139,92,246,0.15)",color:"#8b5cf6",border:"none",borderRadius:8,padding:"0 10px",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Otomatik</button></div></div>
              <div><label style={lbl}>İrsaliye Tarihi</label><input type="date" style={inp} value={irsaliyeDate} onChange={e=>setIrsaliyeDate(e.target.value)}/></div>
              <div><label style={lbl}>Vade Tarihi</label><input type="date" style={inp} value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>Ödeme Koşulları</label><input style={inp} value={payTerms} onChange={e=>setPayTerms(e.target.value)} placeholder="Örn: 30 gün vadeli"/></div>
            </div>
            <div style={{marginBottom:20}}><label style={lbl}>Notlar</label><textarea style={{...inp,minHeight:50}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Fatura notu"/></div>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowCreate(null)} style={{padding:"8px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:13}}>İptal</button>
              <button onClick={handleCreate} disabled={!custName.trim()} style={{padding:"8px 24px",borderRadius:8,border:"none",background:"#3b82f6",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,opacity:custName.trim()?1:0.5}}>Fatura Oluştur</button>
            </div>
          </div>
        </div>
      );
    };

    // ── Invoice Detail / Print View ──
    const InvoiceDetail = ({inv}) => {
      const printRef = useRef(null);

      const handlePrint = () => {
        const w = window.open("","_blank","width=800,height=1000");
        w.document.write(generatePrintHTML(inv));
        w.document.close();
        setTimeout(() => w.print(), 300);
      };

      const handleExportXML = () => {
        const xml = generateUBLTR(inv);
        const blob = new Blob([xml], {type:"application/xml"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = inv.id + ".xml"; a.click();
        URL.revokeObjectURL(url);
      };

      const handleSendParasut = async () => {
        setParasutLoading(inv.id);
        setParasutError(null);
        try {
          await sendToParasut(inv);
        } catch(e) {
          setParasutError(e.message);
        } finally {
          setParasutLoading(null);
        }
      };

      const st = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.draft;

      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setViewInvoice(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:24,width:"100%",maxWidth:800,maxHeight:"90vh",overflow:"auto",border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <h3 style={{margin:0,fontSize:20}}>{inv.id}</h3>
                <span style={{fontSize:12,color:"var(--text-mute)"}}>{new Date(inv.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,color:st.color,background:st.bg}}>{st.label}</span>
                <button onClick={()=>setViewInvoice(null)} style={{background:"none",border:"none",color:"var(--text-mute)",cursor:"pointer",fontSize:20}}>✕</button>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20,padding:16,background:"var(--bg-subtle)",borderRadius:10}}>
              <div>
                <div style={{fontSize:11,color:"var(--text-mute)",fontWeight:600}}>Müşteri</div>
                <div style={{fontWeight:600}}>{inv.customerName}</div>
                {inv.customerCode && <div style={{fontSize:12,color:"var(--text-mute)"}}>{inv.customerCode}</div>}
                {inv.customerAddress && <div style={{fontSize:12,color:"var(--text-mute)",marginTop:4}}>{inv.customerAddress}</div>}
              </div>
              <div>
                {inv.taxId && <div><span style={{fontSize:11,color:"var(--text-mute)"}}>VKN/TCKN:</span> {inv.taxId}</div>}
                {inv.taxOffice && <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Vergi Dairesi:</span> {inv.taxOffice}</div>}
                {inv.irsaliyeNo && <div style={{marginTop:8}}><span style={{fontSize:11,color:"var(--text-mute)"}}>İrsaliye:</span> {inv.irsaliyeNo} ({inv.irsaliyeDate})</div>}
                {inv.dueDate && <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Vade:</span> {inv.dueDate}</div>}
              </div>
            </div>

            {/* Items table */}
            <div style={{marginBottom:16,overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:"2px solid var(--border)"}}>
                    <th style={{textAlign:"left",padding:"8px 6px",color:"var(--text-mute)",fontSize:11,fontWeight:600}}>Açıklama</th>
                    <th style={{textAlign:"center",padding:"8px 6px",color:"var(--text-mute)",fontSize:11,fontWeight:600}}>Adet</th>
                    <th style={{textAlign:"right",padding:"8px 6px",color:"var(--text-mute)",fontSize:11,fontWeight:600}}>Birim Fiyat</th>
                    <th style={{textAlign:"center",padding:"8px 6px",color:"var(--text-mute)",fontSize:11,fontWeight:600}}>KDV %</th>
                    <th style={{textAlign:"right",padding:"8px 6px",color:"var(--text-mute)",fontSize:11,fontWeight:600}}>KDV Tutarı</th>
                    <th style={{textAlign:"right",padding:"8px 6px",color:"var(--text-mute)",fontSize:11,fontWeight:600}}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {(inv.items||[]).map((it,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid var(--border)"}}>
                      <td style={{padding:"8px 6px"}}>{it.name}</td>
                      <td style={{textAlign:"center",padding:"8px 6px"}}>{it.qty}</td>
                      <td style={{textAlign:"right",padding:"8px 6px"}}>{curr(it.unitPrice,inv.currency)}</td>
                      <td style={{textAlign:"center",padding:"8px 6px"}}>%{it.vatRate}</td>
                      <td style={{textAlign:"right",padding:"8px 6px"}}>{curr(it.vatAmount,inv.currency)}</td>
                      <td style={{textAlign:"right",padding:"8px 6px",fontWeight:600}}>{curr(it.lineTotal,inv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
              <div style={{background:"var(--bg-subtle)",borderRadius:10,padding:16,minWidth:240}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:"var(--text-mute)",fontSize:12}}>Ara Toplam</span><span style={{fontWeight:600}}>{curr(inv.subtotal,inv.currency)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:"var(--text-mute)",fontSize:12}}>KDV Toplam</span><span style={{fontWeight:600,color:"#f59e0b"}}>{curr(inv.totalVat,inv.currency)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",borderTop:"2px solid var(--border)",paddingTop:8}}><span style={{fontWeight:700}}>Genel Toplam</span><span style={{fontWeight:700,fontSize:18,color:"#10b981"}}>{curr(inv.grandTotal,inv.currency)}</span></div>
              </div>
            </div>

            {/* Bank info */}
            {inv.bankInfo && (
              <div style={{padding:12,background:"var(--bg-subtle)",borderRadius:10,marginBottom:16,fontSize:12}}>
                <div style={{fontWeight:600,marginBottom:4}}>Banka Bilgileri</div>
                <div>{inv.bankInfo.bankName} {inv.bankInfo.branch ? "- " + inv.bankInfo.branch : ""}</div>
                {inv.bankInfo.iban && <div style={{fontFamily:"monospace",color:"var(--text-mute)"}}>{inv.bankInfo.iban}</div>}
              </div>
            )}

            {inv.notes && <div style={{padding:12,background:"var(--bg-subtle)",borderRadius:10,marginBottom:16,fontSize:12}}><div style={{fontWeight:600,marginBottom:4}}>Notlar</div>{inv.notes}</div>}

            {inv.parasutId && <div style={{padding:8,background:"rgba(16,185,129,0.1)",borderRadius:8,marginBottom:16,fontSize:12,color:"#10b981"}}><strong>Paraşüt ID:</strong> {inv.parasutId}</div>}

            {parasutError && parasutLoading === null && <div style={{padding:8,background:"rgba(239,68,68,0.1)",borderRadius:8,marginBottom:16,fontSize:12,color:"#ef4444"}}>{parasutError}</div>}

            {/* Action buttons */}
            {canEdit && (
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={handlePrint} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:12,fontWeight:600}}><Printer size={14}/>Yazdır</button>
                <button onClick={handleExportXML} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"rgba(139,92,246,0.15)",color:"#8b5cf6",cursor:"pointer",fontSize:12,fontWeight:600}}><Download size={14}/>UBL-TR XML</button>
                {inv.status === "draft" && <button onClick={()=>{setViewInvoice(null);setEditInvoice(inv);}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"rgba(245,158,11,0.15)",color:"#f59e0b",cursor:"pointer",fontSize:12,fontWeight:600}}><Edit size={14}/>Düzenle</button>}
                {inv.status === "draft" && !inv.parasutId && (
                  <button onClick={handleSendParasut} disabled={parasutLoading===inv.id} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"rgba(59,130,246,0.15)",color:"#3b82f6",cursor:"pointer",fontSize:12,fontWeight:600,opacity:parasutLoading===inv.id?0.5:1}}>
                    <Send size={14}/>{parasutLoading===inv.id?"Gönderiliyor...":"Paraşüt'e Gönder"}
                  </button>
                )}
                {inv.status === "draft" && <button onClick={()=>{updateInvoiceStatus(inv.id,"sent");setViewInvoice({...inv,status:"sent"});}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"rgba(59,130,246,0.15)",color:"#3b82f6",cursor:"pointer",fontSize:12,fontWeight:600}}><Send size={14}/>Gönderildi İşaretle</button>}
                {(inv.status === "sent" || inv.status === "partial") && <button onClick={()=>{updateInvoiceStatus(inv.id,"paid");setViewInvoice({...inv,status:"paid"});}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"rgba(16,185,129,0.15)",color:"#10b981",cursor:"pointer",fontSize:12,fontWeight:600}}><CheckCircle2 size={14}/>Ödendi İşaretle</button>}
                {inv.status !== "cancelled" && inv.status !== "paid" && <button onClick={()=>{updateInvoiceStatus(inv.id,"cancelled");setViewInvoice({...inv,status:"cancelled"});}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"rgba(239,68,68,0.15)",color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:600}}><X size={14}/>İptal Et</button>}
              </div>
            )}
          </div>
        </div>
      );
    };

    // ── Generate Print HTML ──
    const generatePrintHTML = (inv) => {
      const ci = companyInfo;
      const sym = CURRENCIES.find(c=>c.value===inv.currency)?.symbol || inv.currency;
      const fmt = (v) => sym + " " + (v||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;} body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:30px;}
  .header{display:flex;justify-content:space-between;border-bottom:3px solid #1a365d;padding-bottom:16px;margin-bottom:20px;}
  .company{font-size:11px;} .company h2{font-size:18px;color:#1a365d;margin-bottom:4px;}
  .inv-title{text-align:right;} .inv-title h1{font-size:22px;color:#1a365d;margin-bottom:4px;}
  .inv-title .inv-no{font-size:16px;font-weight:700;color:#2563eb;}
  .meta{display:flex;justify-content:space-between;margin-bottom:20px;}
  .meta-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;width:48%;}
  .meta-box h4{font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:1px;margin-bottom:6px;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  th{background:#1a365d;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
  td{padding:8px 10px;border-bottom:1px solid #e2e8f0;}
  tr:nth-child(even){background:#f8fafc;}
  .totals{margin-left:auto;width:280px;}
  .totals tr td{border:none;padding:6px 10px;}
  .totals .grand{font-size:16px;font-weight:700;color:#1a365d;border-top:2px solid #1a365d;}
  .bank{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-bottom:16px;}
  .bank h4{font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:1px;margin-bottom:4px;}
  .footer{text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;margin-top:20px;}
  @media print{body{padding:15px;} @page{margin:10mm;}}
</style></head><body>
<div class="header">
  <div class="company">
    <h2>${ci.name||"Şirket Adı"}</h2>
    <div>${ci.address||""}</div>
    <div>${ci.phone?("Tel: "+ci.phone):""} ${ci.email?(" | "+ci.email):""}</div>
    <div>${ci.taxId?("VKN: "+ci.taxId):""} ${ci.taxOffice?(" | "+ci.taxOffice):""}</div>
  </div>
  <div class="inv-title">
    <h1>FATURA</h1>
    <div class="inv-no">${inv.id}</div>
    <div>Tarih: ${new Date(inv.createdAt).toLocaleDateString("tr-TR")}</div>
    ${inv.dueDate?`<div>Vade: ${inv.dueDate}</div>`:""}
  </div>
</div>
<div class="meta">
  <div class="meta-box">
    <h4>Müşteri Bilgileri</h4>
    <div><strong>${inv.customerName}</strong></div>
    ${inv.customerCode?`<div>Kod: ${inv.customerCode}</div>`:""}
    ${inv.taxId?`<div>VKN/TCKN: ${inv.taxId}</div>`:""}
    ${inv.taxOffice?`<div>Vergi Dairesi: ${inv.taxOffice}</div>`:""}
    ${inv.customerAddress?`<div>${inv.customerAddress}</div>`:""}
  </div>
  <div class="meta-box">
    <h4>Fatura Detayları</h4>
    ${inv.orderId?`<div>Sipariş: ${inv.orderId}</div>`:""}
    ${inv.irsaliyeNo?`<div>İrsaliye No: ${inv.irsaliyeNo}</div>`:""}
    ${inv.irsaliyeDate?`<div>İrsaliye Tarihi: ${inv.irsaliyeDate}</div>`:""}
    ${inv.paymentTerms?`<div>Ödeme: ${inv.paymentTerms}</div>`:""}
    <div>Döviz: ${inv.currency}</div>
  </div>
</div>
<table>
  <thead><tr><th>#</th><th>Açıklama</th><th style="text-align:center">Adet</th><th style="text-align:right">Birim Fiyat</th><th style="text-align:center">KDV %</th><th style="text-align:right">KDV Tutarı</th><th style="text-align:right">Toplam</th></tr></thead>
  <tbody>
    ${(inv.items||[]).map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${fmt(it.unitPrice)}</td><td style="text-align:center">%${it.vatRate}</td><td style="text-align:right">${fmt(it.vatAmount)}</td><td style="text-align:right"><strong>${fmt(it.lineTotal)}</strong></td></tr>`).join("")}
  </tbody>
</table>
<table class="totals">
  <tr><td style="text-align:right;color:#64748b">Ara Toplam:</td><td style="text-align:right">${fmt(inv.subtotal)}</td></tr>
  <tr><td style="text-align:right;color:#64748b">KDV Toplam:</td><td style="text-align:right">${fmt(inv.totalVat)}</td></tr>
  <tr class="grand"><td style="text-align:right">GENEL TOPLAM:</td><td style="text-align:right">${fmt(inv.grandTotal)}</td></tr>
</table>
${inv.bankInfo?`<div class="bank"><h4>Banka Bilgileri</h4><div>${inv.bankInfo.bankName||""} ${inv.bankInfo.branch?("- "+inv.bankInfo.branch):""}</div><div style="font-family:monospace">${inv.bankInfo.iban||""}</div></div>`:""}
${inv.notes?`<div style="margin-bottom:16px;font-style:italic;color:#64748b">Not: ${inv.notes}</div>`:""}
<div class="footer">${ci.name||"MİHENK"} &bull; ${inv.id} &bull; ${new Date(inv.createdAt).toLocaleDateString("tr-TR")}</div>
</body></html>`;
    };

    // ── Generate UBL-TR XML ──
    const generateUBLTR = (inv) => {
      const ci = companyInfo;
      const isoDate = (d) => d ? (d.includes("T") ? d.split("T")[0] : d) : new Date().toISOString().split("T")[0];
      const curCode = inv.currency === "TRY" ? "TRY" : inv.currency;
      return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>${inv.id}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:IssueDate>${isoDate(inv.createdAt)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${curCode}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${(inv.items||[]).length}</cbc:LineCountNumeric>
  ${inv.irsaliyeNo ? `<cac:DespatchDocumentReference><cbc:ID>${inv.irsaliyeNo}</cbc:ID><cbc:IssueDate>${isoDate(inv.irsaliyeDate)}</cbc:IssueDate></cac:DespatchDocumentReference>` : ""}
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VKN">${ci.taxId||""}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${ci.name||""}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>${ci.address||""}</cbc:StreetName><cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>
      <cac:PartyTaxScheme><cbc:Name>${ci.taxOffice||""}</cbc:Name><cac:TaxScheme><cbc:Name>Gelir Vergisi</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VKN">${inv.taxId||""}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${inv.customerName||""}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>${inv.customerAddress||""}</cbc:StreetName><cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>
      <cac:PartyTaxScheme><cbc:Name>${inv.taxOffice||""}</cbc:Name><cac:TaxScheme><cbc:Name>Gelir Vergisi</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  ${inv.dueDate ? `<cac:PaymentTerms><cbc:Note>${inv.paymentTerms||"Vadeli"}</cbc:Note><cbc:PaymentDueDate>${isoDate(inv.dueDate)}</cbc:PaymentDueDate></cac:PaymentTerms>` : ""}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${curCode}">${(inv.totalVat||0).toFixed(2)}</cbc:TaxAmount>
    ${[...new Set((inv.items||[]).map(it=>it.vatRate))].map(rate => {
      const rateItems = (inv.items||[]).filter(it=>it.vatRate===rate);
      const taxable = rateItems.reduce((s,it)=>s+(it.lineNet||0),0);
      const taxAmt = rateItems.reduce((s,it)=>s+(it.vatAmount||0),0);
      return `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${curCode}">${taxable.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${curCode}">${taxAmt.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:Percent>${rate}</cbc:Percent><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>`;
    }).join("\n    ")}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${curCode}">${(inv.subtotal||0).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${curCode}">${(inv.subtotal||0).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${curCode}">${(inv.grandTotal||0).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${curCode}">${(inv.grandTotal||0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${(inv.items||[]).map((it,i) => `<cac:InvoiceLine>
    <cbc:ID>${i+1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${it.qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${curCode}">${(it.lineNet||0).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${curCode}">${(it.vatAmount||0).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${curCode}">${(it.lineNet||0).toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${curCode}">${(it.vatAmount||0).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory><cbc:Percent>${it.vatRate}</cbc:Percent><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item><cbc:Name>${it.name}</cbc:Name></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="${curCode}">${(it.unitPrice||0).toFixed(2)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`).join("\n  ")}
</Invoice>`;
    };

    // ── Company & Paraşüt Settings Modal ──
    const SettingsModal = () => {
      const [ci, setCi] = useState({...companyInfo});
      const [parasutCfg, setParasutCfg] = useState({ client_id:"", company_id:"", client_secret:"", has_secret:false, source:"data" });
      const [cfgLoading, setCfgLoading] = useState(true);
      const [testResult, setTestResult] = useState(null);
      const [testing, setTesting] = useState(false);
      const [saving, setSaving] = useState(false);

      useEffect(() => {
        let alive = true;
        const loadConfig = async () => {
          setCfgLoading(true);
          try {
            const resp = await fetch("/api/parasut/config", { credentials: "include" });
            const data = await resp.json();
            if (!resp.ok || data.error) throw new Error(data.error || "Konfigurasyon okunamadi");
            if (!alive) return;
            setParasutCfg({
              client_id: data.client_id || "",
              company_id: data.company_id || "",
              client_secret: "",
              has_secret: !!data.has_secret,
              source: data.source || "data",
            });
          } catch (e) {
            if (!alive) return;
            setTestResult({ ok:false, msg:"Parasut ayarlar okunamadi: " + e.message });
          } finally {
            if (alive) setCfgLoading(false);
          }
        };
        loadConfig();
        return () => { alive = false; };
      }, []);

      const inp = {background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",fontSize:13,width:"100%"};
      const lbl = {fontSize:11,fontWeight:600,color:"var(--text-mute)",marginBottom:4,display:"block"};
      const section = {marginBottom:20,padding:16,background:"var(--bg-subtle)",borderRadius:10};

      const missingSecret = parasutCfg.source !== "env" && !parasutCfg.has_secret && !String(parasutCfg.client_secret || "").trim();
      const canUseParasut = !!parasutCfg.client_id && !!parasutCfg.company_id && !missingSecret;

      const saveParasutConfig = async () => {
        if (parasutCfg.source === "env") return;
        const payload = {
          client_id: String(parasutCfg.client_id || "").trim(),
          company_id: String(parasutCfg.company_id || "").trim(),
        };
        const secret = String(parasutCfg.client_secret || "").trim();
        if (secret) payload.client_secret = secret;

        const resp = await fetch("/api/parasut/config", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          credentials:"include",
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        if (!resp.ok || data.error) throw new Error(data.error || "Parasut ayarlari kaydedilemedi");

        setParasutCfg(prev => ({
          ...prev,
          client_id: data.client_id || prev.client_id,
          company_id: data.company_id || prev.company_id,
          client_secret: "",
          has_secret: !!data.has_secret,
          source: data.source || prev.source,
        }));
      };

      const handleSave = async () => {
        setSaving(true);
        setTestResult(null);
        try {
          setCompanyInfo(ci);
          if (parasutCfg.source !== "env") {
            if (!canUseParasut) throw new Error("Parasut ayarlari eksik");
            await saveParasutConfig();
          }
          setShowSettings(false);
        } catch(e) {
          setTestResult({ok:false, msg:"Kaydetme hatasi: " + e.message});
        } finally {
          setSaving(false);
        }
      };

      const handleTestConnection = async () => {
        setTesting(true); setTestResult(null);
        try {
          if (parasutCfg.source !== "env") {
            if (!canUseParasut) throw new Error("Parasut ayarlari eksik");
            await saveParasutConfig();
          }
          const resp = await fetch("/api/parasut/token", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
          });
          const data = await resp.json();
          if (resp.ok && data.access_token) {
            setTestResult({ok:true, msg:"Baglanti basarili. Token alindi."});
          } else {
            setTestResult({ok:false, msg:"Hata: " + (data.error_description || data.error || "Bilinmeyen hata")});
          }
        } catch(e) {
          setTestResult({ok:false, msg:"Baglanti hatasi: " + e.message});
        } finally {
          setTesting(false);
        }
      };

      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowSettings(false)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:24,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"auto",border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:18}}>Fatura Ayarlari</h3>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",color:"var(--text-mute)",cursor:"pointer",fontSize:20}}>x</button>
            </div>

            {/* Company Info */}
            <div style={section}>
              <h4 style={{margin:"0 0 12px",fontSize:14,color:"var(--text)"}}>Sirket Bilgileri</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{gridColumn:"1/-1"}}><label style={lbl}>Sirket Adi</label><input style={inp} value={ci.name} onChange={e=>setCi({...ci,name:e.target.value})}/></div>
                <div><label style={lbl}>VKN</label><input style={inp} value={ci.taxId} onChange={e=>setCi({...ci,taxId:e.target.value})}/></div>
                <div><label style={lbl}>Vergi Dairesi</label><input style={inp} value={ci.taxOffice} onChange={e=>setCi({...ci,taxOffice:e.target.value})}/></div>
                <div style={{gridColumn:"1/-1"}}><label style={lbl}>Adres</label><input style={inp} value={ci.address} onChange={e=>setCi({...ci,address:e.target.value})}/></div>
                <div><label style={lbl}>Telefon</label><input style={inp} value={ci.phone} onChange={e=>setCi({...ci,phone:e.target.value})}/></div>
                <div><label style={lbl}>E-posta</label><input style={inp} value={ci.email} onChange={e=>setCi({...ci,email:e.target.value})}/></div>
              </div>
            </div>

            {/* Bank Info */}
            <div style={section}>
              <h4 style={{margin:"0 0 12px",fontSize:14,color:"var(--text)"}}>Banka Bilgileri</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Banka Adi</label><input style={inp} value={ci.bankName} onChange={e=>setCi({...ci,bankName:e.target.value})}/></div>
                <div><label style={lbl}>Sube</label><input style={inp} value={ci.bankBranch} onChange={e=>setCi({...ci,bankBranch:e.target.value})}/></div>
                <div style={{gridColumn:"1/-1"}}><label style={lbl}>IBAN</label><input style={inp} value={ci.iban} onChange={e=>setCi({...ci,iban:e.target.value})} placeholder="TR00 0000 0000 0000 0000 0000 00"/></div>
              </div>
            </div>

            {/* Invoice Settings */}
            <div style={section}>
              <h4 style={{margin:"0 0 12px",fontSize:14,color:"var(--text)"}}>Fatura Ayarlari</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Fatura On Eki</label><input style={inp} value={ci.invoicePrefix} onChange={e=>setCi({...ci,invoicePrefix:e.target.value})} placeholder="MHK"/></div>
                <div><label style={lbl}>Varsayilan KDV %</label>
                  <select style={inp} value={ci.defaultVatRate} onChange={e=>setCi({...ci,defaultVatRate:Number(e.target.value)})}>
                    {VAT_RATES.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Parasut API */}
            <div style={{...section,border:"1px solid rgba(59,130,246,0.2)"}}>
              <h4 style={{margin:"0 0 12px",fontSize:14,color:"#3b82f6"}}>Parasut API Entegrasyonu</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Client ID</label><input style={inp} value={parasutCfg.client_id} onChange={e=>setParasutCfg({...parasutCfg,client_id:e.target.value})} placeholder="Parasut Client ID" disabled={cfgLoading || parasutCfg.source==="env"}/></div>
                <div><label style={lbl}>Client Secret</label><input type="password" style={inp} value={parasutCfg.client_secret} onChange={e=>setParasutCfg({...parasutCfg,client_secret:e.target.value})} placeholder={parasutCfg.has_secret?"Kayitli, degistirmek icin yazin":"Yeni secret"} disabled={cfgLoading || parasutCfg.source==="env"}/></div>
                <div><label style={lbl}>Company ID</label><input style={inp} value={parasutCfg.company_id} onChange={e=>setParasutCfg({...parasutCfg,company_id:e.target.value})} placeholder="Parasut Firma ID" disabled={cfgLoading || parasutCfg.source==="env"}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}>
                  <button onClick={handleTestConnection} disabled={testing||cfgLoading||!canUseParasut} style={{width:"100%",padding:"8px 16px",borderRadius:8,border:"none",background:testing?"rgba(59,130,246,0.3)":"rgba(59,130,246,0.15)",color:"#3b82f6",cursor:testing?"wait":"pointer",fontSize:12,fontWeight:600}}>{testing?"Test ediliyor...":"Baglanti Testi"}</button>
                </div>
              </div>
              <div style={{marginTop:8,fontSize:11,color:"var(--text-mute)"}}>
                Kaynak: {parasutCfg.source === "env" ? "Ortam degiskeni (salt-okunur)" : "Uygulama verisi"}
              </div>
              {testResult && <div style={{marginTop:8,padding:8,borderRadius:6,fontSize:12,color:testResult.ok?"#10b981":"#ef4444",background:testResult.ok?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)"}}>{testResult.msg}</div>}
            </div>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowSettings(false)} style={{padding:"8px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:13}}>Iptal</button>
              <button onClick={handleSave} disabled={saving||cfgLoading||(parasutCfg.source!=="env"&&!canUseParasut)} style={{padding:"8px 24px",borderRadius:8,border:"none",background:"#3b82f6",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,opacity:(saving||cfgLoading)?0.7:1}}>{saving?"Kaydediliyor...":"Kaydet"}</button>
            </div>
          </div>
        </div>
      );
    };

    // ── Edit Invoice Modal ──
    const EditInvoiceModal = () => {
      const inv = editInvoice;
      const [custName, setCustName] = useState(inv.customerName || "");
      const [custCode, setCustCode] = useState(inv.customerCode || "");
      const [taxId, setTaxId] = useState(inv.taxId || "");
      const [taxOffice, setTaxOffice] = useState(inv.taxOffice || "");
      const [custAddr, setCustAddr] = useState(inv.customerAddress || "");
      const [currency, setCurrency] = useState(inv.currency || "EUR");
      const [items, setItems] = useState((inv.items || []).map(it => ({name:it.name,qty:it.qty,unitPrice:it.unitPrice,vatRate:it.vatRate})));
      const [irsaliyeNo, setIrsaliyeNo] = useState(inv.irsaliyeNo || "");
      const [irsaliyeDate, setIrsaliyeDate] = useState(inv.irsaliyeDate || "");
      const [dueDate, setDueDate] = useState(inv.dueDate || "");
      const [payTerms, setPayTerms] = useState(inv.paymentTerms || "");
      const [notes, setNotes] = useState(inv.notes || "");

      const addItem = () => setItems(p=>[...p,{name:"",qty:1,unitPrice:0,vatRate:companyInfo.defaultVatRate||20}]);
      const removeItem = (i) => setItems(p=>p.filter((_,idx)=>idx!==i));
      const updateItem = (i, field, val) => setItems(p=>p.map((it,idx)=>idx===i?{...it,[field]:val}:it));

      const subtotal = items.reduce((s,it)=>s+(it.qty||0)*(it.unitPrice||0),0);
      const totalVat = items.reduce((s,it)=>s+((it.qty||0)*(it.unitPrice||0)*(it.vatRate||0)/100),0);
      const grand = subtotal + totalVat;

      const handleSave = () => {
        if(!custName.trim()) return;
        const updatedItems = items.map(it => {
          const vatRate = it.vatRate != null ? it.vatRate : 20;
          const lineNet = (it.qty||0) * (it.unitPrice||0);
          const vatAmount = lineNet * vatRate / 100;
          return { ...it, vatRate, vatAmount: Math.round(vatAmount*100)/100, lineTotal: Math.round((lineNet+vatAmount)*100)/100, lineNet: Math.round(lineNet*100)/100 };
        });
        const upd = {
          customerName: custName, customerCode: custCode, taxId, taxOffice,
          customerAddress: custAddr, currency, items: updatedItems,
          irsaliyeNo, irsaliyeDate, dueDate, paymentTerms: payTerms, notes,
          subtotal: Math.round(updatedItems.reduce((s,it)=>s+(it.lineNet||0),0)*100)/100,
          totalVat: Math.round(updatedItems.reduce((s,it)=>s+(it.vatAmount||0),0)*100)/100,
          bankInfo: companyInfo.bankName ? {bankName:companyInfo.bankName,iban:companyInfo.iban,branch:companyInfo.bankBranch} : inv.bankInfo,
        };
        upd.grandTotal = Math.round((upd.subtotal + upd.totalVat)*100)/100;
        deltaUpdateInvoice(inv.id, upd);
        setEditInvoice(null);
        if(viewInvoice && viewInvoice.id === inv.id) setViewInvoice({...inv,...upd});
      };

      const inp = {background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",fontSize:13,width:"100%"};
      const lbl = {fontSize:11,fontWeight:600,color:"var(--text-mute)",marginBottom:4,display:"block"};

      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:10001,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setEditInvoice(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:24,width:"100%",maxWidth:720,maxHeight:"90vh",overflow:"auto",border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:18}}>Fatura Düzenle — {inv.id}</h3>
              <button onClick={()=>setEditInvoice(null)} style={{background:"none",border:"none",color:"var(--text-mute)",cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={lbl}>Müşteri Adı *</label><input style={inp} value={custName} onChange={e=>setCustName(e.target.value)}/></div>
              <div><label style={lbl}>Müşteri Kodu</label><input style={inp} value={custCode} onChange={e=>setCustCode(e.target.value)}/></div>
              <div><label style={lbl}>VKN / TCKN</label><input style={inp} value={taxId} onChange={e=>setTaxId(e.target.value)}/></div>
              <div><label style={lbl}>Vergi Dairesi</label><input style={inp} value={taxOffice} onChange={e=>setTaxOffice(e.target.value)}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Adres</label><input style={inp} value={custAddr} onChange={e=>setCustAddr(e.target.value)}/></div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{...lbl,marginBottom:0}}>Kalemler</label>
                <button onClick={addItem} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Kalem Ekle</button>
              </div>
              <div style={{background:"var(--bg-subtle)",borderRadius:10,padding:10}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 0.7fr 1fr 0.8fr 0.3fr",gap:6,marginBottom:6,padding:"0 4px"}}>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>Açıklama</span>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>Adet</span>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>Birim Fiyat</span>
                  <span style={{fontSize:10,color:"var(--text-mute)",fontWeight:600}}>KDV %</span>
                  <span></span>
                </div>
                {items.map((it,i) => (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 0.7fr 1fr 0.8fr 0.3fr",gap:6,marginBottom:4}}>
                    <input style={{...inp,padding:"6px 8px"}} value={it.name} onChange={e=>updateItem(i,"name",e.target.value)}/>
                    <input type="number" style={{...inp,padding:"6px 8px"}} value={it.qty} onChange={e=>updateItem(i,"qty",Number(e.target.value))} min={1}/>
                    <input type="number" style={{...inp,padding:"6px 8px"}} value={it.unitPrice} onChange={e=>updateItem(i,"unitPrice",Number(e.target.value))} step="0.01" min={0}/>
                    <select style={{...inp,padding:"6px 8px"}} value={it.vatRate} onChange={e=>updateItem(i,"vatRate",Number(e.target.value))}>
                      {VAT_RATES.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                    {items.length>1 && <button onClick={()=>removeItem(i)} style={{background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:14}}>✕</button>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:16,marginBottom:16,padding:"10px 16px",background:"var(--bg-subtle)",borderRadius:10}}>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Ara Toplam:</span><br/><span style={{fontWeight:600}}>{curr(subtotal,currency)}</span></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>KDV:</span><br/><span style={{fontWeight:600,color:"#f59e0b"}}>{curr(totalVat,currency)}</span></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Genel Toplam:</span><br/><span style={{fontWeight:700,fontSize:16,color:"#10b981"}}>{curr(grand,currency)}</span></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={lbl}>Döviz</label>
                <select style={inp} value={currency} onChange={e=>setCurrency(e.target.value)}>
                  {CURRENCIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>İrsaliye No</label><div style={{display:"flex",gap:4}}><input style={{...inp,flex:1}} value={irsaliyeNo} onChange={e=>setIrsaliyeNo(e.target.value)}/><button onClick={()=>setIrsaliyeNo(generateIrsaliyeNumber())} type="button" style={{background:"rgba(139,92,246,0.15)",color:"#8b5cf6",border:"none",borderRadius:8,padding:"0 10px",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Otomatik</button></div></div>
              <div><label style={lbl}>İrsaliye Tarihi</label><input type="date" style={inp} value={irsaliyeDate} onChange={e=>setIrsaliyeDate(e.target.value)}/></div>
              <div><label style={lbl}>Vade Tarihi</label><input type="date" style={inp} value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>Ödeme Koşulları</label><input style={inp} value={payTerms} onChange={e=>setPayTerms(e.target.value)}/></div>
            </div>
            <div style={{marginBottom:20}}><label style={lbl}>Notlar</label><textarea style={{...inp,minHeight:50}} value={notes} onChange={e=>setNotes(e.target.value)}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditInvoice(null)} style={{padding:"8px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:13}}>İptal</button>
              <button onClick={handleSave} disabled={!custName.trim()} style={{padding:"8px 24px",borderRadius:8,border:"none",background:"#f59e0b",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,opacity:custName.trim()?1:0.5}}>Değişiklikleri Kaydet</button>
            </div>
          </div>
        </div>
      );
    };

    // ── CSV Export ──
    const exportCSV = () => {
      const headers = ["Fatura No","Tarih","Müşteri","Müşteri Kodu","Sipariş","Döviz","Ara Toplam","KDV","Genel Toplam","Durum","Paraşüt ID"];
      const rows = filtered.map(inv => [
        inv.id, new Date(inv.createdAt).toLocaleDateString("tr-TR"), inv.customerName, inv.customerCode, inv.orderId,
        inv.currency, (inv.subtotal||0).toFixed(2), (inv.totalVat||0).toFixed(2), (inv.grandTotal||0).toFixed(2),
        INVOICE_STATUSES[inv.status]?.label || inv.status, inv.parasutId || ""
      ]);
      const csv = "\uFEFF" + [headers,...rows].map(r=>r.map(c=>"\""+String(c||"").replace(/"/g,"\"\"")+"\"").join(";")).join("\n");
      const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "faturalar_" + new Date().toISOString().split("T")[0] + ".csv"; a.click();
      URL.revokeObjectURL(url);
    };

    // Delete invoice
    const handleDelete = (id) => {
      deltaDeleteInvoice(id);
      setConfirmDel(null);
    };

    // ── Main render ──
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <h2 style={{fontSize:20,fontWeight:700,margin:0,display:"flex",alignItems:"center",gap:8}}><Receipt size={22} color="#3b82f6"/>Faturalar</h2>
          <div style={{display:"flex",gap:8}}>
            {canEdit && <button onClick={()=>setShowCreate({items:[{name:"",qty:1,unitPrice:0,vatRate:companyInfo.defaultVatRate||20}]})} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:"none",background:"#3b82f6",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Yeni Fatura</button>}
            <button onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:12}}><Download size={14}/>CSV</button>
            {hasPerm("admin") && <button onClick={()=>setShowSettings(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:12}}><Settings size={14}/>Ayarlar</button>}
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
          {[
            {label:"Toplam",value:invoices.length,color:"#64748b"},
            {label:"Taslak",value:totalDraft,color:"#94a3b8"},
            {label:"Gönderilen",value:totalSent,color:"#3b82f6"},
            {label:"Ödenen",value:totalPaid,color:"#10b981"},
          ].map((s,i)=>(
            <div key={i} style={{background:"var(--bg-card)",borderRadius:12,padding:16,border:"1px solid var(--border)"}}>
              <div style={{fontSize:11,color:"var(--text-mute)",fontWeight:600,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Fatura Bekleyenler */}
        {(()=>{
          const awaiting=orders.filter(o=>o.status==="completed"&&!invoices.some(inv=>inv.orderId===o.id));
          if(!awaiting.length) return null;
          return(
            <div style={{marginBottom:16,padding:"12px 16px",borderRadius:12,border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.05)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:8}}>⏳ Fatura Bekleyenler ({awaiting.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {awaiting.map(o=>(
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,background:"var(--bg-card)",border:"1px solid var(--border)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{o.id}</span>
                      <span style={{fontSize:12,color:"var(--text-mute)"}}>{o.customerName}</span>
                      {canEdit&&<span style={{fontSize:11,color:"var(--text-dim)"}}>{new Date(o.date).toLocaleDateString("tr-TR")}</span>}
                    </div>
                    {canEdit&&<button onClick={()=>setShowCreate({orderId:o.id,customerName:o.customerName,customerCode:o.customerCode,currency:o.currency,items:o.items.map(it=>({name:it.productCode||("Ø"+it.diameter+" "+(it.islem||"")),qty:it.qty,unitPrice:it.unitPrice||0,vatRate:companyInfo.defaultVatRate||20}))})}
                      style={{padding:"5px 14px",borderRadius:6,border:"none",background:"#f59e0b",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>
                      Fatura Oluştur
                    </button>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Search + Filter */}
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",gap:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"0 12px"}}>
            <Search size={14} color="var(--text-mute)"/>
            <input value={invSearch} onChange={e=>setInvSearch(e.target.value)} placeholder="Fatura no, müşteri, sipariş ara..." style={{flex:1,background:"transparent",border:"none",color:"var(--text)",fontSize:13,padding:"8px 0",outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:4}}>
            {[{k:"all",l:"Tümü"},{k:"draft",l:"Taslak"},{k:"sent",l:"Gönderilen"},{k:"paid",l:"Ödenen"},{k:"cancelled",l:"İptal"}].map(f=>(
              <button key={f.k} onClick={()=>setStatusFilter(f.k)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid var(--border)",background:statusFilter===f.k?"#3b82f6":"transparent",color:statusFilter===f.k?"#fff":"var(--text-mute)",cursor:"pointer",fontSize:12,fontWeight:500}}>{f.l}</button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:60,color:"var(--text-mute)"}}>
            <Receipt size={48} style={{opacity:0.3,marginBottom:12}}/>
            <div style={{fontSize:14}}>Henüz fatura yok</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(inv => {
              const st = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.draft;
              return (
                <div key={inv.id} onClick={()=>setViewInvoice(inv)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"var(--bg-card)",borderRadius:12,border:"1px solid var(--border)",cursor:"pointer",transition:"all 0.15s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor="#3b82f6"} onMouseOut={e=>e.currentTarget.style.borderColor="var(--border)"}>
                  <div style={{width:40,height:40,borderRadius:10,background:st.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <FileText size={18} color={st.color}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontWeight:600,fontSize:14}}>{inv.id}</span>
                      <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,color:st.color,background:st.bg}}>{st.label}</span>
                      {inv.parasutId && <span style={{padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:600,color:"#10b981",background:"rgba(16,185,129,0.12)"}}>Paraşüt ✓</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-mute)",marginTop:2}}>{inv.customerName} {inv.customerCode ? "("+inv.customerCode+")" : ""} {inv.orderId ? " • Sipariş: "+inv.orderId : ""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>{curr(inv.grandTotal,inv.currency)}</div>
                    <div style={{fontSize:11,color:"var(--text-mute)"}}>{new Date(inv.createdAt).toLocaleDateString("tr-TR")}</div>
                  </div>
                  {canEdit && inv.status === "draft" && (
                    <button onClick={e=>{e.stopPropagation();setConfirmDel(inv.id);}} style={{background:"rgba(239,68,68,0.1)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:"#ef4444",display:"flex"}}>
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {showCreate && <CreateInvoiceModal/>}
        {viewInvoice && <InvoiceDetail inv={viewInvoice}/>}
        {editInvoice && <EditInvoiceModal/>}
        {showSettings && <SettingsModal/>}
        {confirmDel && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setConfirmDel(null)}>
            <div style={{background:"var(--bg-card)",borderRadius:12,padding:24,maxWidth:400,border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:600,marginBottom:12}}>Fatura Sil</div>
              <div style={{fontSize:13,color:"var(--text-mute)",marginBottom:20}}>"{confirmDel}" numaralı fatura silinecek. Bu işlem geri alınamaz.</div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setConfirmDel(null)} style={{padding:"6px 16px",borderRadius:6,border:"1px solid var(--border)",background:"transparent",color:"var(--text)",cursor:"pointer",fontSize:12}}>İptal</button>
                <button onClick={()=>handleDelete(confirmDel)} style={{padding:"6px 16px",borderRadius:6,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Sil</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };



