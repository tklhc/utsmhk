// ═══════════════════════════════════════
// Coating Page
// ═══════════════════════════════════════
  //  COATING 
  const CoatingPage = () => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [printDispatch, setPrintDispatch] = useState(null);
    const [dispatchTab, setDispatchTab] = useState("active");
    const ready=workOrders.flatMap(wo=>wo.items.filter(it=>it.woStatus==="coating_ready").map(it=>({...it,woId:wo.id,customerName:wo.customerName,customerCode:wo.customerCode,orderType:wo.orderType})));
    const laser=workOrders.flatMap(wo=>wo.items.filter(it=>it.woStatus==="laser").map(it=>({...it,woId:wo.id,customerName:wo.customerName,customerCode:wo.customerCode})));

    // Group ready items by coating company
    const groupedByCompany = {};
    ready.forEach(item => {
      const key = item.coatingCompanyId || "none";
      if (!groupedByCompany[key]) groupedByCompany[key] = [];
      groupedByCompany[key].push(item);
    });
    const allCC = [...COATING_COMPANIES_PRODUCTION,...COATING_COMPANIES_BILEME];

    const toggleSelect = (woId, itemId) => {
      const key = `${woId}-${itemId}`;
      setSelectedItems(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
    };
    const isSelected = (woId, itemId) => selectedItems.includes(`${woId}-${itemId}`);

    // Check all selected are same company
    const selectedReadyItems = ready.filter(it => isSelected(it.woId, it.id));
    const selectedCompanyIds = [...new Set(selectedReadyItems.map(it => it.coatingCompanyId))];
    const canCreateDispatch = selectedReadyItems.length > 0 && selectedCompanyIds.length === 1;

    const createGroupDispatch = () => {
      if (!canCreateDispatch) return;
      const companyId = selectedCompanyIds[0];
      const cc = allCC.find(c => c.id === companyId);
      const dispatchItems = selectedReadyItems.map(it => ({
        itemId: it.id, woId: it.woId, productCode: it.productCode || `Ø${it.diameter} ${it.islem || ""}`,
        qty: it.qty, coatingType: it.coatingType, diameter: it.diameter, customerName: it.customerName
      }));
      const dispatch = {
        id: `IRS-${String(coatingQueue.length + 1).padStart(3, "0")}`,
        date: new Date().toISOString(), status: "sent",
        coatingCompanyId: companyId, coatingCompany: cc,
        sender: MIHENG_INFO,
        receiver: cc ? { name: cc.fullName, address: cc.address } : null,
        items: dispatchItems,
      };
      createCoatingQueueItem(dispatch);
      // Update all items
      selectedReadyItems.forEach(it => {
        const woCat=workOrders.find(w=>w.id===it.woId);
        if(woCat){
          const newCatItems=woCat.items.map(i=>i.id===it.id?{...i,coatingSent:true,woStatus:"coating",dispatchId:dispatch.id}:i);
          updateWorkOrder(it.woId,{currentStep:"coating",items:newCatItems});
        }
      });
      setSelectedItems([]);
    };

    const selectAllForCompany = (companyId) => {
      const items = groupedByCompany[companyId] || [];
      const keys = items.map(it => `${it.woId}-${it.id}`);
      const allSelected = keys.every(k => selectedItems.includes(k));
      if (allSelected) {
        setSelectedItems(p => p.filter(k => !keys.includes(k)));
      } else {
        setSelectedItems(p => [...new Set([...p, ...keys])]);
      }
    };

    // Print dispatch note
    const DispatchPrint = ({d}) => {
      const iframeRef = useRef(null);
      const printNote = () => {
        const w = window.open("", "_blank", "width=800,height=600");
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>İrsaliye ${d.id}</title>
          <style>body{font-family:Arial,sans-serif;padding:30px;color:#333;font-size:13px}
          h1{font-size:20px;margin-bottom:5px} .header{display:flex;justify-content:space-between;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:15px}
          .box{border:1px solid #ccc;padding:12px;border-radius:6px;margin-bottom:12px} .box h3{margin:0 0 6px;font-size:13px;color:#666}
          table{width:100%;border-collapse:collapse;margin-top:15px} th,td{border:1px solid #ccc;padding:8px 10px;text-align:left;font-size:12px}
          th{background:#f5f5f5;font-weight:bold} .footer{margin-top:40px;display:flex;justify-content:space-between}
          .sign-box{width:200px;border-top:1px solid #333;padding-top:8px;text-align:center;font-size:11px;color:#666}
          @media print{body{padding:15px}}</style></head><body>
          <div class="header"><div><h1>İRSALİYE</h1><div style="color:#666">${d.id}</div></div><div style="text-align:right"><div style="font-weight:bold">Tarih</div><div>${fmtDate(d.date)}</div></div></div>
          <div style="display:flex;gap:20px;margin-bottom:20px">
            <div class="box" style="flex:1"><h3>GÖNDERİCİ</h3><div style="font-weight:bold">${d.sender?.name || MIHENG_INFO.name}</div><div>${d.sender?.address || MIHENG_INFO.address}</div></div>
            <div class="box" style="flex:1"><h3>ALICI</h3><div style="font-weight:bold">${d.receiver?.name || ""}</div><div>${d.receiver?.address || ""}</div></div>
          </div>
          <table><thead><tr><th>#</th><th>İş Emri</th><th>Ürün</th><th>Çap</th><th>Kaplama</th><th>Adet</th></tr></thead><tbody>
          ${d.items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.woId}</td><td>${it.productCode}</td><td>Ø${it.diameter || "-"}mm</td><td>${it.coatingType}</td><td style="text-align:right;font-weight:bold">${it.qty}</td></tr>`).join("")}
          <tr style="font-weight:bold;background:#f9f9f9"><td colspan="5" style="text-align:right">TOPLAM</td><td style="text-align:right">${d.items.reduce((s, it) => s + it.qty, 0)}</td></tr>
          </tbody></table>
          <div class="footer"><div class="sign-box">Teslim Eden</div><div class="sign-box">Teslim Alan</div></div>
          </body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 300);
      };
      return <Btn variant="ghost" size="sm" icon={Printer} onClick={printNote}>Yazdır</Btn>;
    };

    return(
      <div>
        <h2 style={{margin:"0 0 20px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>Kaplama</h2>
        {laser.length>0&&<Card style={{marginBottom:16}}><h3 style={{margin:"0 0 12px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Lazer Bekleyen ({laser.length})</h3>{laser.map(item=>(
          <div key={item.id} style={{padding:10,borderRadius:8,background:"rgba(168,85,247,0.05)",border:"1px solid rgba(168,85,247,0.15)",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="mob-detail-stack" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontSize:13,color:"var(--text)"}}>{item.toolCode&&<span style={{fontWeight:700,color:"#f59e0b",marginRight:4}}>{item.toolCode}</span>}{item.productCode||`Ø${item.diameter} ${item.islem||""}`} — {item.customerCode||item.customerName} | {item.qty} ad</span><button onClick={()=>{const wo=workOrders.find(w=>w.id===item.woId);if(wo)setWoDetail(wo);}} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:11,textDecoration:"underline",fontFamily:"inherit"}}>{item.woId}</button></div>
              {hasPerm("coating_edit")&&<Btn variant="warning" size="sm" icon={Zap} onClick={()=>completeLaser(item.woId,item.id)}>Lazer Tamam</Btn>}
            </div>
            <div style={{marginTop:6}}><PdfChips pdfs={item.pdfs||[]} canEdit={hasPerm("coating_edit")} onUpload={f=>addPdfToWoItem(item.woId,item.id,f,"Lazer")}/></div>
          </div>
        ))}</Card>}

        {/* Ready - grouped by company */}
        <Card style={{marginBottom:16}}>
          <div className="mob-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>Kaplamaya Hazır ({ready.length})</h3>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {canCreateDispatch && (
              <Btn variant="primary" icon={Truck} onClick={createGroupDispatch}>
                İrsaliye Oluştur ({selectedReadyItems.length} kalem → {allCC.find(c=>c.id===selectedCompanyIds[0])?.name})
              </Btn>
            )}
            {selectedReadyItems.length > 0 && selectedCompanyIds.length > 1 && (
              <span style={{fontSize:12,color:"#ef4444",fontWeight:600}}>⚠️ Farklı firmalar seçilemez — aynı kaplama firması seçin</span>
            )}
            </div>
          </div>
          {ready.length === 0 ? <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Yok</div> :
            Object.entries(groupedByCompany).map(([companyId, items]) => {
              const cc = allCC.find(c => c.id === companyId);
              const allSel = items.every(it => isSelected(it.woId, it.id));
              return (
                <div key={companyId} style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"6px 10px",borderRadius:6,background:"rgba(20,184,166,0.06)"}}>
                    <input type="checkbox" checked={allSel} onChange={()=>selectAllForCompany(companyId)} style={{cursor:"pointer"}}/>
                    <span style={{fontSize:13,fontWeight:700,color:"#14b8a6"}}>{cc?.name || "Belirtilmemiş"}</span>
                    <span style={{fontSize:11,color:"var(--text-mute)"}}>({items.length} kalem)</span>
                  </div>
                  {items.map(item => (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:10,borderRadius:8,background:isSelected(item.woId,item.id)?"rgba(20,184,166,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${isSelected(item.woId,item.id)?"rgba(20,184,166,0.3)":"var(--border)"}`,marginBottom:4,cursor:"pointer"}} onClick={()=>toggleSelect(item.woId,item.id)}>
                      <input type="checkbox" checked={isSelected(item.woId,item.id)} onChange={()=>{}} style={{cursor:"pointer",flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{item.toolCode&&<span style={{color:"#f59e0b",marginRight:4}}>{item.toolCode}</span>}{item.productCode||`Ø${item.diameter} ${item.islem||""}`}</span>
                        <span style={{fontSize:12,color:"var(--text-mute)",marginLeft:8}}>{item.customerCode||item.customerName} | {item.qty} ad</span>
                        {item.coatingType&&<span style={{fontSize:11,color:"#14b8a6",marginLeft:8}}>{item.coatingType}</span>}
                        <button onClick={e=>{e.stopPropagation();const wo=workOrders.find(w=>w.id===item.woId);if(wo)setWoDetail(wo);}} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:11,textDecoration:"underline",fontFamily:"inherit",marginLeft:8}}>{item.woId}</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          }
        </Card>

        {/* Dispatches — Active vs Completed tabs */}
        {(()=>{
          const activeDispatches = coatingQueue.filter(d => d.status === "sent");
          const completedDispatches = coatingQueue.filter(d => d.status !== "sent");
          const currentList = dispatchTab === "active" ? activeDispatches : completedDispatches;
          return(
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>İrsaliyeler</h3>
              <div style={{display:"flex",gap:4,background:"var(--bg-hover)",borderRadius:8,padding:3}}>
                <button onClick={()=>setDispatchTab("active")} style={{padding:"6px 14px",borderRadius:6,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:dispatchTab==="active"?"rgba(245,158,11,0.15)":"transparent",color:dispatchTab==="active"?"#f59e0b":"#64748b"}}>
                  Aktif ({activeDispatches.length})
                </button>
                <button onClick={()=>setDispatchTab("completed")} style={{padding:"6px 14px",borderRadius:6,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:dispatchTab==="completed"?"rgba(16,185,129,0.15)":"transparent",color:dispatchTab==="completed"?"#10b981":"#64748b"}}>
                  Tamamlanan ({completedDispatches.length})
                </button>
              </div>
            </div>
            {currentList.length===0?<div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>{dispatchTab==="active"?"Aktif irsaliye yok":"Tamamlanan irsaliye yok"}</div>
            :currentList.map(d=>(
            <div key={d.id} style={{padding:14,borderRadius:10,marginBottom:10,background:d.status==="sent"?"rgba(245,158,11,0.05)":"rgba(16,185,129,0.05)",border:`1px solid ${d.status==="sent"?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{d.id}</span>
                  <Badge color={d.status==="sent"?"#f59e0b":"#10b981"} bg={d.status==="sent"?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)"}>{d.status==="sent"?"Gönderildi":"Teslim Alındı"}</Badge>
                  {d.coatingCompany&&<span style={{fontSize:11,color:"#14b8a6",fontWeight:600}}>{d.coatingCompany.name}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:"var(--text-mute)"}}>{fmtDateTime(d.date)}</span>
                  <DispatchPrint d={d}/>
                </div>
              </div>
              <div className="mob-grid-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{padding:8,borderRadius:6,background:"var(--bg-card)",border:"1px solid var(--border)"}}>
                  <div style={{fontSize:10,color:"var(--text-mute)",fontWeight:600,marginBottom:2}}>GÖNDERİCİ</div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{d.sender?.name || MIHENG_INFO.name}</div>
                  <div style={{fontSize:11,color:"var(--text-sec)"}}>{d.sender?.address || MIHENG_INFO.address}</div>
                </div>
                <div style={{padding:8,borderRadius:6,background:"var(--bg-card)",border:"1px solid var(--border)"}}>
                  <div style={{fontSize:10,color:"var(--text-mute)",fontWeight:600,marginBottom:2}}>ALICI</div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{d.receiver?.name || d.coatingCompany?.fullName || d.coatingCompany?.name || ""}</div>
                  <div style={{fontSize:11,color:"var(--text-sec)"}}>{d.receiver?.address || d.coatingCompany?.address || ""}</div>
                </div>
              </div>
              <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{borderBottom:"1px solid var(--border)"}}><th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>İş Emri</th><th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>Ürün</th><th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>Kaplama</th><th style={{padding:"5px 8px",textAlign:"right",color:"var(--text-mute)"}}>Adet</th></tr></thead><tbody>{d.items.map(it=><tr key={it.itemId}><td style={{padding:"5px 8px"}}><button onClick={()=>{const wo=workOrders.find(w=>w.id===it.woId);if(wo)setWoDetail(wo);}} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:12,textDecoration:"underline",fontFamily:"inherit"}}>{it.woId}</button></td><td style={{padding:"5px 8px",color:"var(--text)"}}>{it.productCode}</td><td style={{padding:"5px 8px",color:"#14b8a6"}}>{it.coatingType}</td><td style={{padding:"5px 8px",textAlign:"right",color:"var(--text)",fontWeight:600}}>{it.qty}</td></tr>)}</tbody>
              <tfoot><tr style={{borderTop:"1px solid var(--border-h)"}}><td colSpan={3} style={{padding:"5px 8px",textAlign:"right",fontWeight:600,color:"var(--text-mute)"}}>Toplam</td><td style={{padding:"5px 8px",textAlign:"right",fontWeight:700,color:"var(--text)"}}>{d.items.reduce((s,it)=>s+it.qty,0)}</td></tr></tfoot></table></div>
              {d.status==="sent"&&hasPerm("coating_edit")&&<div style={{marginTop:10,display:"flex",gap:8}}><Btn variant="success" size="sm" icon={Check} onClick={()=>receiveCoating(d.id)}>Teslim Alındı</Btn></div>}
            </div>
            ))}
          </Card>
          );
        })()}
      </div>
    );
  };

