// ═══════════════════════════════════════
// Cutting Page
// ═══════════════════════════════════════
  //  CUTTING PAGE 
  const CuttingPage = () => {
    const [cutModal, setCutModal] = useState(null);
    const [cutTab, setCutTab] = useState("pending"); // "pending" | "done"
    const pendingCut = workOrders
      .filter(wo => wo.orderType === "production")
      .flatMap(wo => wo.items.filter(it => it.woStatus === "pending" || it.woStatus === "pending_stock").map(it => ({
        ...it, woId: wo.id, customerName: wo.customerName, customerCode: wo.customerCode, deliveryDate: wo.deliveryDate,
        priority: wo.priority, orderId: wo.orderId, orderType: wo.orderType
      })));
    const pendingBileme = workOrders
      .filter(wo => wo.orderType === "bileme")
      .flatMap(wo => wo.items.filter(it => it.woStatus === "pending").map(it => ({
        ...it, woId: wo.id, customerName: wo.customerName, customerCode: wo.customerCode, deliveryDate: wo.deliveryDate,
        priority: wo.priority, orderId: wo.orderId, orderType: "bileme"
      })));
    const doneCut = workOrders
      .flatMap(wo => wo.items.filter(it => it.woStatus === "cut" || it.cutDate).map(it => ({
        ...it, woId: wo.id, customerName: wo.customerName, customerCode: wo.customerCode, orderType: wo.orderType
      })));

    const handlePartialCut = (item, calc) => {
      // Calculate how many pieces can be made with available full bars + remnants
      const piecesFromRemnants = calc.piecesFromRemnants || 0;
      const piecesFromBars = calc.availableBars * calc.piecesPerBar;
      const partialQty = Math.min(piecesFromRemnants + piecesFromBars, item.qty);
      setCutModal({ item, calc, partial: true, partialQty, fullQty: item.qty, missingQty: item.qty - partialQty });
    };

    const handlePurchaseRequest = (item, calc) => {
      const missingBars = calc.barsNeeded - calc.availableBars;
      const mc = MATERIAL_CODES.find(m => m.value === item.materialCode);
      const pr = {
        id: `ST-${Date.now()}`, date: new Date().toISOString(), status: "pending",
        woId: item.woId, itemId: item.id, productCode: item.productCode,
        diameter: item.diameter, materialCode: item.materialCode, materialColor: mc?.color,
        requestedBars: missingBars, requestedQty: item.qty - (calc.availableBars * calc.piecesPerBar),
        note: `Ø${item.diameter}mm ${item.materialCode} — ${missingBars} çubuk eksik`,
      };
      createPurchaseRequest(pr);
      // Mark item as waiting for stock
      const woPendingStock = workOrders.find(wo => wo.id === item.woId);
      if (woPendingStock) {
        const newItems = woPendingStock.items.map(it => it.id === item.id ? { ...it, woStatus: "pending_stock", purchaseRequestId: pr.id } : it);
        updateWorkOrder(item.woId, { items: newItems });
      }
    };

    const executeCut = (item, barsUsed, remnantLength, cutQty) => {
      performCutting(item.woId, item.id, barsUsed, remnantLength);
      // If partial, update qty on the cut item and create remainder item
      if (cutQty < item.qty) {
        const remainQty = item.qty - cutQty;
        const remainId = `I${genId()}`;
        const woCut = workOrders.find(wo => wo.id === item.woId);
        if (woCut) {
          const cutItem = woCut.items.find(it => it.id === item.id);
          if (cutItem) {
            const newCutItems = [...woCut.items.map(it => it.id === item.id ? { ...it, qty: cutQty } : it),
              { ...cutItem, id: remainId, qty: remainQty, woStatus: "pending_stock", cutDate: null, cutBarsUsed: null, cutRemnant: null }
            ];
            updateWorkOrder(item.woId, { items: newCutItems });
          }
        }
        // Create purchase request for remainder
        const mc = MATERIAL_CODES.find(m => m.value === item.materialCode);
        const barsForRemain = Math.ceil(remainQty / Math.floor(BAR_LENGTH / item.length));
        createPurchaseRequest({
          id: `ST-${Date.now()}`, date: new Date().toISOString(), status: "pending",
          woId: item.woId, itemId: remainId, productCode: item.productCode,
          diameter: item.diameter, materialCode: item.materialCode, materialColor: mc?.color,
          requestedBars: barsForRemain, requestedQty: remainQty,
          note: `Kısmi kesim — kalan ${remainQty} ad için ${barsForRemain} çubuk gerekli`,
        });
      }
    };

    return (
      <div>
        <h2 style={{margin:"0 0 16px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>✂️ Kesim İşlemleri</h2>
        <div style={{marginBottom:16}}><TabSwitcher tabs={[{key:"pending",label:`Kesilecekler (${pendingCut.length+pendingBileme.length})`,icon:Scissors},{key:"done",label:`Tamamlanan (${doneCut.length})`,icon:Check}]} active={cutTab} onChange={setCutTab}/></div>

        {cutTab==="pending"&&<>
        <Card style={{marginBottom:16}}>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Kesilecekler — Üretim ({pendingCut.length})</h3>
          {pendingCut.length === 0 ? (
            <div style={{textAlign:"center",padding:30,color:"var(--text-mute)"}}>Kesim bekleyen iş yok ✓</div>
          ) : pendingCut.map(item => {
            const calc = calculateCutting(item.diameter, item.materialCode, item.length, item.qty);
            const mc = MATERIAL_CODES.find(m => m.value === item.materialCode);
            const isWaiting = item.woStatus === "pending_stock";
            const hasPR = purchaseRequests.some(pr => pr.itemId === item.id && pr.status !== "received");
            return (
              <div key={`${item.woId}-${item.id}`} style={{padding:14,borderRadius:10,marginBottom:10,
                background: isWaiting ? "rgba(245,158,11,0.06)" : calc.sufficient ? "rgba(255,255,255,0.02)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${isWaiting ? "rgba(245,158,11,0.2)" : calc.sufficient ? "var(--border)" : "rgba(239,68,68,0.2)"}`}}>
                <div className="mob-card-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      {item.toolCode&&<span style={{fontSize:14,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}
                      <span className="mob-truncate" style={{fontSize:14,fontWeight:item.toolCode?500:700,color:item.toolCode?"var(--text-sec)":"var(--text)"}}>{item.productCode}</span>
                      {item.productType&&<span style={{fontSize:11,color:"#6366f1",padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                      <Badge color="#6366f1" bg="rgba(99,102,241,0.15)">{item.woId}</Badge>
                      <PriorityBadge priority={item.priority}/>
                      {isWaiting && <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">⏳ Stok Bekleniyor</Badge>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
                      {item.customerCode||item.customerName} | Ø{item.diameter}mm × {item.length}mm | {item.qty} adet | {mc ? <span style={{fontWeight:600,color:mc.color}}>{mc.value}</span> : item.materialCode}
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap",fontSize:12}}>
                      <span style={{color:"#3b82f6"}}>📊 {calc.piecesPerBar} ad/çubuk</span>
                      {calc.remnantPlan.length>0&&<span style={{color:"#a855f7"}}>♻️ Kırpıntıdan: {calc.piecesFromRemnants} ad</span>}
                      <span style={{color:"#f59e0b"}}>📦 Tam çubuk: {calc.barsNeeded}{calc.remnantPlan.length>0&&calc.barsNeeded<calc.barsNeededWithoutRemnants?` (${calc.barsNeededWithoutRemnants-calc.barsNeeded} tasarruf)`:""}</span>
                      <span style={{color: calc.sufficient ? "#10b981" : "#ef4444"}}>
                        🏭 Stok: {calc.availableBars} çubuk {calc.sufficient ? "✓" : `✗ ${calc.barsNeeded - calc.availableBars} eksik`}
                      </span>
                    </div>
                    {calc.remnantPlan.length>0&&(
                      <div style={{marginTop:6,padding:"6px 10px",borderRadius:6,background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.15)",fontSize:11,color:"#a855f7"}}>
                        ♻️ Kırpıntı planı: {calc.remnantPlan.map((rp,i)=><span key={i}>{i>0?" + ":""}{rp.useCount}×{rp.label} ({rp.totalPieces} ad)</span>)}
                        {calc.piecesFromFullBars>0&&<span> + {calc.barsNeeded} tam çubuk ({calc.piecesFromFullBars} ad)</span>}
                      </div>
                    )}
                    <span style={{fontSize:11,color:"var(--text-mute)",marginTop:4,display:"block"}}>Termin: {fmtDate(item.deliveryDate)}</span>
                  </div>
                  <div className="mob-actions" style={{display:"flex",flexDirection:"column",gap:4,marginLeft:12,flexShrink:0}}>
                    {hasPerm("cutting_edit") && calc.sufficient && (
                      <Btn variant="success" size="sm" icon={Scissors} onClick={() => setCutModal({item, calc})}>Kes ({item.qty} ad)</Btn>
                    )}
                    {hasPerm("cutting_edit") && !calc.sufficient && calc.availableBars > 0 && !isWaiting && (
                      <Btn variant="warning" size="sm" icon={Scissors} onClick={() => handlePartialCut(item, calc)}>
                        Kısmi Kes ({Math.min((calc.piecesFromRemnants||0) + calc.availableBars * calc.piecesPerBar, item.qty)} ad)
                      </Btn>
                    )}
                    {hasPerm("cutting_edit") && !calc.sufficient && calc.availableBars === 0 && (calc.piecesFromRemnants||0) > 0 && !isWaiting && (
                      <Btn variant="warning" size="sm" icon={Scissors} onClick={() => handlePartialCut(item, calc)}>
                        Kırpıntıdan Kes ({Math.min(calc.piecesFromRemnants, item.qty)} ad)
                      </Btn>
                    )}
                    {hasPerm("cutting_edit") && !calc.sufficient && !hasPR && (
                      <Btn variant="danger" size="sm" icon={ShoppingCart} onClick={() => handlePurchaseRequest(item, calc)}>
                        Satın Alma Talebi
                      </Btn>
                    )}
                    {hasPR && <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">📋 Talep Oluşturuldu</Badge>}
                    {isWaiting && calc.sufficient && hasPerm("cutting_edit") && (
                      <Btn variant="success" size="sm" icon={Scissors} onClick={() => setCutModal({item, calc})}>Stok Geldi → Kes</Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Bileme Kesim — uç kesimi, stok düşmez */}
        {pendingBileme.length > 0 && (
          <Card style={{marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",color:"#f59e0b",fontSize:15,fontWeight:600}}>🔧 Bileme Kesim — Uç Kesimi ({pendingBileme.length})</h3>
            <div style={{fontSize:11,color:"var(--text-mute)",marginBottom:12,padding:"6px 10px",borderRadius:6,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.1)"}}>
              Bileme siparişlerinde sadece takımın ucu kesilir. Hammadde stoku düşürülmez.
            </div>
            {pendingBileme.map(item => (
              <div key={`${item.woId}-${item.id}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:12,borderRadius:10,background:"rgba(245,158,11,0.04)",border:"1px solid rgba(245,158,11,0.12)",marginBottom:8}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <OrderTypeBadge type="bileme"/>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{item.productCode||`Ø${item.diameter} ${item.islem||""}`}</span>
                    <span style={{fontSize:12,color:"var(--text-mute)"}}>{item.customerCode||item.customerName}</span>
                    <span style={{fontSize:12,color:"var(--text-sec)"}}>{item.qty} adet</span>
                    <PriorityBadge priority={item.priority}/>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                    {item.islem&&<Badge color="#f59e0b" bg="rgba(245,158,11,0.12)">{item.islem}</Badge>}
                    {item.coatingType&&<Badge color="#14b8a6" bg="rgba(20,184,166,0.12)">{item.coatingType}</Badge>}
                    <span style={{fontSize:11,color:"var(--text-mute)"}}>Ø{item.diameter}mm</span>
                  </div>
                </div>
                <Btn variant="warning" icon={Scissors} onClick={()=>performBilemeCutting(item.woId, item.id)}>Uç Kesildi ✂️</Btn>
              </div>
            ))}
          </Card>
        )}
        </>}

        {cutTab==="done"&&<Card>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Kesimi Tamamlanan ({doneCut.length})</h3>
          {doneCut.length === 0 ? (
            <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Henüz kesilen iş yok</div>
          ) : doneCut.map(item => (
            <div key={`${item.woId}-${item.id}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:10,borderRadius:8,background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.1)",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <Check size={14} color="#10b981"/>
                <OrderTypeBadge type={item.orderType}/>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{item.productCode||`Ø${item.diameter} ${item.islem||""}`}</span>
                {item.productType&&<span style={{fontSize:10,color:"#6366f1",padding:"1px 5px",borderRadius:3,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                {item.toolCode&&<span style={{fontSize:10,color:"#f59e0b",fontWeight:600}}>{item.toolCode}</span>}
                <span style={{fontSize:12,color:"var(--text-mute)"}}>{item.customerCode||item.customerName} | Ø{item.diameter}{item.length?`×${item.length}mm`:""} | {item.qty}ad</span>
                {item.cutBarsUsed && <span style={{fontSize:11,color:"#3b82f6"}}>{item.cutBarsUsed} çubuk</span>}
                {item.bilemeCut && <span style={{fontSize:11,color:"#f59e0b"}}>uç kesimi</span>}
              </div>
              <Badge color={["grinding","grinding_dispatch","grinding_shipped"].includes(item.woStatus)?"#d946ef":"#10b981"} bg={["grinding","grinding_dispatch","grinding_shipped"].includes(item.woStatus)?"rgba(217,70,239,0.15)":"rgba(16,185,129,0.15)"}>
                {item.woStatus==="grinding"?"🔧 Taşlamada":item.woStatus==="grinding_dispatch"?"🔧 Kares Sevk Bekl.":item.woStatus==="grinding_shipped"?"📦 Kares'te":"Kesildi ✓"}
              </Badge>
            </div>
          ))}
        </Card>}

        {cutModal && (
          <Modal title={cutModal.partial ? "✂️ Kısmi Kesim" : "✂️ Kesim Onayı"} onClose={() => setCutModal(null)} width={560}>
            {(()=>{
              // Manual override state lives in cutModal itself
              const plan = cutModal.calc;
              const manual = cutModal.manual || null; // {fullBars, remnants:{rangeKey:count}}
              const isManual = !!manual;

              // Effective values (manual or auto)
              const effFullBars = isManual ? (Number(manual.fullBars)||0) : (cutModal.partial ? plan.availableBars : plan.barsNeeded);
              const effRemnantPlan = isManual
                ? Object.entries(manual.remnants||{}).filter(([k,v])=>v>0).map(([rangeKey,useCount])=>{
                    const range=REMNANT_RANGES.find(r=>r.key===rangeKey);
                    const ppr=range?Math.floor(range.min/cutModal.item.length):0;
                    return {rangeKey,label:range?.label||rangeKey,useCount,piecesPerRemnant:ppr,totalPieces:Math.min(useCount*ppr,9999)};
                  })
                : plan.remnantPlan;
              const effPiecesFromRemnants = effRemnantPlan.reduce((s,rp)=>s+rp.totalPieces,0);
              const effPiecesFromBars = effFullBars * plan.piecesPerBar;
              const effTotal = effPiecesFromRemnants + effPiecesFromBars;

              // Usable remnant ranges (for manual editing)
              const entry = barStock.find(s=>s.diameter===cutModal.item.diameter && s.materialCode===cutModal.item.materialCode);
              const allUsableRanges = REMNANT_RANGES.filter(r=>r.min>=cutModal.item.length && (entry?.remnants[r.key]||0)>0);

              const initManual = () => {
                const rm = {};
                plan.remnantPlan.forEach(rp=>{rm[rp.rangeKey]=rp.useCount;});
                setCutModal(p=>({...p, manual:{fullBars: cutModal.partial ? plan.availableBars : plan.barsNeeded, remnants:rm}}));
              };
              const clearManual = () => setCutModal(p=>{const n={...p};delete n.manual;return n;});
              const setManualBars = (v) => setCutModal(p=>({...p, manual:{...p.manual, fullBars:v}}));
              const setManualRemnant = (key,v) => setCutModal(p=>({...p, manual:{...p.manual, remnants:{...p.manual.remnants,[key]:Number(v)||0}}}));

              const lastBarPieces = effPiecesFromBars > 0 ? ((cutModal.item.qty - effPiecesFromRemnants) % plan.piecesPerBar || plan.piecesPerBar) : 0;
              const lastRem = lastBarPieces > 0 ? BAR_LENGTH - (lastBarPieces * cutModal.item.length) : 0;
              const fullRem = plan.fullBarRemnant;

              return(
              <div style={{padding:"8px 0"}}>
                <div style={{padding:14,borderRadius:10,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",marginBottom:16}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{cutModal.item.toolCode&&<span style={{color:"#f59e0b",marginRight:6}}>{cutModal.item.toolCode}</span>}{cutModal.item.productCode}</div>
                  <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
                    {cutModal.item.customerName} | Ø{cutModal.item.diameter}mm × {cutModal.item.length}mm | {cutModal.item.qty} adet | {(()=>{const mc=MATERIAL_CODES.find(m=>m.value===cutModal.item.materialCode);return mc?<span style={{fontWeight:600,color:mc.color}}>{mc.value}</span>:cutModal.item.materialCode;})()}
                  </div>
                </div>

                {cutModal.partial && (
                  <div style={{padding:12,borderRadius:8,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",marginBottom:14}}>
                    <div style={{fontSize:13,color:"#f59e0b",fontWeight:600}}>⚠️ Kısmi Kesim</div>
                    <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
                      Toplam sipariş: <strong style={{color:"var(--text)"}}>{cutModal.fullQty}</strong> adet →
                      Şimdi kesilecek: <strong style={{color:"#10b981"}}>{cutModal.partialQty}</strong> adet |
                      Kalan: <strong style={{color:"#ef4444"}}>{cutModal.missingQty}</strong> adet (stok bekleniyor)
                    </div>
                  </div>
                )}

                {/* Auto plan summary */}
                {!isManual && plan.remnantPlan.length>0&&(
                  <div style={{padding:12,borderRadius:8,background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",marginBottom:14}}>
                    <div style={{fontSize:13,color:"#a855f7",fontWeight:700,marginBottom:6}}>♻️ Sistem Önerisi — Kırpıntı Öncelikli ({plan.piecesFromRemnants} parça)</div>
                    {plan.remnantPlan.map((rp,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,borderBottom:i<plan.remnantPlan.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                        <span style={{color:"var(--text)"}}>{rp.label} kırpıntı × {rp.useCount}</span>
                        <span style={{color:"#a855f7",fontWeight:600}}>{rp.totalPieces} parça</span>
                      </div>
                    ))}
                    {plan.barsNeeded>0&&<div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>+ {plan.barsNeeded} tam çubuk → {plan.piecesFromFullBars} parça</div>}
                  </div>
                )}

                {/* Stats */}
                <div className="grid-mobile-1" style={{display:"grid",gridTemplateColumns:effPiecesFromRemnants>0?"1fr 1fr 1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div style={{padding:12,borderRadius:8,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",textAlign:"center"}}>
                    <div style={{fontSize:11,color:"var(--text-mute)",marginBottom:4}}>Parça / Çubuk</div>
                    <div style={{fontSize:22,fontWeight:800,color:"#3b82f6"}}>{plan.piecesPerBar}</div>
                  </div>
                  {effPiecesFromRemnants>0&&(
                    <div style={{padding:12,borderRadius:8,background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.15)",textAlign:"center"}}>
                      <div style={{fontSize:11,color:"var(--text-mute)",marginBottom:4}}>Kırpıntıdan</div>
                      <div style={{fontSize:22,fontWeight:800,color:"#a855f7"}}>{effPiecesFromRemnants}</div>
                    </div>
                  )}
                  <div style={{padding:12,borderRadius:8,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",textAlign:"center"}}>
                    <div style={{fontSize:11,color:"var(--text-mute)",marginBottom:4}}>Tam Çubuk</div>
                    <div style={{fontSize:22,fontWeight:800,color:"#f59e0b"}}>{effFullBars}</div>
                  </div>
                </div>

                {/* Manuel düzenleme toggle */}
                <div style={{marginBottom:14}}>
                  <button onClick={()=>isManual?clearManual():initManual()} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(245,158,11,0.3)",background:isManual?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.02)",color:isManual?"#f59e0b":"var(--text-sec)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
                    <span style={{fontSize:14}}>{isManual?"✏️":"🔧"}</span>
                    {isManual?"Manuel Düzenleme Açık — sisteme farklı bildirim yapıyorum":"Manuel Düzenleme — farklı kestim"}
                    <span style={{marginLeft:"auto",fontSize:16,transform:isManual?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▾</span>
                  </button>

                  {isManual&&(
                    <div style={{padding:14,borderRadius:"0 0 8px 8px",border:"1px solid rgba(245,158,11,0.2)",borderTop:"none",background:"rgba(245,158,11,0.04)"}}>
                      {/* Full bars */}
                      <div className="mob-form-row" style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:12,color:"var(--text)",fontWeight:600,minWidth:120,flexShrink:0}}>Tam Çubuk Kullandım:</span>
                        <input type="number" min="0" max={plan.availableBars} value={manual.fullBars} onChange={e=>setManualBars(e.target.value)}
                          style={{width:70,padding:"6px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.15)",background:"var(--border)",color:"var(--text)",fontSize:14,fontWeight:700,textAlign:"center",fontFamily:"inherit"}}/>
                        <span style={{fontSize:11,color:"var(--text-mute)"}}>/ {plan.availableBars} mevcut</span>
                      </div>

                      {/* Remnant ranges */}
                      {allUsableRanges.length>0&&(
                        <div>
                          <div style={{fontSize:11,color:"#a855f7",fontWeight:700,marginBottom:6}}>Kırpıntı Kullanımı:</div>
                          {allUsableRanges.map(range=>{
                            const available=entry?.remnants[range.key]||0;
                            const ppr=Math.floor(range.min/cutModal.item.length);
                            const used=manual.remnants?.[range.key]||0;
                            return(
                              <div key={range.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                                <span style={{fontSize:12,color:"var(--text)",minWidth:100}}>{range.label}</span>
                                <input type="number" min="0" max={available} value={used} onChange={e=>setManualRemnant(range.key,e.target.value)}
                                  style={{width:60,padding:"5px 6px",borderRadius:6,border:"1px solid rgba(255,255,255,0.12)",background:"var(--border)",color:"var(--text)",fontSize:13,fontWeight:700,textAlign:"center",fontFamily:"inherit"}}/>
                                <span style={{fontSize:11,color:"var(--text-mute)"}}>/ {available} mevcut ({ppr} ad/kırpıntı)</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {allUsableRanges.length===0&&<div style={{fontSize:11,color:"var(--text-mute)"}}>Bu çap/malzemede kullanılabilir kırpıntı yok.</div>}

                      {/* Summary */}
                      <div style={{marginTop:10,padding:"8px 10px",borderRadius:6,background:"var(--bg-card)",fontSize:12}}>
                        <span style={{color:"var(--text-sec)"}}>Toplam parça: </span>
                        <strong style={{color:effTotal>=cutModal.item.qty?"#10b981":"#ef4444"}}>{effTotal}</strong>
                        <span style={{color:"var(--text-sec)"}}> / {cutModal.item.qty} adet </span>
                        {effTotal<cutModal.item.qty&&<span style={{color:"#ef4444"}}>⚠ {cutModal.item.qty-effTotal} eksik!</span>}
                        {effTotal>cutModal.item.qty&&<span style={{color:"#f59e0b"}}>⚠ {effTotal-cutModal.item.qty} fazla</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remnant info */}
                {effFullBars > 0 && lastRem > 0 && (
                  <div style={{padding:10,borderRadius:8,background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.15)",marginBottom:14}}>
                    <div style={{fontSize:12,color:"#8b5cf6",fontWeight:600}}>
                      ♻️ Son çubuktan kalan: {lastRem}mm → {getRemnantRange(lastRem)?.label || "Hurda"} stok grubuna eklenecek
                    </div>
                    {fullRem > 0 && effFullBars > 1 && (
                      <div style={{fontSize:11,color:"var(--text-sec)",marginTop:4}}>
                        Diğer {effFullBars - 1} çubuktan kalan: {fullRem}mm × {effFullBars - 1} → {getRemnantRange(fullRem)?.label || "Hurda"}
                      </div>
                    )}
                  </div>
                )}

                {/* Stock impact */}
                <div style={{padding:10,borderRadius:8,background:"var(--bg-card)",marginBottom:16}}>
                  <div style={{fontSize:12,color:"var(--text-sec)"}}>
                    {effFullBars > 0 && <>Stoktan <strong style={{color:"#ef4444"}}>{effFullBars}</strong> tam çubuk düşürülecek. Mevcut: <strong style={{color:"var(--text)"}}>{plan.availableBars}</strong> → Kalan: <strong style={{color:(plan.availableBars - effFullBars) < 50 ? "#f59e0b" : "#10b981"}}>{plan.availableBars - effFullBars}</strong></>}
                    {effFullBars === 0 && effPiecesFromRemnants > 0 && <><strong style={{color:"#a855f7"}}>Tam çubuk kullanılmayacak</strong> — tamamı kırpıntılardan.</>}
                    {effRemnantPlan.length>0&&<>{effFullBars>0?" | ":""}{effRemnantPlan.map((rp,i)=><span key={i}>{i>0?", ":""}{rp.useCount}× {rp.label} kırpıntı düşürülecek</span>)}</>}
                  </div>
                </div>

                <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                  <Btn variant="ghost" onClick={() => setCutModal(null)}>İptal</Btn>
                  <Btn variant="success" icon={Scissors} onClick={() => {
                    const finalRemnantPlan = effRemnantPlan.filter(rp=>rp.useCount>0);
                    if (cutModal.partial) {
                      // For partial, recalculate based on manual
                      const actualQty = isManual ? Math.min(effTotal, cutModal.item.qty) : cutModal.partialQty;
                      executeCut(cutModal.item, effFullBars, lastRem, actualQty);
                      // Also deduct remnants manually
                      if (finalRemnantPlan.length>0) {
                        const bsItem=barStock.find(e=>e.diameter===cutModal.item.diameter&&e.materialCode===cutModal.item.materialCode);
                        if(bsItem){
                          const u={...bsItem,remnants:{...bsItem.remnants}};
                          finalRemnantPlan.forEach(rp=>{u.remnants[rp.rangeKey]=Math.max(0,(u.remnants[rp.rangeKey]||0)-rp.useCount);});
                          updateBarStockItem(bsItem.id,{remnants:u.remnants});
                        }
                      }
                    } else {
                      performCutting(cutModal.item.woId, cutModal.item.id, effFullBars, lastRem, null, finalRemnantPlan);
                    }
                    setCutModal(null);
                  }}>{cutModal.partial ? `Kısmi Kes (${isManual?Math.min(effTotal,cutModal.item.qty):cutModal.partialQty} ad)` : "Kesimi Onayla"}</Btn>
                </div>
              </div>
              );
            })()}
          </Modal>
        )}
      </div>
    );
  };

