// ═══════════════════════════════════════
// Production Page
// ═══════════════════════════════════════
  const ProductionPage = () => {
    const allActive=productionJobs.filter(j=>j.status!=="completed"&&isMyJob(j));
    const allDone=productionJobs.filter(j=>j.status==="completed"&&isMyJob(j));
    const [defectModal, setDefectModal] = useState(null);
    const [defectQty, setDefectQty] = useState("");
    const [defectReason, setDefectReason] = useState("");
    const [defectLogModal, setDefectLogModal] = useState(null);
    const [prodSearch, setProdSearch] = useState("");
    const [prodMachine, setProdMachine] = useState("all");
    const [prodStatus, setProdStatus] = useState("all");
    const [prodTab, setProdTab] = useState("active"); // "active" | "done"
    const DEFECT_REASONS = ["Kırıldı","Ölçü dışı","Yüzey hatası","Malzeme hatası","Takım kayması","Operatör hatası","Diğer"];

    const matchJob = (job) => {
      const wo=workOrders.find(w=>w.id===job.woId);const item=wo?.items.find(i=>i.id===job.itemId);
      if(prodSearch){
        const s=prodSearch.toLowerCase();
        const fields=[item?.productCode,wo?.customerName,wo?.customerCode,wo?.id,operators.find(o=>o.id===job.operatorId)?.name].filter(Boolean).join(" ").toLowerCase();
        if(!fields.includes(s)) return false;
      }
      if(prodMachine!=="all"&&job.machineId!==prodMachine) return false;
      if(prodStatus!=="all"&&job.status!==prodStatus) return false;
      return true;
    };
    const active=allActive.filter(matchJob);
    const done=allDone.filter(matchJob);
    return(
      <div>
        <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>Üretim Takip</h2>
          <Btn variant="ghost" size="sm" icon={Download} onClick={()=>downloadCSV(`uretim_${new Date().toISOString().slice(0,10)}`,["İş ID","İE No","Ürün","Müşteri","Makine","Operatör","Durum","Başlangıç","Bitiş","Süre (dk)","Tahmini (dk)"],productionJobs.filter(j=>isMyJob(j)).map(j=>{const wo=workOrders.find(w=>w.id===j.woId);const it=wo?.items.find(i=>i.id===j.itemId);const dur=j.startTime&&j.endTime?Math.floor((new Date(j.endTime)-new Date(j.startTime))/60000):"";return[j.id,j.woId,it?.productCode||"",wo?.customerName||"",machines.find(m=>m.id===j.machineId)?.name||"",operators.find(o=>o.id===j.operatorId)?.name||"",j.status,j.startTime?fmtDateTime(j.startTime):"",j.endTime?fmtDateTime(j.endTime):"",dur,j.estimatedMinutes];}))}>CSV</Btn>
        </div>
        <div style={{marginBottom:16}}><TabSwitcher tabs={[{key:"active",label:`Aktif (${allActive.length})`,icon:Play},{key:"done",label:`Tamamlanan (${allDone.length})`,icon:Check}]} active={prodTab} onChange={setProdTab}/></div>
        <Card style={{marginBottom:16,padding:14}}>
          <div className="mob-filter-grid" style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:10,alignItems:"end"}}>
            <Input label="Ara" value={prodSearch} onChange={setProdSearch} placeholder="Ürün, müşteri, operatör..."/>
            <Input label="Makine" value={prodMachine} onChange={setProdMachine} options={[{value:"all",label:"Tümü"},...machines.filter(m=>m.type==="CNC").map(m=>({value:m.id,label:m.name}))]}/>
            {prodTab==="active"&&<Input label="Durum" value={prodStatus} onChange={setProdStatus} options={[{value:"all",label:"Tümü"},{value:"assigned",label:"Atandı"},{value:"running",label:"Çalışıyor"}]}/>}
          </div>
        </Card>
        {prodTab==="active"&&<Card style={{marginBottom:20}}>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Aktif ({active.length}{allActive.length!==active.length?` / ${allActive.length}`:""})</h3>
          {active.length===0?<div style={{textAlign:"center",padding:30,color:"var(--text-mute)"}}>Aktif üretim yok</div>
          :active.map(job=>{
            const wo=workOrders.find(w=>w.id===job.woId);const item=wo?.items.find(i=>i.id===job.itemId);
            const machine=machines.find(m=>m.id===job.machineId);const op=operators.find(o=>o.id===job.operatorId);
            const elapsed=job.startTime?Math.floor((Date.now()-new Date(job.startTime))/60000):0;
            const reject=Number(item?.rejectQty)||0;
            const goodQty=(item?.qty||0)-reject;
            return(
              <div key={job.id} style={{padding:14,borderRadius:10,marginBottom:10,background:job.status==="running"?"rgba(59,130,246,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${job.status==="running"?"rgba(59,130,246,0.2)":"var(--border)"}`}}>
                <div className="mob-prod-card" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}><OrderTypeBadge type={wo?.orderType}/>{item?.toolCode&&<span style={{fontSize:14,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}<span style={{fontSize:14,fontWeight:item?.toolCode?500:700,color:item?.toolCode?"var(--text-sec)":"var(--text)"}}>{item?.productCode||`Ø${item?.diameter} ${item?.islem||""}`}</span></div>
                    <div style={{fontSize:12,color:"var(--text-sec)",marginTop:3}}>
                      {wo?.customerCode||wo?.customerName} |
                      {reject>0?(
                        <span style={{marginLeft:4}}>
                          <span style={{color:"#10b981",fontWeight:700}}>{goodQty}</span>
                          <span style={{color:"var(--text-mute)"}}>/{item?.qty} ad</span>
                          <span style={{color:"#ef4444",fontWeight:600,marginLeft:4}}>({reject} fire)</span>
                        </span>
                      ):(
                        <span style={{marginLeft:4}}>{item?.qty} ad</span>
                      )}
                      {" | "}<button onClick={()=>wo&&setWoDetail(wo)} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:12,textDecoration:"underline",fontFamily:"inherit"}}>{wo?.id}</button>
                    </div>
                    <div style={{display:"flex",gap:10,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#3b82f6"}}>🖥 {machine?.name}</span>
                      <span style={{fontSize:12,color:"#10b981"}}>👤 {op?.name}</span>
                      <span style={{fontSize:12,color:"var(--text-mute)"}}>Tahmini: {job.estimatedMinutes}dk</span>
                      {job.status==="running"&&<span style={{fontSize:12,color:"#f59e0b"}}>⏱ {elapsed} dk</span>}
                    </div>
                    {reject>0&&<div style={{marginTop:6}}>
                      <button onClick={()=>setDefectLogModal({item,wo})} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"3px 10px",cursor:"pointer",color:"#ef4444",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
                        🔴 {reject} Fire Kaydı — Detay
                      </button>
                    </div>}
                    <div style={{marginTop:6}}><PdfChips pdfs={item?.pdfs||[]} canEdit={hasPerm("production_edit")} onUpload={f=>wo&&addPdfToWoItem(wo.id,item.id,f,"Üretim")}/></div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",flexDirection:"column",alignItems:"flex-end"}}>
                    {hasPerm("production_edit")&&<Btn variant="danger" size="sm" icon={AlertTriangle} onClick={()=>{setDefectModal({woId:wo?.id,itemId:item?.id,productCode:item?.productCode,maxQty:goodQty});setDefectQty("");setDefectReason("");}}>Fire Bildir</Btn>}
                    {hasPerm("planning_edit")&&<Btn variant="ghost" size="sm" icon={Edit} onClick={()=>setRescheduleModal(job)}>Zamanla</Btn>}
                    {job.status==="assigned"&&hasPerm("production_edit")&&<Btn variant="success" size="sm" icon={Play} onClick={()=>startProduction(job.id)}>Başlat</Btn>}
                    {job.status==="running"&&hasPerm("production_edit")&&<Btn variant="danger" size="sm" icon={Square} onClick={()=>stopProduction(job.id)}>Bitir</Btn>}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>}
        {prodTab==="done"&&<Card>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Tamamlanan ({done.length}{allDone.length!==done.length?` / ${allDone.length}`:""})</h3>
          {done.length===0?<div style={{textAlign:"center",padding:30,color:"var(--text-mute)"}}>Tamamlanan üretim yok</div>
          :<div>{done.map(job=>{const wo=workOrders.find(w=>w.id===job.woId);const item=wo?.items.find(i=>i.id===job.itemId);const dur=job.startTime&&job.endTime?Math.floor((new Date(job.endTime)-new Date(job.startTime))/60000):0;const reject=Number(item?.rejectQty)||0;const goodQty=(item?.qty||0)-reject;return(<div key={job.id} style={{padding:10,borderRadius:8,background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.1)",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{wo?.id&&<span style={{color:"#6366f1",marginRight:6}}>{wo.id}</span>}{item?.toolCode&&<span style={{color:"#f59e0b",marginRight:4}}>{item.toolCode}</span>}{item?.productCode||`Ø${item?.diameter} ${item?.islem||""}`} — {wo?.customerCode||wo?.customerName}</span>{reject>0&&<span style={{fontSize:11,color:"#ef4444",marginLeft:8,fontWeight:600}}>({goodQty}/{item?.qty} — {reject} fire)</span>}</div><div style={{display:"flex",gap:8,alignItems:"center"}}>{reject>0&&<button onClick={()=>setDefectLogModal({item,wo})} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:5,padding:"2px 8px",cursor:"pointer",color:"#ef4444",fontSize:10,fontWeight:600,fontFamily:"inherit"}}>Fire Log</button>}<span style={{fontSize:12,color:"#10b981"}}>✓ {dur}dk</span><Badge color="#10b981" bg="rgba(16,185,129,0.15)">Bitti</Badge></div></div>);})}
          </div>}
        </Card>}

        {/* DEFECT REPORT MODAL */}
        {defectModal&&(
          <Modal title="🔴 Fire Bildirimi" onClose={()=>setDefectModal(null)} width={450}>
            <div style={{fontSize:13,color:"var(--text-sec)",marginBottom:14}}>
              <strong style={{color:"var(--text)"}}>{defectModal.productCode}</strong> — Maks. bildirilebilir: <strong style={{color:"#f59e0b"}}>{defectModal.maxQty} adet</strong>
            </div>
            <div style={{display:"grid",gap:12,marginBottom:16}}>
              <Input label="Fire Adedi" type="number" value={defectQty} onChange={setDefectQty} placeholder="Kaç adet?"/>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Sebep</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
                  {DEFECT_REASONS.map(r=>(
                    <button key={r} onClick={()=>setDefectReason(r)} style={{
                      padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                      background:defectReason===r?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.04)",
                      border:`1px solid ${defectReason===r?"rgba(239,68,68,0.4)":"var(--border-h)"}`,
                      color:defectReason===r?"#ef4444":"var(--text-sec)"
                    }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setDefectModal(null)}>İptal</Btn>
              <Btn variant="danger" icon={AlertTriangle}
                disabled={!defectQty||Number(defectQty)<=0||Number(defectQty)>defectModal.maxQty||!defectReason}
                onClick={()=>{reportDefect(defectModal.woId,defectModal.itemId,Number(defectQty),defectReason,"Üretim");setDefectModal(null);}}>
                {defectQty?`${defectQty} Adet Fire Kaydet`:"Fire Kaydet"}
              </Btn>
            </div>
          </Modal>
        )}

        {/* DEFECT LOG MODAL */}
        {defectLogModal&&<Modal title={"Fire Kayıtları — "+(defectLogModal.item?.productCode||"")} onClose={()=>setDefectLogModal(null)} width={550}>
              <div style={{display:"flex",gap:16,marginBottom:16}}>
                <div style={{padding:12,borderRadius:10,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",flex:1,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#ef4444",fontWeight:600}}>Toplam Fire</div>
                  <div style={{fontSize:24,fontWeight:800,color:"#ef4444"}}>{Number(defectLogModal.item?.rejectQty||0)}</div>
                </div>
                <div style={{padding:12,borderRadius:10,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",flex:1,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#10b981",fontWeight:600}}>Sağlam</div>
                  <div style={{fontSize:24,fontWeight:800,color:"#10b981"}}>{(defectLogModal.item?.qty||0)-Number(defectLogModal.item?.rejectQty||0)}</div>
                </div>
                <div style={{padding:12,borderRadius:10,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",flex:1,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#3b82f6",fontWeight:600}}>Sipariş</div>
                  <div style={{fontSize:24,fontWeight:800,color:"#3b82f6"}}>{defectLogModal.item?.qty}</div>
                </div>
              </div>
              {(defectLogModal.item?.defectLog||[]).length===0?<div style={{textAlign:"center",padding:20,color:"var(--text-mute)"}}>Kayıt yok</div>
              :<div>{(defectLogModal.item?.defectLog||[]).map((log,i)=>(
                <div key={i} style={{padding:10,borderRadius:8,background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.1)",marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>-{log.qty} ad</span>
                      <Badge color="#ef4444" bg="rgba(239,68,68,0.12)">{log.reason}</Badge>
                      <Badge color="#6366f1" bg="rgba(99,102,241,0.12)">{log.stage}</Badge>
                    </div>
                    <div style={{fontSize:11,color:"var(--text-mute)"}}>{fmtDateTime(log.date)} — {log.reportedBy}</div>
                  </div>
                </div>
              ))}</div>}
        </Modal>}
      </div>
    );
  };

