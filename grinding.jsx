// ═══════════════════════════════════════
// Grinding Page
// ═══════════════════════════════════════
  //  GRINDING PAGE (Taşlama) 
  const GrindingPage = () => {
    const [karesModal, setKaresModal] = useState(null);
    const [selectedKares, setSelectedKares] = useState([]);
    const [localGrind, setLocalGrind] = useState({});
    const grindKey = (woId, itemId, field) => `${woId}_${itemId}_${field}`;
    const getGrindVal = (woId, itemId, field, fallback) => {
      const k = grindKey(woId, itemId, field);
      return k in localGrind ? localGrind[k] : (fallback || "");
    };
    const setGrindVal = (woId, itemId, field, val) => {
      setLocalGrind(p => ({...p, [grindKey(woId, itemId, field)]: val}));
    };
    const syncGrindVal = (woId, itemId, field) => {
      const k = grindKey(woId, itemId, field);
      if (k in localGrind) {
        updateKaresDispatchFields(woId, itemId, {[field]: localGrind[k]});
      }
    };

    // Studer / S22 internal grinding items
    const internalItems = workOrders.filter(wo => wo.orderType === "production")
      .flatMap(wo => wo.items.filter(it => it.woStatus === "grinding")
        .map(it => ({ ...it, woId: wo.id, customerName: wo.customerName, deliveryDate: wo.deliveryDate, priority: wo.priority })));

    // Kares dispatch pending
    const karesDispatch = workOrders.filter(wo => wo.orderType === "production")
      .flatMap(wo => wo.items.filter(it => it.woStatus === "grinding_dispatch")
        .map(it => ({ ...it, woId: wo.id, customerName: wo.customerName, deliveryDate: wo.deliveryDate, priority: wo.priority })));

    // Kares shipped (at Kares)
    const karesShipped = workOrders.filter(wo => wo.orderType === "production")
      .flatMap(wo => wo.items.filter(it => it.woStatus === "grinding_shipped")
        .map(it => ({ ...it, woId: wo.id, customerName: wo.customerName, deliveryDate: wo.deliveryDate, priority: wo.priority })));

    const toggleKaresSelect = (woId, id) => {
      const k = `${woId}-${id}`;
      setSelectedKares(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
    };
    const isKaresSelected = (woId, id) => selectedKares.includes(`${woId}-${id}`);

    const canCreateKaresWaybill = () => {
      const items = karesDispatch.filter(it => isKaresSelected(it.woId, it.id));
      return items.length > 0 && items.every(it => {
        const dia = getGrindVal(it.woId, it.id, "grindDiameter", it.grindDiameter);
        const len = getGrindVal(it.woId, it.id, "grindLength", it.grindLength);
        return dia && len;
      });
    };

    const handleCreateWaybill = () => {
      // Sync all local grind values before creating waybill
      const items = karesDispatch.filter(it => isKaresSelected(it.woId, it.id));
      items.forEach(it => {
        const updates = {};
        const dia = getGrindVal(it.woId, it.id, "grindDiameter", it.grindDiameter);
        const len = getGrindVal(it.woId, it.id, "grindLength", it.grindLength);
        const tol = getGrindVal(it.woId, it.id, "grindTolerance", it.grindTolerance);
        if (dia) updates.grindDiameter = dia;
        if (len) updates.grindLength = len;
        if (tol) updates.grindTolerance = tol;
        if (Object.keys(updates).length > 0) updateKaresDispatchFields(it.woId, it.id, updates);
      });
      setTimeout(() => {
        const items2 = karesDispatch.filter(it => isKaresSelected(it.woId, it.id));
        if (items2.length === 0) return;
        createKaresWaybill(items2);
        setSelectedKares([]);
        setLocalGrind({});
      }, 50);
    };

    const selectAllKares = () => {
      const all = karesDispatch.map(it => `${it.woId}-${it.id}`);
      const allSel = all.every(k => selectedKares.includes(k));
      setSelectedKares(allSel ? [] : all);
    };

    // Print waybill
    const GrindWaybillPrint = ({ d }) => {
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
          <div class="header"><div><h1>TAŞLAMA İRSALİYESİ</h1><div style="color:#666">${d.id}</div></div><div style="text-align:right"><div style="font-weight:bold">Tarih</div><div>${fmtDate(d.date)}</div></div></div>
          <div style="display:flex;gap:20px;margin-bottom:20px">
            <div class="box" style="flex:1"><h3>GÖNDERİCİ</h3><div style="font-weight:bold">${d.sender?.name || MIHENG_INFO.name}</div><div>${d.sender?.address || MIHENG_INFO.address}</div></div>
            <div class="box" style="flex:1"><h3>ALICI</h3><div style="font-weight:bold">${d.receiver?.name || ""}</div><div>${d.receiver?.address || ""}</div></div>
          </div>
          <table><thead><tr><th>#</th><th>İş Emri</th><th>Ürün</th><th>Hammadde Çapı</th><th>Takım Çapı</th><th>Tolerans</th><th>Taşlama Boyu</th><th>Adet</th></tr></thead><tbody>
          ${d.items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.woId}</td><td>${it.productCode}${it.toolCode ? " / " + it.toolCode : ""}</td><td>Ø${it.rawDiameter}mm</td><td>Ø${it.toolDiameter}mm</td><td>${it.grindTolerance || "-"}</td><td>${it.grindLength}mm</td><td style="text-align:right;font-weight:bold">${it.qty}</td></tr>`).join("")}
          <tr style="font-weight:bold;background:#f9f9f9"><td colspan="7" style="text-align:right">TOPLAM</td><td style="text-align:right">${d.items.reduce((s, it) => s + it.qty, 0)}</td></tr>
          </tbody></table>
          <div class="footer"><div class="sign-box">Teslim Eden</div><div class="sign-box">Teslim Alan</div></div>
          </body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 300);
      };
      return <Btn variant="ghost" size="sm" icon={Printer} onClick={printNote}>Yazdır</Btn>;
    };

    const [grindTab, setGrindTab] = useState("studer"); // "studer" | "kares"
    const sentWaybills = grindingQueue.filter(d => d.status === "sent");
    const receivedWaybills = grindingQueue.filter(d => d.status === "received");

    return (
      <div>
        <h2 style={{margin:"0 0 16px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>🔧 Taşlama İşlemleri</h2>
        <div style={{marginBottom:16}}><TabSwitcher tabs={[{key:"studer",label:`Studer Taşlama (${internalItems.length})`,icon:Wrench},{key:"kares",label:`Fason Taşlama (${karesDispatch.length+karesShipped.length})`,icon:Truck}]} active={grindTab} onChange={setGrindTab}/></div>

        {grindTab==="studer"&&<>
        {/* ── STUDER / S22 İç Taşlama ── */}
        <Card style={{marginBottom:16}}>
          <h3 style={{margin:"0 0 14px",color:"#d946ef",fontSize:15,fontWeight:600}}>Studer Taşlama ({internalItems.length})</h3>
          {internalItems.length === 0 ? (
            <div style={{textAlign:"center",padding:30,color:"var(--text-mute)"}}>İç taşlama bekleyen iş yok ✓</div>
          ) : internalItems.map(item => (
            <div key={`${item.woId}-${item.id}`} style={{padding:14,borderRadius:10,marginBottom:8,background:"rgba(217,70,239,0.05)",border:"1px solid rgba(217,70,239,0.15)"}}>
              <div className="mob-card-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {item.toolCode&&<span style={{fontSize:14,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}
                    <span style={{fontSize:14,fontWeight:item.toolCode?500:700,color:item.toolCode?"var(--text-sec)":"var(--text)"}}>{item.productCode}</span>
                    {item.productType&&<span style={{fontSize:11,color:"#6366f1",padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                    <Badge color="#d946ef" bg="rgba(217,70,239,0.15)">{item.grindingType}</Badge>
                    <Badge color="#6366f1" bg="rgba(99,102,241,0.15)">{item.woId}</Badge>
                    <PriorityBadge priority={item.priority}/>
                  </div>
                  <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
                    {item.customerCode||item.customerName} | Ø{item.diameter}mm × {item.length}mm | {item.qty} adet
                    {item.grindMachineId && (()=>{const m=machines.find(mm=>mm.id===item.grindMachineId);return m?<span style={{color:"#d946ef",fontWeight:600,marginLeft:8}}>🔧 {m.name}</span>:null;})()}
                  </div>
                  <div style={{fontSize:11,color:"var(--text-mute)",marginTop:4}}>Termin: {fmtDate(item.deliveryDate)}</div>
                </div>
                {hasPerm("grinding_edit") && (
                  <Btn variant="success" size="sm" icon={Check} onClick={() => completeInternalGrinding(item.woId, item.id)}>Taşlama Tamam</Btn>
                )}
              </div>
            </div>
          ))}
        </Card>
        </>}

        {grindTab==="kares"&&<>
        {/* ── KARES SEVK BEKLİYOR ── */}
        <Card style={{marginBottom:16}}>
          <div className="mob-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{margin:0,color:"#ef4444",fontSize:15,fontWeight:600}}>Kares Taşlama — Sevk Bekliyor ({karesDispatch.length})</h3>
            <div style={{display:"flex",gap:6}}>
              {karesDispatch.length > 0 && <Btn variant="ghost" size="sm" onClick={selectAllKares}>{selectedKares.length === karesDispatch.length ? "Seçimi Kaldır" : "Tümünü Seç"}</Btn>}
              {hasPerm("grinding_edit") && canCreateKaresWaybill() && (
                <Btn variant="warning" size="sm" icon={Truck} onClick={handleCreateWaybill}>İrsaliye Oluştur ({selectedKares.length})</Btn>
              )}
            </div>
          </div>
          {karesDispatch.length === 0 ? (
            <div style={{textAlign:"center",padding:30,color:"var(--text-mute)"}}>Kares sevk bekleyen iş yok ✓</div>
          ) : karesDispatch.map(item => {
            const mc = MATERIAL_CODES.find(m => m.value === item.materialCode);
            return (
              <div key={`${item.woId}-${item.id}`} style={{padding:14,borderRadius:10,marginBottom:8,
                background: isKaresSelected(item.woId, item.id) ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isKaresSelected(item.woId, item.id) ? "rgba(239,68,68,0.3)" : "var(--border)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                        <input type="checkbox" checked={isKaresSelected(item.woId, item.id)} onChange={() => toggleKaresSelect(item.woId, item.id)}/>
                      </label>
                      {item.toolCode&&<span style={{fontSize:14,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}
                    <span style={{fontSize:14,fontWeight:item.toolCode?500:700,color:item.toolCode?"var(--text-sec)":"var(--text)"}}>{item.productCode}</span>
                    {item.productType&&<span style={{fontSize:11,color:"#6366f1",padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                      <Badge color="#6366f1" bg="rgba(99,102,241,0.15)">{item.woId}</Badge>
                      <PriorityBadge priority={item.priority}/>
                    </div>
                    <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
                      {item.customerCode||item.customerName} | Hammadde Ø{item.diameter}mm | {item.qty} adet | {mc ? <span style={{fontWeight:600,color:mc.color}}>{mc.value}</span> : item.materialCode}
                    </div>
                    <div className="grid-mobile-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8,maxWidth:540}}>
                      <div>
                        <div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:2}}>Taşlama Çapı (mm)</div>
                        <LocalInput type="text" inputMode="decimal" value={getGrindVal(item.woId, item.id, "grindDiameter", item.grindDiameter)} placeholder={`${item.diameter}`}
                          onChange={val => setGrindVal(item.woId, item.id, "grindDiameter", val)}
                          onBlur={() => syncGrindVal(item.woId, item.id, "grindDiameter")}
                          style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:2}}>Tolerans</div>
                        <LocalInput type="text" value={getGrindVal(item.woId, item.id, "grindTolerance", item.grindTolerance)} placeholder="h6, ±0.01..."
                          onChange={val => setGrindVal(item.woId, item.id, "grindTolerance", val)}
                          onBlur={() => syncGrindVal(item.woId, item.id, "grindTolerance")}
                          style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid rgba(168,85,247,0.3)",background:"rgba(168,85,247,0.06)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:2}}>Taşlama Boyu (mm)</div>
                        <LocalInput type="text" inputMode="decimal" value={getGrindVal(item.woId, item.id, "grindLength", item.grindLength)} placeholder={`${item.length}`}
                          onChange={val => setGrindVal(item.woId, item.id, "grindLength", val)}
                          onBlur={() => syncGrindVal(item.woId, item.id, "grindLength")}
                          style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}/>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"var(--text-mute)",marginTop:6}}>Termin: {fmtDate(item.deliveryDate)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* ── KARES'TE OLANLAR ── */}
        {karesShipped.length > 0 && (
          <Card style={{marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",color:"#f59e0b",fontSize:15,fontWeight:600}}>Kares'te — Taşlama Yapılıyor ({karesShipped.length})</h3>
            {karesShipped.map(item => (
              <div key={`${item.woId}-${item.id}`} style={{padding:10,borderRadius:8,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.1)",marginBottom:5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {item.toolCode&&<span style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}
                    <span style={{fontSize:13,fontWeight:item.toolCode?500:600,color:item.toolCode?"var(--text-sec)":"var(--text)"}}>{item.productCode}</span>
                    {item.productType&&<span style={{fontSize:10,color:"#6366f1",padding:"1px 5px",borderRadius:3,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                    <span style={{fontSize:12,color:"var(--text-sec)"}}>{item.customerCode||item.customerName} | {item.qty} ad</span>
                    <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">📦 Kares'te</Badge>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* ── KARES İRSALİYELER — GÖNDERİLEN ── */}
        <Card style={{marginBottom:16}}>
          <h3 style={{margin:"0 0 12px",color:"#ef4444",fontSize:15,fontWeight:600}}>Gönderilen İrsaliyeler ({sentWaybills.length})</h3>
          {sentWaybills.length === 0 ? (
            <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Gönderilmiş irsaliye yok</div>
          ) : sentWaybills.map(d => (
            <div key={d.id} style={{padding:14,borderRadius:10,marginBottom:10,
              background: d.status === "sent" ? "rgba(239,68,68,0.05)" : "rgba(16,185,129,0.05)",
              border: `1px solid ${d.status === "sent" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{d.id}</span>
                  <Badge color={d.status === "sent" ? "#ef4444" : "#10b981"} bg={d.status === "sent" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}>
                    {d.status === "sent" ? "Gönderildi" : "Teslim Alındı"}
                  </Badge>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:"var(--text-mute)"}}>{fmtDateTime(d.date)}</span>
                  <GrindWaybillPrint d={d}/>
                </div>
              </div>
              {/* Sender / Receiver */}
              <div className="grid-mobile-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{padding:8,borderRadius:6,background:"var(--bg-card)",border:"1px solid var(--border)"}}>
                  <div style={{fontSize:10,color:"var(--text-mute)",fontWeight:600,marginBottom:2}}>GÖNDERİCİ</div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{d.sender?.name}</div>
                  <div style={{fontSize:11,color:"var(--text-sec)"}}>{d.sender?.address}</div>
                </div>
                <div style={{padding:8,borderRadius:6,background:"var(--bg-card)",border:"1px solid var(--border)"}}>
                  <div style={{fontSize:10,color:"var(--text-mute)",fontWeight:600,marginBottom:2}}>ALICI</div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{d.receiver?.name}</div>
                  <div style={{fontSize:11,color:"var(--text-sec)"}}>{d.receiver?.address}</div>
                </div>
              </div>
              <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>İş Emri</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>Ürün</th>
                  <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Hammadde Çapı</th>
                  <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Takım Çapı</th>
                  <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Tolerans</th>
                  <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Taşlama Boyu</th>
                  <th style={{padding:"5px 8px",textAlign:"right",color:"var(--text-mute)"}}>Adet</th>
                </tr></thead>
                <tbody>{d.items.map(it => (
                  <tr key={it.itemId}>
                    <td style={{padding:"5px 8px"}}><button onClick={() => { const wo = workOrders.find(w => w.id === it.woId); if (wo) setWoDetail(wo); }} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:12,textDecoration:"underline",fontFamily:"inherit"}}>{it.woId}</button></td>
                    <td style={{padding:"5px 8px",color:"var(--text)"}}>{it.productCode}{it.toolCode ? <span style={{color:"#f59e0b",marginLeft:6}}>{it.toolCode}</span> : null}</td>
                    <td style={{padding:"5px 8px",textAlign:"center",color:"var(--text-sec)"}}>Ø{it.rawDiameter}mm</td>
                    <td style={{padding:"5px 8px",textAlign:"center",color:"var(--text)",fontWeight:600}}>Ø{it.toolDiameter}mm</td>
                    <td style={{padding:"5px 8px",textAlign:"center",color:"#a855f7",fontWeight:600}}>{it.grindTolerance||"-"}</td>
                    <td style={{padding:"5px 8px",textAlign:"center",color:"var(--text)",fontWeight:600}}>{it.grindLength}mm</td>
                    <td style={{padding:"5px 8px",textAlign:"right",color:"var(--text)",fontWeight:600}}>{it.qty}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{borderTop:"1px solid var(--border-h)"}}>
                  <td colSpan={6} style={{padding:"5px 8px",textAlign:"right",fontWeight:600,color:"var(--text-mute)"}}>Toplam</td>
                  <td style={{padding:"5px 8px",textAlign:"right",fontWeight:700,color:"var(--text)"}}>{d.items.reduce((s, it) => s + it.qty, 0)}</td>
                </tr></tfoot>
              </table></div>
              {d.status === "sent" && hasPerm("grinding_edit") && (
                <div style={{marginTop:10,display:"flex",gap:8}}>
                  <Btn variant="success" size="sm" icon={Check} onClick={() => receiveKaresGrinding(d.id)}>Teslim Alındı — Taşlama Tamam</Btn>
                </div>
              )}
            </div>
          ))}
        </Card>

        {/* ── KARES İRSALİYELER — TESLİM ALINAN ── */}
        <Card>
          <h3 style={{margin:"0 0 12px",color:"#10b981",fontSize:15,fontWeight:600}}>Teslim Alınan İrsaliyeler ({receivedWaybills.length})</h3>
          {receivedWaybills.length === 0 ? (
            <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Teslim alınmış irsaliye yok</div>
          ) : receivedWaybills.map(d => (
            <div key={d.id} style={{padding:14,borderRadius:10,marginBottom:10,background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{d.id}</span>
                  <Badge color="#10b981" bg="rgba(16,185,129,0.15)">Teslim Alındı ✓</Badge>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:"var(--text-mute)"}}>{fmtDateTime(d.date)}</span>
                  <GrindWaybillPrint d={d}/>
                </div>
              </div>
              <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>İş Emri</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>Ürün</th>
                  <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Takım Çapı</th>
                  <th style={{padding:"5px 8px",textAlign:"right",color:"var(--text-mute)"}}>Adet</th>
                </tr></thead>
                <tbody>{d.items.map(it => (
                  <tr key={it.itemId}>
                    <td style={{padding:"5px 8px"}}><button onClick={() => { const wo = workOrders.find(w => w.id === it.woId); if (wo) setWoDetail(wo); }} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:12,textDecoration:"underline",fontFamily:"inherit"}}>{it.woId}</button></td>
                    <td style={{padding:"5px 8px",color:"var(--text)"}}>{it.productCode}</td>
                    <td style={{padding:"5px 8px",textAlign:"center",color:"var(--text)",fontWeight:600}}>Ø{it.toolDiameter}mm</td>
                    <td style={{padding:"5px 8px",textAlign:"right",color:"var(--text)",fontWeight:600}}>{it.qty}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          ))}
        </Card>
        </>}
      </div>
    );
  };

