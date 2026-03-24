// ═══════════════════════════════════════
// Purchasing Page
// ═══════════════════════════════════════
  //  PURCHASING PAGE 
  const PurchasingPage = () => {
    const [prTab, setPrTab] = useState("active"); // "active" | "completed"
    const pending = purchaseRequests.filter(pr => pr.status === "pending");
    const ordered = purchaseRequests.filter(pr => pr.status === "ordered");
    const received = purchaseRequests.filter(pr => pr.status === "received");
    const [prFilterDia, setPrFilterDia] = useState("all");
    const [prFilterGrade, setPrFilterGrade] = useState("all");
    const [showReceivedDetail, setShowReceivedDetail] = useState(false);

    // Unique diameters and grades from received items
    const receivedDiameters = [...new Set(received.map(pr => pr.diameter))].filter(Boolean).sort((a,b) => a - b);
    const receivedGrades = [...new Set(received.map(pr => pr.materialCode))].filter(Boolean).sort();
    const filteredReceived = received.filter(pr => {
      if (prFilterDia !== "all" && pr.diameter !== Number(prFilterDia)) return false;
      if (prFilterGrade !== "all" && pr.materialCode !== prFilterGrade) return false;
      return true;
    });

    const markOrdered = (prId) => {
      updatePurchaseRequest(prId, { status: "ordered", orderedDate: new Date().toISOString() });
    };

    const markReceived = (prId) => {
      const pr = purchaseRequests.find(p => p.id === prId);
      if (!pr) return;
      updatePurchaseRequest(prId, { status: "received", receivedDate: new Date().toISOString() });
      // Add bars to stock — delta
      const bsExist = barStock.find(s => s.diameter === pr.diameter && s.materialCode === pr.materialCode);
      if (bsExist) {
        updateBarStockItem(bsExist.id, { fullBars: bsExist.fullBars + pr.requestedBars });
      } else {
        const emptyRemnants = {};
        REMNANT_RANGES.forEach(r => { emptyRemnants[r.key] = 0; });
        createBarStockItem({ id: `BS-${pr.materialCode}-${pr.diameter}`, diameter: pr.diameter, materialCode: pr.materialCode, fullBars: pr.requestedBars, remnants: emptyRemnants });
      }
      // Update WO item back to pending (ready for cutting)
      const woRecv = workOrders.find(wo => wo.id === pr.woId);
      if (woRecv) {
        const newWoItems = woRecv.items.map(it => {
          if (it.id === pr.itemId && it.woStatus === "pending_stock") return { ...it, woStatus: "pending", purchaseRequestId: null };
          return it;
        });
        updateWorkOrder(pr.woId, { items: newWoItems });
      }
      // Server'dan taze state çek — tüm state'lerin senkron olmasını garantile
      setTimeout(() => forceSync(), 500);
    };

    const PrRow = ({ pr, actions }) => {
      const mc = MATERIAL_CODES.find(m => m.value === pr.materialCode);
      return (
        <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:12,borderRadius:8,
          background:"var(--bg-subtle)",border:"1px solid var(--border)",marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{pr.id}</span>
              <Badge color="#6366f1" bg="rgba(99,102,241,0.15)">{pr.woId}</Badge>
              {mc && <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:mc.color}}>
                <span style={{width:10,height:10,borderRadius:3,background:mc.color,display:"inline-block"}}/>
                {mc.value}
              </span>}
              <span style={{fontSize:12,color:"var(--text-sec)"}}>Ø{pr.diameter}mm</span>
            </div>
            <div style={{fontSize:12,color:"var(--text-sec)",marginTop:4}}>
              {pr.requestedBars} çubuk (330mm) | {pr.requestedQty} adet ürün için | {pr.note}
            </div>
            <div style={{fontSize:11,color:"var(--text-mute)",marginTop:2}}>Talep: {fmtDate(pr.date)}{pr.orderedDate ? ` | Sipariş: ${fmtDate(pr.orderedDate)}` : ""}{pr.receivedDate ? ` | Teslim: ${fmtDate(pr.receivedDate)}` : ""}</div>
          </div>
          <div className="mob-actions" style={{display:"flex",gap:6,marginLeft:12}}>{actions}</div>
        </div>
      );
    };

    return (
      <div>
        <h2 style={{margin:"0 0 16px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>🛒 Satın Alma</h2>
        <div style={{marginBottom:16}}><TabSwitcher tabs={[{key:"active",label:`Aktif (${pending.length+ordered.length})`,icon:ShoppingCart},{key:"completed",label:`Tamamlanan (${received.length})`,icon:Check}]} active={prTab} onChange={setPrTab}/></div>

        {prTab==="active"&&<>
        <Card style={{marginBottom:16}}>
          <h3 style={{margin:"0 0 12px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Bekleyen Talepler ({pending.length})</h3>
          {pending.length === 0 ? <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Talep yok ✓</div> :
            pending.map(pr => <PrRow key={pr.id} pr={pr} actions={
              hasPerm("purchasing_edit") && <Btn variant="primary" size="sm" icon={ShoppingCart} onClick={() => markOrdered(pr.id)}>Sipariş Verildi</Btn>
            }/>)
          }
        </Card>
        <Card style={{marginBottom:16}}>
          <h3 style={{margin:"0 0 12px",color:"#f59e0b",fontSize:15,fontWeight:600}}>Sipariş Verilen ({ordered.length})</h3>
          {ordered.length === 0 ? <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Yok</div> :
            ordered.map(pr => <PrRow key={pr.id} pr={pr} actions={
              hasPerm("purchasing_edit") && <Btn variant="success" size="sm" icon={Check} onClick={() => markReceived(pr.id)}>Stok Geldi</Btn>
            }/>)
          }
        </Card>
        </>}

        {prTab==="completed"&&<Card>
          <div onClick={()=>setShowReceivedDetail(!showReceivedDetail)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <h3 style={{margin:0,color:"#10b981",fontSize:15,fontWeight:600}}>Tamamlanan ({received.length})</h3>
            <span style={{fontSize:16,color:"var(--text-mute)",transition:"transform 0.2s",transform:showReceivedDetail?"rotate(90deg)":"rotate(0deg)"}}>▸</span>
          </div>
          {showReceivedDetail&&<div style={{marginTop:12}}>
            {received.length > 0 && <div className="mob-filter-grid" style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <select value={prFilterDia} onChange={e=>setPrFilterDia(e.target.value)} style={{padding:"6px 10px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}>
                <option value="all">Tüm Çaplar</option>
                {receivedDiameters.map(d => <option key={d} value={d}>Ø{d}mm</option>)}
              </select>
              <select value={prFilterGrade} onChange={e=>setPrFilterGrade(e.target.value)} style={{padding:"6px 10px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}>
                <option value="all">Tüm Kaliteler</option>
                {receivedGrades.map(g => {const mc=MATERIAL_CODES.find(m=>m.value===g); return <option key={g} value={g}>{g}</option>;})}
              </select>
              {(prFilterDia!=="all"||prFilterGrade!=="all")&&<span style={{fontSize:11,color:"var(--text-mute)",alignSelf:"center"}}>{filteredReceived.length}/{received.length} sonuç</span>}
            </div>}
            {filteredReceived.length === 0 ? <div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Yok</div> :
              filteredReceived.map(pr => <PrRow key={pr.id} pr={pr} actions={<Badge color="#10b981" bg="rgba(16,185,129,0.15)">Teslim Alındı ✓</Badge>}/>)
            }
          </div>}
        </Card>}
      </div>
    );
  };

