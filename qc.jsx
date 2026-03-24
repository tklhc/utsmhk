// ═══════════════════════════════════════
// QC Page + Definitions
// ═══════════════════════════════════════
  // ── Global QC check definitions per product type ──
  const QC_DEFS = {
    "Std. Freze":       [{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrolü"},{k:"faceOk",l:"Alın Kontrolü"},{k:"toolDiaSurfaceOk",l:"Takım Çapı ve Yüzeyi Kontrolü"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri Kontrolü"}],
    "Chatter Free Freze":[{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrolü"},{k:"faceOk",l:"Alın Kontrolü"},{k:"toolDiaSurfaceOk",l:"Takım Çapı ve Yüzeyi Kontrolü"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri Kontrolü"}],
    "Aluminyum Freze":  [{k:"polishOk",l:"Polisaj Kontrol"},{k:"faceOk",l:"Alın Kontrol"},{k:"toolDiaSurfaceOk",l:"Takım Çapı ve Yüzey Kontrol"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri"}],
    "Radyuslu Freze":   [{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrol"},{k:"faceOk",l:"Alın Kontrol"},{k:"radiusOk",l:"Radyus Ölçüsü"},{k:"toolDiaSurfaceOk",l:"Takım Çapı ve Yüzeyi Kontrol"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri"}],
    "Küre Freze":       [{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrol"},{k:"faceOk",l:"Alın Kontrol"},{k:"ballRadiusOk",l:"Küre Radyusu Ölçüsü"},{k:"toolDiaSurfaceOk",l:"Takım Çapı ve Yüzeyi Kontrol"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri"}],
    "Matkap":           [{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrol (±0,1)"},{k:"faceOk",l:"Alın Kontrol"},{k:"backWidthOk",l:"Sırt Yüzey Genişliği Kontrol"}],
    "Havşalı Matkap":   [{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrol"},{k:"stepOk",l:"Kademe Kontrol (Çıkıntı, Kademe Kesme)"},{k:"backWidthOk",l:"Sırt Genişliği Kontrol"},{k:"faceOk",l:"Alın Kontrol"}],
    "Kademeli Matkap":  [{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrol"},{k:"stepOk",l:"Kademe Kontrol (Çıkıntı, Kademe Kesme)"},{k:"backWidthOk",l:"Sırt Genişliği Kontrol"},{k:"faceOk",l:"Alın Kontrol"}],
    "Çok Kademeli Matkap":[{k:"coreDiameterOk",l:"Çekirdek Çapı Kontrol"},{k:"stepOk",l:"Kademe Kontrol (Çıkıntı, Kademe Kesme)"},{k:"backWidthOk",l:"Sırt Genişliği Kontrol"},{k:"faceOk",l:"Alın Kontrol"}],
    "Rayba":            [{k:"coreDiameterOk",l:"Çekirdek Çapı"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri"},{k:"chamferOk",l:"Döküm Pah Kontrolü"}],
    "Konik Rayba":      [{k:"coreDiameterOk",l:"Çekirdek Çapı"},{k:"fluteWidthOk",l:"Yüzey Genişlikleri"},{k:"chamferOk",l:"Döküm Pah Kontrolü"}],
  };
  const QC_BILEME_CHECKS = [{k:"visualOk",l:"Görsel Kontrol"}];
  const QC_DEFAULT_CHECKS = [{k:"dimensionOk",l:"Ölçü Kontrolü"},{k:"surfaceOk",l:"Yüzey Kalitesi"},{k:"runoutOk",l:"Salgı Kontrolü"},{k:"visualOk",l:"Görsel Kontrol"}];
  const getQcChecks = (pt, orderType) => orderType==="bileme" ? QC_BILEME_CHECKS : (QC_DEFS[pt] || QC_DEFAULT_CHECKS);
  const getQcKeys = (pt, orderType) => getQcChecks(pt, orderType).map(c=>c.k);
  const initQcObj = (pt, orderType) => { const obj={}; getQcKeys(pt, orderType).forEach(k=>{obj[k]=false;}); return obj; };
  const countQc = (pt, ch, orderType) => { const keys=getQcKeys(pt, orderType); return {done:keys.filter(k=>(ch||{})[k]).length,total:keys.length}; };

  //  QC 
  const QCPage = () => {
    const allQcItems=workOrders.flatMap(wo=>wo.items.filter(it=>it.woStatus==="qc"&&isMyWoItem(it)).map(it=>({...it,woId:wo.id,customerName:wo.customerName,customerCode:wo.customerCode,orderType:wo.orderType})));
    const [qcSearch, setQcSearch] = useState("");
    const qcItems=allQcItems.filter(it=>{
      if(!qcSearch) return true;
      const s=qcSearch.toLowerCase();
      return [it.productCode,it.customerName,it.customerCode,it.woId,`Ø${it.diameter}`].filter(Boolean).join(" ").toLowerCase().includes(s);
    });
    const [qcDefectModal, setQcDefectModal] = useState(null);
    const [qcDefectQty, setQcDefectQty] = useState("");
    const [qcDefectReason, setQcDefectReason] = useState("");
    const DEFECT_REASONS_QC = ["Çekirdek çapı ölçü dışı","Alın hatası","Takım çapı ölçü dışı","Yüzey hatası","Salgı hatası","Kırık/Çatlak","Diğer"];

    // Use global QC_DEFS, QC_DEFAULT_CHECKS, getQcChecks, getQcKeys
    const getChecks = (pt, ot) => getQcChecks(pt, ot);
    const getCheckKeys = (pt, ot) => getQcKeys(pt, ot);

    const countDone = (item) => {
      const keys=getCheckKeys(item.productType, item.orderType);
      const ch=item.qcChecks||{};
      return {done:keys.filter(k=>ch[k]).length, total:keys.length};
    };
    const allDone = (item) => { const {done,total}=countDone(item); return done===total; };

    const updateCheck = (woId, itemId, key, value) => {
      const wo1=workOrders.find(w=>w.id===woId); if(!wo1) return;
      const newItems1=wo1.items.map(it=>{if(it.id!==itemId)return it;return{...it,qcChecks:{...(it.qcChecks||{}),[key]:value}};});
      updateWorkOrder(woId,{items:newItems1});
    };
    const selectAll = (woId, itemId, pt, ot) => {
      const wo2=workOrders.find(w=>w.id===woId); if(!wo2) return;
      const newItems2=wo2.items.map(it=>{if(it.id!==itemId)return it;const nc={...(it.qcChecks||{})};getCheckKeys(pt,ot).forEach(k=>{nc[k]=true;});
        return {...it,qcChecks:nc};
      });
      updateWorkOrder(woId,{items:newItems2});
    };
    const deselectAll = (woId, itemId, pt, ot) => {
      const wo3=workOrders.find(w=>w.id===woId); if(!wo3) return;
      const newItems3=wo3.items.map(it=>{if(it.id!==itemId)return it;const nc={...(it.qcChecks||{})};getCheckKeys(pt,ot).forEach(k=>{nc[k]=false;});
        return {...it,qcChecks:nc};
      });
      updateWorkOrder(woId,{items:newItems3});
    };

    const toggleExpand = (id) => setExpandedQc(p=>({...p,[id]:!p[id]}));

    return(
      <div>
        <h2 style={{margin:"0 0 16px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>Kalite Kontrol <span style={{fontSize:14,fontWeight:500,color:"var(--text-mute)"}}>({qcItems.length}{allQcItems.length!==qcItems.length?` / ${allQcItems.length}`:""} bekleyen)</span></h2>
        {allQcItems.length>3&&<Card style={{marginBottom:16,padding:14}}>
          <Input label="" value={qcSearch} onChange={setQcSearch} placeholder="Ürün, müşteri, iş emri ara..."/>
        </Card>}
        {qcItems.length===0?<Card style={{textAlign:"center",padding:40}}><CheckCircle2 size={40} color="var(--text-dim)" style={{marginBottom:12}}/><div style={{color:"var(--text-mute)",fontSize:14}}>KK bekleyen ürün yok.</div></Card>
        :qcItems.map(item=>{
          const reject=Number(item.rejectQty)||0;
          const goodQty=(item.qty||0)-reject;
          const {done,total}=countDone(item);
          const isOpen=expandedQc[item.id]||false;
          const checks=getChecks(item.productType, item.orderType);
          const ch=item.qcChecks||{};
          const allOk=allDone(item);
          return(
          <Card key={item.id} style={{marginBottom:10,padding:0,overflow:"hidden"}}>
            {/* Collapsed header — always visible */}
            <div onClick={()=>toggleExpand(item.id)} className="mob-qc-head" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer",background:allOk?"rgba(16,185,129,0.04)":"transparent",borderBottom:isOpen?"1px solid var(--border)":"none"}}>
              <span style={{fontSize:16,color:isOpen?"#60a5fa":"var(--text-mute)",transition:"transform 0.2s",transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>▸</span>
              <OrderTypeBadge type={item.orderType}/>
              {item.toolCode&&<span style={{fontSize:14,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}
              <span style={{fontSize:14,fontWeight:item.toolCode?500:700,color:item.toolCode?"var(--text-sec)":"var(--text)"}}>{item.productCode||`Ø${item.diameter} ${item.islem||""}`}</span>
              {item.productType&&<span style={{fontSize:10,color:"#6366f1",padding:"2px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)",fontWeight:600}}>{item.productType}</span>}
              <span style={{fontSize:12,color:"var(--text-mute)"}}>{item.customerCode||item.customerName}</span>
              <span style={{fontSize:12,color:"var(--text-mute)"}}>{reject>0?<><span style={{color:"#10b981",fontWeight:700}}>{goodQty}</span>/{item.qty}</>:`${item.qty} ad`}</span>
              <button onClick={e=>{e.stopPropagation();const wo=workOrders.find(w=>w.id===item.woId);if(wo)setWoDetail(wo);}} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:11,textDecoration:"underline",fontFamily:"inherit"}}>{item.woId}</button>
              <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,background:allOk?"rgba(16,185,129,0.15)":done>0?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.04)",color:allOk?"#10b981":done>0?"#f59e0b":"var(--text-mute)"}}>{done}/{total}</span>
            </div>

            {/* Expanded content */}
            {isOpen&&(
              <div style={{padding:"12px 16px"}}>
                <div style={{marginBottom:10}}><PdfChips pdfs={item.pdfs||[]} canEdit={hasPerm("qc_edit")} onUpload={f=>addPdfToWoItem(item.woId,item.id,f,"Kalite Kontrol")}/></div>

                {/* Select all / Deselect all */}
                {hasPerm("qc_edit")&&(
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <button onClick={()=>selectAll(item.woId,item.id,item.productType,item.orderType)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.08)",color:"#10b981",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Hepsini Seç</button>
                    <button onClick={()=>deselectAll(item.woId,item.id,item.productType,item.orderType)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-subtle)",color:"var(--text-sec)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✕ Hepsini Kaldır</button>
                  </div>
                )}

                {/* Check items */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:6,marginBottom:12}}>
                  {checks.map(c=>{
                    const isOk=ch[c.k]||false;
                    return(
                      <label key={c.k} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,cursor:hasPerm("qc_edit")?"pointer":"default",background:isOk?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.015)",border:`1px solid ${isOk?"rgba(16,185,129,0.25)":"var(--border)"}`,transition:"all 0.15s"}}>
                        <input type="checkbox" checked={isOk} disabled={!hasPerm("qc_edit")}
                          onChange={e=>updateCheck(item.woId,item.id,c.k,e.target.checked)}
                          style={{accentColor:"#10b981",width:15,height:15,flexShrink:0}}/>
                        <span style={{fontSize:13,fontWeight:isOk?600:500,color:isOk?"#10b981":"var(--text)"}}>{c.l}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mob-actions" style={{display:"flex",gap:8}}>
                  {hasPerm("qc_edit")&&<Btn variant="success" icon={Check} onClick={()=>completeQC(item.woId,item.id,item.qcChecks||{})} disabled={!allOk}>KK Onayla → Lazer</Btn>}
                  {hasPerm("qc_edit")&&<Btn variant="danger" size="sm" icon={AlertTriangle} onClick={()=>{setQcDefectModal({woId:item.woId,itemId:item.id,productCode:item.productCode||`Ø${item.diameter}`,maxQty:goodQty});setQcDefectQty("");setQcDefectReason("");}}>Fire Bildir</Btn>}
                </div>
              </div>
            )}
          </Card>
        );})}
        {qcDefectModal&&(
          <Modal title="🔴 KK Fire Bildirimi" onClose={()=>setQcDefectModal(null)} width={450}>
            <div style={{fontSize:13,color:"var(--text-sec)",marginBottom:14}}>
              <strong style={{color:"var(--text)"}}>{qcDefectModal.productCode}</strong> — Maks: <strong style={{color:"#f59e0b"}}>{qcDefectModal.maxQty} adet</strong>
            </div>
            <div style={{display:"grid",gap:12,marginBottom:16}}>
              <Input label="Fire Adedi" type="number" value={qcDefectQty} onChange={setQcDefectQty} placeholder="Kaç adet?"/>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Sebep</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {DEFECT_REASONS_QC.map(r=>(
                    <button key={r} onClick={()=>setQcDefectReason(r)} style={{
                      padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                      background:qcDefectReason===r?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.04)",
                      border:`1px solid ${qcDefectReason===r?"rgba(239,68,68,0.4)":"var(--border-h)"}`,
                      color:qcDefectReason===r?"#ef4444":"var(--text-sec)"
                    }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setQcDefectModal(null)}>İptal</Btn>
              <Btn variant="danger" icon={AlertTriangle}
                disabled={!qcDefectQty||Number(qcDefectQty)<=0||Number(qcDefectQty)>qcDefectModal.maxQty||!qcDefectReason}
                onClick={()=>{reportDefect(qcDefectModal.woId,qcDefectModal.itemId,Number(qcDefectQty),qcDefectReason,"Kalite Kontrol");setQcDefectModal(null);}}>
                {qcDefectQty?`${qcDefectQty} Adet Fire Kaydet`:"Fire Kaydet"}
              </Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  };

