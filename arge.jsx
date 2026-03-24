// ═══════════════════════════════════════
// ARGE Page
// ═══════════════════════════════════════
  const ArgePage = () => {
    const [argeTab, setArgeTab] = useState("pending"); // "pending" | "completed"
    const [argeModal, setArgeModal] = useState(null); // {woId, itemId, item, wo}
    const [argeResult, setArgeResult] = useState(null); // "olumlu" | "olumsuz"
    const [argeNotes, setArgeNotes] = useState("");
    const [argeParams, setArgeParams] = useState([]); // [{name, value, unit, ok}]
    const [argePhotos, setArgePhotos] = useState([]); // [{id, name, path}]
    const [uploading, setUploading] = useState(false);
    const camRef = useRef(null);
    const fileRef = useRef(null);

    // Items waiting for ARGE
    const pendingArge = workOrders.flatMap(wo =>
      wo.items.filter(it => it.woStatus === "arge").map(it => ({
        ...it, woId: wo.id, customerName: wo.customerName, customerCode: wo.customerCode,
        deliveryDate: wo.deliveryDate, orderType: wo.orderType, priority: wo.priority
      }))
    );

    // Completed ARGE items
    const completedArge = workOrders.flatMap(wo =>
      wo.items.filter(it => it.argeResult).map(it => ({
        ...it, woId: wo.id, customerName: wo.customerName, customerCode: wo.customerCode, orderType: wo.orderType
      }))
    );

    const openArgeForm = (item) => {
      const wo = workOrders.find(w => w.id === item.woId);
      setArgeModal({ woId: item.woId, itemId: item.id, item, wo });
      setArgeResult(null);
      setArgeNotes("");
      setArgeParams([{ name: "", value: "", unit: "mm", ok: true }]);
      setArgePhotos([]);
    };

    const addParam = () => setArgeParams(p => [...p, { name: "", value: "", unit: "mm", ok: true }]);
    const removeParam = (idx) => setArgeParams(p => p.filter((_, i) => i !== idx));
    const updateParam = (idx, field, val) => setArgeParams(p => p.map((r, i) => i === idx ? { ...r, [field]: val } : r));

    const handlePhotoUpload = async (file) => {
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("pdf", file);
        const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: fd });
        const data = await res.json();
        if (res.ok) {
          setArgePhotos(p => [...p, { id: genId(), name: file.name, path: data.path }]);
        }
      } catch (e) { console.error("Upload hatası:", e); }
      setUploading(false);
    };

    const submitArge = () => {
      if (!argeModal || !argeResult) return;
      const validParams = argeParams.filter(p => p.name.trim());
      completeArge(argeModal.woId, argeModal.itemId, {
        result: argeResult,
        notes: argeNotes,
        testParams: validParams,
        photos: argePhotos,
      });
      setArgeModal(null);
    };

    const UNITS = ["mm", "µm", "°", "Ra", "HRC", "N", "RPM", "m/dk", "ad", "dk", "diğer"];

    return (
      <div>
        <h2 style={{margin:"0 0 16px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>🧪 ARGE — Test Sonuçları</h2>
        <div style={{marginBottom:16}}><TabSwitcher tabs={[
          {key:"pending",label:`Bekleyen (${pendingArge.length})`,icon:AlertTriangle},
          {key:"completed",label:`Tamamlanan (${completedArge.length})`,icon:CheckCircle2}
        ]} active={argeTab} onChange={setArgeTab}/></div>

        {argeTab === "pending" && (
          <div>
            {pendingArge.length === 0 ? (
              <Card style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:40,marginBottom:12}}>🧪</div>
                <div style={{color:"var(--text-mute)",fontSize:14}}>Test bekleyen ürün yok</div>
              </Card>
            ) : pendingArge.map(item => (
              <Card key={`${item.woId}-${item.id}`} style={{marginBottom:10}}>
                <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">🧪 Test</Badge>
                    <OrderTypeBadge type={item.orderType}/>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{item.productCode || `Ø${item.diameter} ${item.islem || ""}`}</span>
                    {item.productType && <span style={{fontSize:10,color:"#6366f1",padding:"2px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                    {item.toolCode && <span style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>{item.toolCode}</span>}
                    <span style={{fontSize:12,color:"var(--text-sec)"}}>{item.customerCode || item.customerName}</span>
                    <span style={{fontSize:12,color:"var(--text-mute)"}}>{item.qty} ad</span>
                    <button onClick={() => { const wo = workOrders.find(w => w.id === item.woId); if (wo) setWoDetail(wo); }} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:11,textDecoration:"underline",fontFamily:"inherit"}}>{item.woId}</button>
                  </div>
                  <Btn variant="primary" icon={Edit} onClick={() => openArgeForm(item)}>Test Sonucu Gir</Btn>
                </div>
                <div style={{marginTop:6}}><PdfChips pdfs={item.pdfs || []} canEdit={false}/></div>
              </Card>
            ))}
          </div>
        )}

        {argeTab === "completed" && (
          <div>
            {completedArge.length === 0 ? (
              <Card style={{textAlign:"center",padding:40}}>
                <div style={{color:"var(--text-mute)",fontSize:14}}>Henüz tamamlanan test yok</div>
              </Card>
            ) : completedArge.map(item => (
              <Card key={`${item.woId}-${item.id}`} style={{marginBottom:10,borderLeft:`3px solid ${item.argeResult === "olumlu" ? "#10b981" : "#ef4444"}`}}>
                <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <Badge color={item.argeResult === "olumlu" ? "#10b981" : "#ef4444"} bg={item.argeResult === "olumlu" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}>
                      {item.argeResult === "olumlu" ? "✅ Olumlu" : "❌ Olumsuz"}
                    </Badge>
                    <OrderTypeBadge type={item.orderType}/>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{item.productCode || `Ø${item.diameter} ${item.islem || ""}`}</span>
                    {item.productType && <span style={{fontSize:10,color:"#6366f1",padding:"2px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                    <span style={{fontSize:12,color:"var(--text-sec)"}}>{item.customerCode || item.customerName} | {item.qty} ad</span>
                  </div>
                  <div style={{fontSize:12,color:"var(--text-mute)"}}>
                    {item.argeDate ? fmtDateTime(item.argeDate) : ""} — {item.argeCompletedBy || ""}
                  </div>
                </div>

                {/* Test Parameters */}
                {(item.argeTestParams || []).length > 0 && (
                  <div style={{marginBottom:8}}>
                    <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                        <th style={{padding:"5px 8px",textAlign:"left",color:"var(--text-mute)"}}>Parametre</th>
                        <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Değer</th>
                        <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Birim</th>
                        <th style={{padding:"5px 8px",textAlign:"center",color:"var(--text-mute)"}}>Sonuç</th>
                      </tr></thead>
                      <tbody>{(item.argeTestParams || []).map((tp, i) => (
                        <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <td style={{padding:"5px 8px",fontWeight:600,color:"var(--text)"}}>{tp.name}</td>
                          <td style={{padding:"5px 8px",textAlign:"center",color:"var(--text)"}}>{tp.value}</td>
                          <td style={{padding:"5px 8px",textAlign:"center",color:"var(--text-sec)"}}>{tp.unit}</td>
                          <td style={{padding:"5px 8px",textAlign:"center"}}><span style={{color:tp.ok?"#10b981":"#ef4444",fontWeight:700}}>{tp.ok?"✓ OK":"✗ NOK"}</span></td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                  </div>
                )}

                {/* Notes */}
                {item.argeNotes && (
                  <div style={{padding:8,borderRadius:6,background:"var(--bg-subtle)",border:"1px solid var(--border)",fontSize:12,color:"var(--text-sec)",marginBottom:8}}>
                    📝 {item.argeNotes}
                  </div>
                )}

                {/* Photos */}
                {(item.argePhotos || []).length > 0 && (
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {item.argePhotos.map(p => (
                      <button key={p.id} onClick={() => window.open(p.path, "_blank")} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:600,color:"#f59e0b",background:"rgba(245,158,11,0.1)",border:"none",cursor:"pointer"}}>
                        📷 {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ARGE Result Modal */}
        {argeModal && (
          <Modal title="🧪 ARGE Test Sonucu" onClose={() => setArgeModal(null)} width={640}>
            <div style={{padding:"8px 0"}}>
              {/* Product info */}
              <div style={{padding:12,borderRadius:10,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{argeModal.item.productCode || `Ø${argeModal.item.diameter} ${argeModal.item.islem || ""}`}</div>
                <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
                  {argeModal.wo?.customerName} | {argeModal.item.qty} adet | {argeModal.item.toolCode || ""} | {argeModal.woId}
                </div>
              </div>

              {/* Result toggle */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-sec)",marginBottom:6}}>Test Sonucu</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={() => setArgeResult("olumlu")} style={{flex:1,padding:"14px 0",borderRadius:10,border:`2px solid ${argeResult === "olumlu" ? "#10b981" : "var(--border-strong)"}`,background:argeResult === "olumlu" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.02)",color:argeResult === "olumlu" ? "#10b981" : "var(--text-sec)",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                    ✅ Olumlu
                  </button>
                  <button onClick={() => setArgeResult("olumsuz")} style={{flex:1,padding:"14px 0",borderRadius:10,border:`2px solid ${argeResult === "olumsuz" ? "#ef4444" : "var(--border-strong)"}`,background:argeResult === "olumsuz" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.02)",color:argeResult === "olumsuz" ? "#ef4444" : "var(--text-sec)",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                    ❌ Olumsuz
                  </button>
                </div>
              </div>

              {/* Test Parameters */}
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text-sec)"}}>Test Parametreleri</div>
                  <button onClick={addParam} style={{padding:"3px 10px",borderRadius:6,border:"1px dashed rgba(59,130,246,0.3)",background:"rgba(59,130,246,0.08)",color:"#3b82f6",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Parametre Ekle</button>
                </div>
                {argeParams.map((param, idx) => (
                  <div key={idx} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr auto auto auto",gap:6,marginBottom:6,alignItems:"center"}}>
                    <input type="text" value={param.name} onChange={e => updateParam(idx, "name", e.target.value)} placeholder="Parametre adı (ör: Çap, Salgı, Yüzey...)"
                      style={{padding:"7px 10px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/>
                    <input type="text" value={param.value} onChange={e => updateParam(idx, "value", e.target.value)} placeholder="Değer"
                      style={{padding:"7px 10px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/>
                    <select value={param.unit} onChange={e => updateParam(idx, "unit", e.target.value)}
                      style={{padding:"7px 6px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:11,fontFamily:"inherit"}}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button onClick={() => updateParam(idx, "ok", !param.ok)}
                      style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${param.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,background:param.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",color:param.ok ? "#10b981" : "#ef4444",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",minWidth:50,textAlign:"center"}}>
                      {param.ok ? "OK" : "NOK"}
                    </button>
                    <button onClick={() => removeParam(idx)} style={{padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text-mute)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                  </div>
                ))}
              </div>

              {/* Photos */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-sec)",marginBottom:6}}>Fotoğraflar</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  {argePhotos.map(p => (
                    <div key={p.id} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)"}}>
                      <span style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>📷 {p.name}</span>
                      <button onClick={() => setArgePhotos(prev => prev.filter(x => x.id !== p.id))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700,padding:0}}>✕</button>
                    </div>
                  ))}
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}/>
                  <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}/>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{padding:"5px 12px",borderRadius:6,border:"1px dashed rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.08)",color:"#f59e0b",fontSize:11,fontWeight:600,cursor:uploading?"wait":"pointer",fontFamily:"inherit"}}>
                    🖼 Resim Seç
                  </button>
                  <button onClick={() => camRef.current?.click()} disabled={uploading}
                    style={{padding:"5px 12px",borderRadius:6,border:"1px dashed rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.08)",color:"#f59e0b",fontSize:11,fontWeight:600,cursor:uploading?"wait":"pointer",fontFamily:"inherit"}}>
                    📷 Fotoğraf Çek
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-sec)",marginBottom:6}}>Notlar / Yorumlar</div>
                <textarea value={argeNotes} onChange={e => setArgeNotes(e.target.value)} rows={3} placeholder="Test hakkında detaylı notlar..."
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
              </div>

              {/* Submit */}
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Btn variant="ghost" onClick={() => setArgeModal(null)}>İptal</Btn>
                <Btn variant={argeResult === "olumlu" ? "success" : argeResult === "olumsuz" ? "danger" : "primary"} icon={Check} disabled={!argeResult} onClick={submitArge}>
                  {argeResult === "olumlu" ? "✅ Olumlu Kaydet" : argeResult === "olumsuz" ? "❌ Olumsuz Kaydet" : "Sonuç Seçin"}
                </Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  };

