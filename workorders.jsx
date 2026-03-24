// ═══════════════════════════════════════
// Work Orders Page
// ═══════════════════════════════════════
  //  WORK ORDERS 
  const WorkOrdersPage = () => {
    const [woTab,setWoTab]=useState("active"); // "active" | "completed"
    const [wfCust,setWfCust]=useState("");
    const [wfType,setWfType]=useState("all");
    const [wfPriority,setWfPriority]=useState("all");
    const [wfDateY,setWfDateY]=useState("");
    const [wfDateM,setWfDateM]=useState("");
    const [wfDateD,setWfDateD]=useState("");
    const [wfStep,setWfStep]=useState("all");
    const [wfShow,setWfShow]=useState(false);
    const [woSearch,setWoSearch]=useState("");
    const [woSort,setWoSort]=useState("delivery"); // "delivery" | "created" | "customer"
    const [visibleCount,setVisibleCount]=useState(20);
    const WO_STEPS_ACTIVE=[{k:"all",l:"Tümü"},{k:"cutting",l:"Kesim"},{k:"grinding",l:"Taşlama"},{k:"production",l:"Üretim"},{k:"qc",l:"KK"},{k:"laser",l:"Lazer"},{k:"coating",l:"Kaplama"},{k:"shipping",l:"Sevkiyat"}];

    // Reset visible count when filters/tab change
    const switchTab=(t)=>{setWoTab(t);setVisibleCount(20);setWfStep("all");};

    // All WOs filtered by operator
    const baseWO=workOrders.filter(wo=>{
      if(isOperatorRole&&myOperatorId) return wo.items.some(it=>isMyWoItem(it));
      return true;
    });
    const allActive=baseWO.filter(wo=>wo.currentStep!=="completed");
    const allCompleted=baseWO.filter(wo=>wo.currentStep==="completed");

    // Apply filters
    const applyFilters=(list)=>list.filter(wo=>{
      if(woSearch){
        const q=woSearch.toLowerCase();
        const matchId=wo.id.toLowerCase().includes(q);
        const matchCust=wo.customerName.toLowerCase().includes(q)||(wo.customerCode||"").toLowerCase().includes(q);
        const matchProduct=wo.items.some(it=>(it.productCode||"").toLowerCase().includes(q)||(it.toolCode||"").toLowerCase().includes(q));
        if(!matchId&&!matchCust&&!matchProduct) return false;
      }
      if(wfCust&&!wo.customerName.toLowerCase().includes(wfCust.toLowerCase())&&!(wo.customerCode||"").toLowerCase().includes(wfCust.toLowerCase())) return false;
      if(wfType!=="all"&&wo.orderType!==wfType) return false;
      if(wfPriority!=="all"&&wo.priority!==wfPriority) return false;
      if(woTab==="active"&&wfStep!=="all"){
        const steps=wo.items.map(i=>i.woStatus);
        const match=wfStep==="cutting"?steps.some(s=>["pending","pending_stock","cut"].includes(s))
          :wfStep==="grinding"?steps.some(s=>["grinding","grinding_dispatch","grinding_shipped"].includes(s))
          :wfStep==="production"?steps.some(s=>["assigned","running"].includes(s))
          :steps.some(s=>s===wfStep||s===wfStep+"_ready");
        if(!match) return false;
      }
      if(wfDateY){
        const d=new Date(wo.deliveryDate);
        if(String(d.getFullYear())!==wfDateY) return false;
        if(wfDateM&&String(d.getMonth()+1).padStart(2,"0")!==wfDateM) return false;
        if(wfDateD&&String(d.getDate()).padStart(2,"0")!==wfDateD) return false;
      }
      return true;
    });

    const sortWO=(list)=>{
      const sorted=[...list];
      if(woSort==="delivery") sorted.sort((a,b)=>new Date(a.deliveryDate)-new Date(b.deliveryDate));
      else if(woSort==="created") sorted.sort((a,b)=>new Date(b.date)-new Date(a.date));
      else if(woSort==="customer") sorted.sort((a,b)=>a.customerName.localeCompare(b.customerName));
      // Urgent & high priority always on top for active tab
      if(woTab==="active"){
        const prio={urgent:0,high:1,normal:2,low:3};
        sorted.sort((a,b)=>(prio[a.priority]||2)-(prio[b.priority]||2));
      }
      return sorted;
    };

    const currentList=woTab==="active"?allActive:allCompleted;
    const filtered=sortWO(applyFilters(currentList));
    const visible=filtered.slice(0,visibleCount);
    const hasMore=filtered.length>visibleCount;

    // Quick stats for active tab
    const activeStats=useMemo(()=>{
      const items=allActive.flatMap(wo=>wo.items);
      return {
        cutting:items.filter(i=>["pending","pending_stock"].includes(i.woStatus)).length,
        grinding:items.filter(i=>["grinding","grinding_dispatch","grinding_shipped"].includes(i.woStatus)).length,
        production:items.filter(i=>["assigned","running"].includes(i.woStatus)).length,
        qc:items.filter(i=>i.woStatus==="qc").length,
        coating:items.filter(i=>["coating_ready","laser"].includes(i.woStatus)).length,
        overdue:allActive.filter(wo=>new Date(wo.deliveryDate)<new Date()).length,
      };
    },[allActive]);

    const renderWoCard=(wo)=>{
      const isComp=wo.currentStep==="completed";
      const myItems=wo.items.filter(item=>isMyWoItem(item));
      const statuses=myItems.map(i=>i.woStatus);
      const reject=myItems.reduce((s,i)=>s+(Number(i.rejectQty)||0),0);
      const totalQty=myItems.reduce((s,i)=>s+(i.qty||0),0);
      const mainStatus=statuses[0]||"pending";
      const STEP_LABELS={pending:"Kesim Bekl.",pending_stock:"Stok Bekl.",cut:"Kesildi",grinding:"Taşlamada",grinding_dispatch:"Taş. Sevk",grinding_shipped:"Kares'te",assigned:"Atandı",running:"Üretimde",qc:"KK",laser:"Lazer",coating_ready:"Kaplama Haz.",coating:"Kaplamada",shipping:"Sevkiyat",completed:"Bitti"};
      const STEP_COLORS={pending:"#f59e0b",pending_stock:"#ef4444",cut:"#8b5cf6",grinding:"#d946ef",grinding_dispatch:"#d946ef",grinding_shipped:"#d946ef",assigned:"#f59e0b",running:"#3b82f6",qc:"#14b8a6",laser:"#a855f7",coating_ready:"#14b8a6",coating:"#06b6d4",shipping:"#f97316",completed:"#10b981"};
      const sc=STEP_COLORS[mainStatus]||"#94a3b8";
      return(
        <div key={wo.id} onClick={()=>setWoDetail(wo)} style={{padding:"12px 16px",borderRadius:10,marginBottom:6,background:"var(--bg-card)",border:`1px solid var(--border)`,borderLeft:`3px solid ${sc}`,cursor:"pointer",transition:"background 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
          onMouseLeave={e=>e.currentTarget.style.background="var(--bg-card)"}>
          <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",flex:1,minWidth:0}}>
              <span style={{fontWeight:700,fontSize:14,color:"#6366f1"}}>{wo.id}</span>
              <OrderTypeBadge type={wo.orderType}/>
              <span style={{fontSize:12,color:"var(--text-sec)",fontWeight:500}}>{wo.customerCode||wo.customerName}</span>
              <PriorityBadge priority={wo.priority}/>
              {!isComp&&new Date(wo.deliveryDate)<new Date()&&<Badge color="#ef4444" bg="rgba(239,68,68,0.15)">⏰ Gecikmiş</Badge>}
              <span style={{fontSize:12,color:"var(--text-mute)"}}>— {myItems.length} kalem, {totalQty} ad</span>
              {reject>0&&<span style={{fontSize:11,color:"#ef4444",fontWeight:600}}>({reject} fire)</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:700,color:sc,background:`${sc}18`}}>{STEP_LABELS[mainStatus]||mainStatus}</span>
              <span style={{fontSize:12,color:new Date(wo.deliveryDate)<new Date()&&!isComp?"#ef4444":"var(--text-mute)"}}>{fmtDate(wo.deliveryDate)}</span>
              {hasPerm("workorders_edit")&&<span onClick={e=>{e.stopPropagation();setConfirmDel({type:"wo",id:wo.id,label:wo.id+" — "+wo.customerName});}} style={{cursor:"pointer",color:"var(--text-dim)",fontSize:14}}>🗑</span>}
            </div>
          </div>
        </div>
      );
    };

    return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>İş Emirleri</h2>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="ghost" size="sm" icon={Download} onClick={()=>downloadCSV(`is_emirleri_${new Date().toISOString().slice(0,10)}`,["İE No","Sipariş No","Müşteri Kodu","Müşteri","Termin","Tip","Öncelik","Kalem ID","Ürün","Çap","Adet","Durum","Fire","Makine","Operatör"],workOrders.flatMap(wo=>wo.items.map(it=>[wo.id,wo.orderId,wo.customerCode,wo.customerName,fmtDate(wo.deliveryDate),wo.orderType,wo.priority,it.id,it.productCode||`Ø${it.diameter}`,it.diameter,it.qty,it.woStatus,it.rejectQty||0,machines.find(m=>m.id===it.machineId)?.name||"",operators.find(o=>o.id===it.operatorId)?.name||""])))}>CSV</Btn>
          <Btn variant="ghost" size="sm" icon={Filter} onClick={()=>setWfShow(!wfShow)}>{wfShow?"Gizle":"Filtrele"}</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,borderRadius:10,overflow:"hidden",border:"1px solid var(--border-h)"}}>
        <button onClick={()=>switchTab("active")} style={{flex:1,padding:"12px 0",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,background:woTab==="active"?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.02)",color:woTab==="active"?"#60a5fa":"#64748b",borderBottom:woTab==="active"?"2px solid #3b82f6":"2px solid transparent",transition:"all 0.15s"}}>
          📋 Aktif İşler <span style={{fontWeight:800,marginLeft:4}}>{allActive.length}</span>
        </button>
        <button onClick={()=>switchTab("completed")} style={{flex:1,padding:"12px 0",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,background:woTab==="completed"?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.02)",color:woTab==="completed"?"#10b981":"#64748b",borderBottom:woTab==="completed"?"2px solid #10b981":"2px solid transparent",transition:"all 0.15s"}}>
          ✅ Tamamlanan <span style={{fontWeight:800,marginLeft:4}}>{allCompleted.length}</span>
        </button>
      </div>

      {/* Quick stats — only on active tab */}
      {woTab==="active"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:16}}>
        {[
          {l:"Kesim",v:activeStats.cutting,c:"#f59e0b",f:"cutting"},
          {l:"Taşlama",v:activeStats.grinding,c:"#d946ef",f:"grinding"},
          {l:"Üretim",v:activeStats.production,c:"#3b82f6",f:"production"},
          {l:"KK",v:activeStats.qc,c:"#6366f1",f:"qc"},
          {l:"Kaplama",v:activeStats.coating,c:"#14b8a6",f:"coating"},
          {l:"Gecikmiş",v:activeStats.overdue,c:"#ef4444",f:null},
        ].map(s=>(
          <div key={s.l} onClick={()=>{if(s.f){setWfStep(s.f);setWfShow(true);}}} style={{padding:"10px 12px",borderRadius:8,background:`${s.c}0a`,border:`1px solid ${s.c}22`,cursor:s.f?"pointer":"default",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:s.v>0?s.c:"var(--text-dim)"}}>{s.v}</div>
            <div style={{fontSize:10,color:"var(--text-sec)",fontWeight:600}}>{s.l}</div>
          </div>
        ))}
      </div>}

      {/* Search + Sort bar */}
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <input type="text" value={woSearch} onChange={e=>{setWoSearch(e.target.value);setVisibleCount(20);}} placeholder="İş emri no, müşteri veya ürün kodu ara..." style={{width:"100%",padding:"8px 12px 8px 32px",borderRadius:8,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"var(--text-mute)"}}>🔍</span>
        </div>
        <select value={woSort} onChange={e=>setWoSort(e.target.value)} style={{padding:"8px 10px",borderRadius:8,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}>
          <option value="delivery">Termine Göre</option>
          <option value="created">Yeniden Eskiye</option>
          <option value="customer">Müşteriye Göre</option>
        </select>
      </div>

      {/* Advanced filters */}
      {wfShow&&<Card style={{marginBottom:14}}>
        <div className="mob-filter-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
          <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Müşteri</div><input type="text" value={wfCust} onChange={e=>setWfCust(e.target.value)} placeholder="Müşteri ara..." style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/></div>
          <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Tür</div><select value={wfType} onChange={e=>setWfType(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}><option value="all">Tümü</option><option value="production">Üretim</option><option value="bileme">Bileme</option></select></div>
          <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Öncelik</div><select value={wfPriority} onChange={e=>setWfPriority(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}><option value="all">Tümü</option><option value="urgent">Acil</option><option value="high">Yüksek</option><option value="normal">Normal</option><option value="low">Düşük</option></select></div>
          {woTab==="active"&&<div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Konum</div><select value={wfStep} onChange={e=>setWfStep(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}>{WO_STEPS_ACTIVE.map(s=><option key={s.k} value={s.k}>{s.l}</option>)}</select></div>}
          <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Yıl</div><input type="text" value={wfDateY} onChange={e=>setWfDateY(e.target.value)} placeholder="2026" maxLength={4} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/></div>
          <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Ay</div><select value={wfDateM} onChange={e=>setWfDateM(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}><option value="">Tümü</option>{["01","02","03","04","05","06","07","08","09","10","11","12"].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        {(wfCust||wfType!=="all"||wfPriority!=="all"||wfStep!=="all"||wfDateY)&&<div style={{marginTop:8}}><Btn variant="ghost" size="sm" onClick={()=>{setWfCust("");setWfType("all");setWfPriority("all");setWfStep("all");setWfDateY("");setWfDateM("");setWfDateD("");}}>Filtreleri Temizle</Btn></div>}
      </Card>}

      {/* Results info */}
      {(woSearch||wfCust||wfType!=="all"||wfPriority!=="all"||wfStep!=="all"||wfDateY)&&(
        <div style={{fontSize:12,color:"var(--text-mute)",marginBottom:10}}>
          {filtered.length} sonuç {woSearch&&<span>— "<strong style={{color:"var(--text)"}}>{woSearch}</strong>"</span>}
        </div>
      )}

      {/* List */}
      {visible.length===0?(
        <Card style={{textAlign:"center",padding:40}}>
          <ClipboardList size={40} color="var(--text-dim)" style={{marginBottom:12}}/>
          <div style={{color:"var(--text-mute)",fontSize:14}}>{woTab==="completed"?"Tamamlanan iş emri yok.":"Eşleşen aktif iş emri yok."}</div>
        </Card>
      ):visible.map(wo=>renderWoCard(wo))}

      {/* Load more */}
      {hasMore&&(
        <div style={{textAlign:"center",padding:16}}>
          <Btn variant="ghost" onClick={()=>setVisibleCount(c=>c+20)}>
            Daha Fazla Göster ({filtered.length-visibleCount} kalan)
          </Btn>
        </div>
      )}

      {modal?.type==="assign"&&<Modal title="Makine & Operatör Atama" onClose={()=>setModal(null)} width={500}><AssignForm woId={modal.woId} itemId={modal.itemId} estMin={modal.estMin} machines={machines} operators={operators} productionJobs={productionJobs} onAssign={(m,o,e)=>{assignToMachine(modal.woId,modal.itemId,m,o,e);setModal(null);}}/></Modal>}
    </div>
  );

  };  // ← close WorkOrdersPage

