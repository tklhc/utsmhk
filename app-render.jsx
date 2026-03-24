// ═══════════════════════════════════════
// App Render + Main Layout
// ═══════════════════════════════════════
  const renderPage = () => {
    // Guard: operators can only access their allowed pages
    if(isOperatorRole && !OPERATOR_PAGES.includes(page)) { setPage("dashboard"); return <Dashboard/>; }
    switch(page){
      case "dashboard": return <Dashboard/>;
      case "orders": return <OrdersPage/>;
      case "workorders": return <WorkOrdersPage/>;
      case "cutting": return <CuttingPage/>;
      case "grinding": return <GrindingPage/>;
      case "planning": return <PlanningPage/>;
      case "production": return <ProductionPage/>;
      case "qc": return <QCPage/>;
      case "coating": return <CoatingPage/>;
      case "shipping": return <ShippingPage/>;
      case "invoices": return <InvoicesPage/>;
      case "stock": return <StockPage/>;
      case "purchasing": return <PurchasingPage/>;
      case "arge": return <ArgePage/>;
      case "machines": return <MachinesPage/>;
      case "operators": return <OperatorsPage/>;
      case "usermgmt": return <UserMgmtPage/>;
      case "materialcodes": return <MaterialCodesPage/>;
      default: return <Dashboard/>;
    }
  };

  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100vh",fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"var(--bg-app)",color:"var(--text)",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
        select,input,textarea{font-family:inherit;}
        select option{background:var(--bg-input);color:var(--text);}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
      `}</style>
      {isMobile?<><MobileTopBar/><MobileMenu/></>:<Sidebar/>}
      <div style={{flex:1,overflow:"auto",padding:isMobile?12:24,WebkitOverflowScrolling:"touch"}}>
        {!isMobile&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,padding:"10px 16px",borderRadius:12,background:"var(--bg-subtle)",border:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Search size={16} color="var(--text-mute)"/>
            <input type="text" placeholder="Ara..." style={{background:"transparent",border:"none",color:"var(--text)",fontSize:13,outline:"none",width:200}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"var(--text-mute)"}}>{new Date().toLocaleDateString("tr-TR",{weekday:"short",day:"numeric",month:"long"})}</span>
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:6,background:socketConnected?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${socketConnected?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`}}>
              <div style={{width:6,height:6,borderRadius:3,background:socketConnected?"#10b981":"#ef4444"}}/>
              <span style={{fontSize:10,fontWeight:600,color:socketConnected?"#10b981":"#ef4444"}}>{socketConnected?"Çevrimiçi":"Bağlantı Yok"}</span>
              {onlineUsers.length>1&&<span style={{fontSize:10,color:"var(--text-mute)",marginLeft:2}}>({onlineUsers.length} kişi)</span>}
            </div>
            <NotifBell style={{padding:4}}/>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:8,background:"rgba(59,130,246,0.1)"}}>
              <div style={{width:24,height:24,borderRadius:6,background:"rgba(59,130,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontWeight:700,fontSize:11}}>{currentUser.avatar}</div>
              <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{currentUser.name}</span>
            </div>
            <button onClick={()=>{fetch("/api/logout",{method:"POST",credentials:"same-origin"});setAuthToken(null);setCurrentUser(null);setStateLoaded(false);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4,display:"flex",alignItems:"center"}} title="Çıkış Yap"><LogOut size={16}/></button>
          </div>
        </div>}
        {!socketConnected && stateLoaded && !authToken?.startsWith("offline-") && (
          <div style={{padding:"8px 16px",background:"rgba(239,68,68,0.1)",borderBottom:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
            <div className="spinner" style={{width:14,height:14,borderWidth:2}}/>
            <span style={{fontSize:12,fontWeight:600,color:"#ef4444"}}>Sunucu bağlantısı kesildi — yeniden bağlanılıyor...</span>
          </div>
        )}
        {renderPage()}
      </div>

      <NotifPanel/>

      {/* WORK ORDER DETAIL MODAL — accessible from any page */}
      {woDetail&&(()=>{
        const wo=woDetail;
        const order=orders.find(o=>o.id===wo.orderId);
        const allCC=[...COATING_COMPANIES_PRODUCTION,...COATING_COMPANIES_BILEME];
        return(
          <Modal title={`İş Emri — ${wo.id}`} onClose={()=>setWoDetail(null)} width={900}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
              <OrderTypeBadge type={wo.orderType}/>
              <PriorityBadge priority={wo.priority}/>
              <Badge color="#6366f1" bg="rgba(99,102,241,0.15)">{wo.customerCode||wo.customerName}</Badge>
              <Badge color={wo.currentStep==="completed"?"#10b981":"#3b82f6"} bg={wo.currentStep==="completed"?"rgba(16,185,129,0.15)":"rgba(59,130,246,0.15)"}>{wo.currentStep==="completed"?"Tamamlandı":wo.currentStep}</Badge>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:16}}>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Sipariş No</span><div style={{fontSize:14,color:"var(--text)",fontWeight:600}}>{wo.orderId}</div></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Müşteri</span><div style={{fontSize:14,color:"var(--text)",fontWeight:600}}>{wo.customerCode||wo.customerName}</div></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Oluşturma</span><div style={{fontSize:14,color:"var(--text)"}}>{fmtDate(wo.date)}</div></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Termin</span><div style={{fontSize:14,color:new Date(wo.deliveryDate)<new Date()?"#ef4444":"var(--text)",fontWeight:600}}>{fmtDate(wo.deliveryDate)}</div></div>
            </div>
            <WorkflowProgress currentStep={wo.currentStep} orderType={wo.orderType}/>
            <h4 style={{color:"var(--text)",margin:"16px 0 10px"}}>Kalemler ({isOperatorRole?wo.items.filter(it=>isMyWoItem(it)).length:wo.items.length})</h4>
            {wo.items.filter(item=>isMyWoItem(item)).map(item=>{
              const machine=machines.find(m=>m.id===item.machineId);
              const op=operators.find(o=>o.id===item.operatorId);
              const cc=allCC.find(c=>c.id===item.coatingCompanyId);
              const job=productionJobs.find(j=>j.woId===wo.id&&j.itemId===item.id);
              const elapsed=item.startTime&&item.endTime?Math.floor((new Date(item.endTime)-new Date(item.startTime))/60000):item.startTime?Math.floor((Date.now()-new Date(item.startTime))/60000):0;
              return(
                <div key={item.id} style={{padding:14,borderRadius:10,background:"var(--bg-subtle)",border:"1px solid var(--border)",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{wo.orderType==="production"?item.productCode:`Ø${item.diameter}mm — ${item.islem||""}`}</span>
                        {item.productType&&<span style={{fontSize:11,color:"#6366f1",padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}
                        {item.toolCode&&<span style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>{item.toolCode}</span>}
                        {(Number(item.rejectQty)||0)>0?(
                          <span style={{fontSize:12}}>
                            <span style={{color:"#10b981",fontWeight:700}}>{item.qty-(Number(item.rejectQty)||0)}</span>
                            <span style={{color:"var(--text-mute)"}}>/{item.qty} ad</span>
                            <span style={{color:"#ef4444",fontSize:11,marginLeft:2}}>({item.rejectQty} fire)</span>
                          </span>
                        ):(
                          <span style={{fontSize:12,color:"var(--text-mute)"}}>{item.qty} ad</span>
                        )}
                        {item.estimatedMinutes>0&&<Badge color="#3b82f6" bg="rgba(59,130,246,0.12)">⏱ {item.estimatedMinutes}dk</Badge>}
                        <Badge color={
                          item.woStatus==="completed"?"#10b981":
                          item.woStatus==="running"?"#3b82f6":
                          item.woStatus==="cut"?"#f59e0b":
                          ["grinding","grinding_dispatch","grinding_shipped"].includes(item.woStatus)?"#d946ef":
                          item.woStatus==="pending"?"var(--text-sec)":"#f59e0b"
                        } bg={
                          item.woStatus==="completed"?"rgba(16,185,129,0.15)":
                          item.woStatus==="running"?"rgba(59,130,246,0.15)":
                          item.woStatus==="cut"?"rgba(245,158,11,0.15)":
                          ["grinding","grinding_dispatch","grinding_shipped"].includes(item.woStatus)?"rgba(217,70,239,0.15)":
                          item.woStatus==="pending"?"rgba(148,163,184,0.15)":"rgba(245,158,11,0.15)"
                        }>{item.woStatus==="pending"?"Kesim Bekliyor":item.woStatus==="pending_stock"?"⏳ Stok Bekleniyor":item.woStatus==="cut"?"✂️ Kesildi":item.woStatus==="grinding"?"🔧 Taşlamada (İç)":item.woStatus==="grinding_dispatch"?"🔧 Kares Sevk Bekliyor":item.woStatus==="grinding_shipped"?"📦 Kares'te":item.woStatus}</Badge>
                      </div>
                      {canPrice&&item.unitPrice>0&&<div style={{fontSize:12,color:"#10b981",marginTop:4}}>{fmtMoney(item.unitPrice,wo.currency)}/ad → {fmtMoney(item.qty*item.unitPrice,wo.currency)}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
                    {wo.orderType==="production"&&item.materialCode&&(()=>{const mc=MATERIAL_CODES.find(m=>m.value===item.materialCode);return mc?<Badge color={mc.color||"#94a3b8"} bg={`${mc.color||"#94a3b8"}22`}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:mc.color,marginRight:4}}></span>{mc.value}</Badge>:<Badge color="#94a3b8" bg="rgba(148,163,184,0.1)">{item.materialCode}</Badge>;})()}
                    {item.coatingType&&<Badge color="#14b8a6" bg="rgba(20,184,166,0.15)">{item.coatingType}</Badge>}
                    {cc&&<span style={{fontSize:11,color:"var(--text-sec)"}}>→ {cc.name}</span>}
                    {item.grinding&&<Badge color="#a855f7" bg="rgba(168,85,247,0.15)">{item.grindingType||"Taşlama"}</Badge>}
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                    {machine&&<span style={{fontSize:12,color:"#3b82f6"}}>🖥 {machine.name}</span>}
                    {op&&<span style={{fontSize:12,color:"#10b981"}}>👤 {op.name}</span>}
                    {elapsed>0&&<span style={{fontSize:12,color:"#f59e0b"}}>⏱ Geçen: {elapsed}dk</span>}
                    {(()=>{const{done:d,total:t}=countQc(item.productType,item.qcChecks,wo.orderType);return d>0?<span style={{fontSize:12,color:d===t?"#10b981":"#f59e0b"}}>KK: {d}/{t}</span>:null;})()}
                    {item.laserDone&&<Badge color="#a855f7" bg="rgba(168,85,247,0.12)">Lazer ✓</Badge>}
                    {item.coatingSent&&<Badge color="#14b8a6" bg="rgba(20,184,166,0.12)">{item.coatingReceived?"Kaplama ✓":"Kaplamada"}</Badge>}
                  </div>
                  <div style={{marginTop:6}}><PdfChips pdfs={item.pdfs||[]} canEdit={hasPerm("workorders_edit")} onUpload={f=>addPdfToWoItem(wo.id,item.id,f,item.woStatus==="qc"?"Kalite Kontrol":item.woStatus==="running"||item.woStatus==="assigned"?"Üretim":item.woStatus==="coating_ready"||item.woStatus==="laser"?"Kaplama":item.woStatus==="shipping"?"Sevkiyat":"İş Emri")}/></div>
                </div>
              );
            })}
            {order?.notes&&<div style={{marginTop:12,padding:10,borderRadius:8,background:"var(--bg-card)",fontSize:13,color:"var(--text-sec)"}}>📝 {order.notes}</div>}
            {/* Tarihçe / Log */}
            {wo.log&&wo.log.length>0&&(
              <div style={{marginTop:16}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:8}}>📋 Tarihçe</div>
                <div style={{maxHeight:200,overflowY:"auto",borderRadius:8,border:"1px solid var(--border)"}}>
                  {[...wo.log].reverse().map((entry,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"8px 12px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12,alignItems:"center"}}>
                      <span style={{color:"var(--text-mute)",whiteSpace:"nowrap",minWidth:110}}>{fmtDateTime(entry.ts)}</span>
                      <span style={{color:"#3b82f6",fontWeight:600,minWidth:60}}>{entry.user}</span>
                      <span style={{color:"var(--text)",fontWeight:600}}>{entry.action}</span>
                      {entry.detail&&<span style={{color:"var(--text-sec)"}}>{entry.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasPerm("workorders_edit")&&<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end"}}><Btn variant="danger" size="sm" icon={Trash2} onClick={()=>setConfirmDel({type:"wo",id:wo.id,label:wo.id+" — "+wo.customerName})}>İş Emrini Sil</Btn></div>}
          </Modal>
        );
      })()}

      {/* RESCHEDULE MODAL */}
      {rescheduleModal&&(
        <Modal title="⏰ İş Zamanla / Yeniden Planla" onClose={()=>setRescheduleModal(null)} width={550}>
          <RescheduleForm job={rescheduleModal} machines={machines} workOrders={workOrders} productionJobs={productionJobs} onSave={rescheduleJob} onClear={()=>clearManualSchedule(rescheduleModal.id)}/>
        </Modal>
      )}

      {/* DELETE CONFIRMATION */}
      {confirmDel&&(
        <Modal title="⚠️ Silme Onayı" onClose={()=>setConfirmDel(null)} width={480}>
          <div style={{textAlign:"center",padding:"10px 0 20px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:15,color:"var(--text)",marginBottom:6,fontWeight:600}}>
              {confirmDel.type==="order"?"Sipariş":"İş Emri"} silinecek
            </div>
            <div style={{fontSize:14,color:"#f59e0b",fontWeight:700,marginBottom:8}}>{confirmDel.label}</div>
            {confirmDel.type==="order"&&(()=>{
              const relWOs=workOrders.filter(w=>w.orderId===confirmDel.id);
              const relJobs=productionJobs.filter(j=>relWOs.some(w=>w.id===j.woId));
              return relWOs.length>0?(
                <div style={{fontSize:12,color:"#ef4444",marginBottom:8,padding:8,borderRadius:6,background:"rgba(239,68,68,0.08)"}}>
                  ⚠️ Bu siparişe bağlı <strong>{relWOs.length}</strong> iş emri ve <strong>{relJobs.length}</strong> üretim işi de silinecek!
                </div>
              ):null;
            })()}
            <div style={{fontSize:13,color:"var(--text-sec)",marginBottom:16}}>Bu işlem geri alınamaz.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn variant="ghost" onClick={()=>setConfirmDel(null)}>İptal</Btn>
              <Btn variant="danger" icon={Trash2} onClick={()=>{
                if(confirmDel.type==="order") deleteOrder(confirmDel.id);
                else deleteWorkOrder(confirmDel.id);
              }}>Evet, Sil</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* PDF VIEWER */}
      {pdfViewer&&(
        <Modal title={`📎 ${pdfViewer.name}`} onClose={()=>setPdfViewer(null)} width={900}>
          {pdfViewer.data?(()=>{
            const openPdf=()=>{
              try{
                const byteString=atob(pdfViewer.data.split(",")[1]);
                const mimeString=pdfViewer.data.split(",")[0].split(":")[1].split(";")[0];
                const ab=new ArrayBuffer(byteString.length);
                const ia=new Uint8Array(ab);
                for(let i=0;i<byteString.length;i++) ia[i]=byteString.charCodeAt(i);
                const blob=new Blob([ab],{type:mimeString});
                const url=URL.createObjectURL(blob);
                window.open(url,"_blank");
                setTimeout(()=>URL.revokeObjectURL(url),10000);
              }catch(e){
                window.open(pdfViewer.data,"_blank");
              }
            };
            const downloadPdf=()=>{
              try{
                const a=document.createElement("a");
                a.href=pdfViewer.data;
                a.download=pdfViewer.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }catch(e){}
            };
            return(
              <div>
                <div style={{display:"flex",gap:10,marginBottom:16}}>
                  <Btn variant="primary" icon={Eye} onClick={openPdf}>Yeni Sekmede Aç</Btn>
                  <Btn variant="ghost" icon={Download} onClick={downloadPdf}>İndir</Btn>
                </div>
                <div style={{width:"100%",height:"70vh",borderRadius:8,overflow:"hidden",background:"#fff",position:"relative"}}>
                  <iframe sandbox="allow-same-origin" src={pdfViewer.data} style={{width:"100%",height:"100%",border:"none"}} title={pdfViewer.name}/>
                  <div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center"}}>
                    <span style={{padding:"6px 14px",borderRadius:8,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:12}}>PDF görünmüyorsa "Yeni Sekmede Aç" butonunu kullanın</span>
                  </div>
                </div>
              </div>
            );
          })():<div style={{textAlign:"center",padding:40,color:"var(--text-mute)"}}><File size={40} style={{marginBottom:12}}/><div>PDF verisi bulunamadı.</div></div>}
        </Modal>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("MİHENK Hata:", error, info); }
  render() {
    if (this.state.hasError) {
      return React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", fontFamily: "'DM Sans',sans-serif" } },
        React.createElement("div", { style: { textAlign: "center", padding: 40, maxWidth: 420 } },
          React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "⚠️"),
          React.createElement("h2", { style: { color: "var(--text-h)", marginBottom: 8, fontSize: 20 } }, "Bir Hata Oluştu"),
          React.createElement("p", { style: { color: "var(--text-sec)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 } }, "Uygulama beklenmedik bir hata ile karşılaştı. Sayfayı yenileyerek tekrar deneyebilirsiniz."),
          React.createElement("div", { style: { padding: "10px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, marginBottom: 20, textAlign: "left", wordBreak: "break-word" } }, String(this.state.error)),
          React.createElement("button", { onClick: () => window.location.reload(), style: { padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "Sayfayı Yenile")
        )
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App)));

