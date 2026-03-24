// ═══════════════════════════════════════
// Orders Page
// ═══════════════════════════════════════
  //  ORDERS PAGE 
  const OrdersPage = () => {
    const [showNew,setShowNew]=useState(false);
    const [editingOrder,setEditingOrder]=useState(null);
    const [orderType,setOrderType]=useState("production");
    const [currency,setCurrency]=useState("EUR");
    const emptyP={productType:"Std. Freze",toolCode:"",productCode:"",diameter:"",length:"",qty:"",unitPrice:"",coatingType:"",coatingCompanyId:"CK2",materialCode:"BE-1",grinding:false,grindingType:"",isTest:false,estimatedMinutes:"",pdfs:[]};
    const emptyB={diameter:"",islem:"",qty:"",unitPrice:"",coatingType:"",coatingCompanyId:"",isTest:false,estimatedMinutes:"",pdfs:[]};
    const [newOrder,setNewOrder]=useState({customerCode:"",customerName:"",deliveryDate:"",priority:"normal",notes:"",items:[{...emptyP}]});
    const [custSearch,setCustSearch]=useState("");
    const [custDropOpen,setCustDropOpen]=useState(false);
    const resetItems=t=>{setOrderType(t);setNewOrder(p=>({...p,items:[t==="production"?{...emptyP}:{...emptyB}]}));};
    const addItem=()=>setNewOrder(p=>({...p,items:[...p.items,orderType==="production"?{...emptyP}:{...emptyB}]}));
    const removeItem=i=>{if(newOrder.items.length<=1)return;setNewOrder(p=>({...p,items:p.items.filter((_,j)=>j!==i)}));};
    const updateItem=(i,f,v)=>{
      setNewOrder(p=>({...p,items:p.items.map((it,j)=>{
        if(j!==i) return it;
        const upd={...it,[f]:v};
        // Auto-clear coating type when company changes
        if(f==="coatingCompanyId"){
          const types=COATING_TYPES_BY_COMPANY[v]||[];
          if(!types.includes(upd.coatingType)) upd.coatingType=types[0]||"";
        }
        // Toggle grinding type
        if(f==="grinding"&&!v) upd.grindingType="";
        if(f==="grinding"&&v&&!upd.grindingType) upd.grindingType="Kares Taşlama";
        return upd;
      })}));
    };
    const handlePdf=(idx,e)=>{
      const file=e.target.files?.[0]; if(!file) return;
      const reader=new FileReader();
      reader.onload=ev=>{
        const pdf={id:genId(),name:file.name,data:ev.target.result,stage:"Sipariş",date:new Date().toISOString()};
        setNewOrder(p=>({...p,items:p.items.map((it,j)=>j===idx?{...it,pdfs:[...(it.pdfs||[]),pdf]}:it)}));
      };
      reader.readAsDataURL(file);
      e.target.value="";
    };
    const handlePhoto=(idx,e)=>{
      const file=e.target.files?.[0]; if(!file) return;
      const reader=new FileReader();
      reader.onload=ev=>{
        const photo={id:genId(),name:file.name,data:ev.target.result,stage:"Sipariş Foto",date:new Date().toISOString()};
        setNewOrder(p=>({...p,items:p.items.map((it,j)=>j===idx?{...it,pdfs:[...(it.pdfs||[]),photo]}:it)}));
      };
      reader.readAsDataURL(file);
      e.target.value="";
    };
    const curSym=CURRENCIES.find(c=>c.value===currency)?.symbol||"€";
    const orderTotal=newOrder.items.reduce((s,i)=>s+(Number(i.qty||0)*Number(i.unitPrice||0)),0);
    const saveOrder=()=>{
      // Validation
      const errors=[];
      if(!newOrder.customerName.trim()) errors.push("Müşteri seçilmeli");
      if(!newOrder.deliveryDate) errors.push("Termin tarihi girilmeli");
      if(newOrder.deliveryDate && new Date(newOrder.deliveryDate) < new Date(new Date().toDateString())) errors.push("Termin tarihi bugünden önce olamaz");
      newOrder.items.forEach((it,i)=>{
        const n=i+1;
        const qty=Number(it.qty);
        if(!qty||qty<=0) errors.push(`Kalem ${n}: Miktar sıfırdan büyük olmalı`);
        if(qty && !Number.isInteger(qty)) errors.push(`Kalem ${n}: Miktar tam sayı olmalı`);
        if(orderType==="production"){
          if(!it.diameter||Number(it.diameter)<=0) errors.push(`Kalem ${n}: Çap girilmeli`);
          if(!it.length||Number(it.length)<=0) errors.push(`Kalem ${n}: Boy girilmeli`);
        } else {
          if(!it.diameter||Number(it.diameter)<=0) errors.push(`Kalem ${n}: Çap girilmeli`);
          if(!it.islem?.trim()) errors.push(`Kalem ${n}: İşlem seçilmeli`);
        }
        if(it.unitPrice && Number(it.unitPrice)<0) errors.push(`Kalem ${n}: Fiyat negatif olamaz`);
      });
      if(errors.length>0) return alert("⚠️ Lütfen düzeltin:\n\n• "+errors.join("\n• "));
      if(editingOrder) {
        // UPDATE existing order
        const updatedItems=newOrder.items.map((it,idx)=>{
          const existingId=editingOrder.items[idx]?.id || `I${genId()}`;
          if(orderType==="production") return{...it,id:existingId,productCode:`Ø${it.diameter}x${it.length}`,diameter:Number(it.diameter),length:Number(it.length),qty:Number(it.qty),unitPrice:Number(it.unitPrice),estimatedMinutes:Number(it.estimatedMinutes||0)};
          const nc=it.islem?.includes("Kaplama"); return{...it,id:existingId,diameter:Number(it.diameter),qty:Number(it.qty),unitPrice:Number(it.unitPrice),estimatedMinutes:Number(it.estimatedMinutes||0),coatingType:nc?it.coatingType:"",coatingCompanyId:nc?it.coatingCompanyId:""};
        });
        updateOrder(editingOrder.id, {customerCode:newOrder.customerCode,customerName:newOrder.customerName,deliveryDate:newOrder.deliveryDate,priority:newOrder.priority,notes:newOrder.notes,currency,items:updatedItems});
        // Also update related WOs — each WO individually via delta
        workOrders.filter(wo=>wo.orderId===editingOrder.id).forEach(wo=>{
          const updatedWoItems=wo.items.map(woIt=>{
            const updIt=updatedItems.find(i=>i.id===woIt.id);
            if(!updIt) return woIt;
            return{...woIt,qty:updIt.qty,unitPrice:updIt.unitPrice,estimatedMinutes:updIt.estimatedMinutes,coatingType:updIt.coatingType,coatingCompanyId:updIt.coatingCompanyId,isTest:!!updIt.isTest,
              ...(orderType==="production"?{productCode:updIt.productCode,productType:updIt.productType,toolCode:updIt.toolCode,diameter:updIt.diameter,length:updIt.length,materialCode:updIt.materialCode,grinding:updIt.grinding,grindingType:updIt.grindingType}:{diameter:updIt.diameter,islem:updIt.islem})};
          });
          updateWorkOrder(wo.id,{customerCode:newOrder.customerCode,customerName:newOrder.customerName,deliveryDate:newOrder.deliveryDate,priority:newOrder.priority,currency,items:updatedWoItems});
        });
        closeForm();
      } else {
        // CREATE new order
        const order={customerId:newOrder.customerCode||genId(),customerCode:newOrder.customerCode,customerName:newOrder.customerName,date:new Date().toISOString(),deliveryDate:newOrder.deliveryDate,status:"pending",priority:newOrder.priority,notes:newOrder.notes,orderType,currency,
          items:newOrder.items.map(it=>{const id=`I${genId()}`;if(orderType==="production") return{...it,id,productCode:`Ø${it.diameter}x${it.length}`,diameter:Number(it.diameter),length:Number(it.length),qty:Number(it.qty),unitPrice:Number(it.unitPrice),estimatedMinutes:Number(it.estimatedMinutes||0)};
          const nc=it.islem?.includes("Kaplama"); return{...it,id,diameter:Number(it.diameter),qty:Number(it.qty),unitPrice:Number(it.unitPrice),estimatedMinutes:Number(it.estimatedMinutes||0),coatingType:nc?it.coatingType:"",coatingCompanyId:nc?it.coatingCompanyId:""};})
        };
        createOrder(order);closeForm();
      }
    };
    const closeForm=()=>{setShowNew(false);setEditingOrder(null);setNewOrder({customerCode:"",customerName:"",deliveryDate:"",priority:"normal",notes:"",items:[{...emptyP}]});setOrderType("production");setCurrency("EUR");setCustSearch("");};
    const startEdit=(order)=>{
      setEditingOrder(order);
      setOrderType(order.orderType);
      setCurrency(order.currency||"EUR");
      setCustSearch(order.customerName||"");
      setNewOrder({
        customerCode:order.customerCode||"",customerName:order.customerName||"",
        deliveryDate:order.deliveryDate||"",priority:order.priority||"normal",notes:order.notes||"",
        items:order.items.map(it=>order.orderType==="production"?{
          productType:it.productType||"Std. Freze",toolCode:it.toolCode||"",productCode:it.productCode||"",
          diameter:String(it.diameter||""),length:String(it.length||""),qty:String(it.qty||""),
          unitPrice:String(it.unitPrice||""),coatingType:it.coatingType||"",coatingCompanyId:it.coatingCompanyId||"CK2",
          materialCode:it.materialCode||"BE-1",grinding:it.grinding||false,grindingType:it.grindingType||"",
          isTest:!!it.isTest,estimatedMinutes:String(it.estimatedMinutes||""),pdfs:it.pdfs||[]
        }:{
          diameter:String(it.diameter||""),islem:it.islem||"",qty:String(it.qty||""),
          unitPrice:String(it.unitPrice||""),coatingType:it.coatingType||"",coatingCompanyId:it.coatingCompanyId||"",
          isTest:!!it.isTest,estimatedMinutes:String(it.estimatedMinutes||""),pdfs:it.pdfs||[]
        })
      });
      setShowNew(true);
      setModal(null);
    };
    const [filterType,setFilterType]=useState("all");
    const [fCust,setFCust]=useState("");
    const [fPriority,setFPriority]=useState("all");
    const [fDateY,setFDateY]=useState("");
    const [fDateM,setFDateM]=useState("");
    const [fDateD,setFDateD]=useState("");
    const [fStatus,setFStatus]=useState("all");
    const [orderTab,setOrderTab]=useState("active");
    const [fStep,setFStep]=useState("all");
    const [expandedOrders,setExpandedOrders]=useState({});
    const [showFilters,setShowFilters]=useState(false);
    const toggleOrder = id => setExpandedOrders(p=>({...p,[id]:!p[id]}));
    const ORDER_STEPS=[{k:"all",l:"Tümü"},{k:"cutting",l:"Kesim"},{k:"grinding",l:"Taşlama"},{k:"production",l:"Üretim"},{k:"qc",l:"Kalite Kontrol"},{k:"coating",l:"Kaplama"},{k:"shipping",l:"Sevkiyat"},{k:"completed",l:"Tamamlandı"}];
    const filtered=orders.filter(o=>{
      if(orderTab==="active"&&o.status==="completed") return false;
      if(orderTab==="completed"&&o.status!=="completed") return false;
      if(filterType!=="all"&&o.orderType!==filterType) return false;
      if(fCust&&!o.customerName.toLowerCase().includes(fCust.toLowerCase())&&!(o.customerCode||"").toLowerCase().includes(fCust.toLowerCase())) return false;
      if(fPriority!=="all"&&o.priority!==fPriority) return false;
      if(fStatus!=="all"){
        const st=o.status==="completed"?"completed":o.status==="pending"?"pending":"active";
        if(fStatus!==st) return false;
      }
      if(fStep!=="all"){
        const wo=workOrders.find(w=>w.orderId===o.id);
        if(!wo) return fStep==="cutting"; // no WO = still at beginning
        const steps=wo.items.map(i=>i.woStatus);
        const match=fStep==="cutting"?steps.some(s=>["pending","pending_stock","cut"].includes(s))
          :fStep==="grinding"?steps.some(s=>["grinding","grinding_dispatch","grinding_shipped"].includes(s))
          :fStep==="production"?steps.some(s=>["assigned","running"].includes(s))
          :fStep==="completed"?steps.every(s=>s==="completed"||s==="shipping")
          :steps.some(s=>s===fStep||s===fStep+"_ready");
        if(!match) return false;
      }
      if(fDateY){
        const d=new Date(o.date);
        if(String(d.getFullYear())!==fDateY) return false;
        if(fDateM&&String(d.getMonth()+1).padStart(2,"0")!==fDateM) return false;
        if(fDateD&&String(d.getDate()).padStart(2,"0")!==fDateD) return false;
      }
      return true;
    });

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>Siparişler</h2>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="ghost" size="sm" icon={Download} onClick={()=>downloadCSV(`siparisler_${new Date().toISOString().slice(0,10)}`,["Sipariş No","Müşteri Kodu","Müşteri","Tarih","Termin","Öncelik","Durum","Tip","Döviz","Kalem Sayısı","Toplam Adet","Toplam Tutar"],orders.map(o=>[o.id,o.customerCode,o.customerName,fmtDate(o.date),fmtDate(o.deliveryDate),o.priority,o.status,o.orderType,o.currency||"EUR",o.items.length,o.items.reduce((s,i)=>s+(i.qty||0),0),o.items.reduce((s,i)=>s+((i.qty||0)*(i.unitPrice||0)),0).toFixed(2)]))}>CSV</Btn>
            <Btn variant="ghost" size="sm" icon={Filter} onClick={()=>setShowFilters(!showFilters)}>{showFilters?"Filtreleri Gizle":"Filtrele"}</Btn>
            {hasPerm("orders_edit")&&<Btn icon={Plus} onClick={()=>setShowNew(true)}>Yeni Sipariş</Btn>}
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:8,borderBottom:"1px solid var(--border)",paddingBottom:10}}>
          {[{k:"active",l:"🔄 Aktif"},{k:"completed",l:"✓ Tamamlandı"}].map(t=>(
            <Btn key={t.k} variant={orderTab===t.k?"primary":"ghost"} size="sm" onClick={()=>setOrderTab(t.k)}>{t.l}</Btn>
          ))}
          <span style={{marginLeft:"auto",fontSize:12,color:"var(--text-mute)",alignSelf:"center"}}>{orderTab==="active"?orders.filter(o=>o.status!=="completed").length:orders.filter(o=>o.status==="completed").length} sipariş</span>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[{k:"all",l:"Tümü"},{k:"production",l:"Üretim"},{k:"bileme",l:"Bileme"}].map(f=>(
            <Btn key={f.k} variant={filterType===f.k?"primary":"ghost"} size="sm" onClick={()=>setFilterType(f.k)}>{f.l}</Btn>
          ))}
        </div>
        {showFilters&&<Card style={{marginBottom:14}}>
          <div className="mob-filter-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Müşteri</div><input type="text" value={fCust} onChange={e=>setFCust(e.target.value)} placeholder="Müşteri ara..." style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Öncelik</div><select value={fPriority} onChange={e=>setFPriority(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}><option value="all">Tümü</option><option value="urgent">Acil</option><option value="high">Yüksek</option><option value="normal">Normal</option><option value="low">Düşük</option></select></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Durum</div><select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}><option value="all">Tümü</option><option value="pending">Bekliyor</option><option value="active">Aktif</option><option value="completed">Tamamlandı</option></select></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Konum</div><select value={fStep} onChange={e=>setFStep(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}>{ORDER_STEPS.map(s=><option key={s.k} value={s.k}>{s.l}</option>)}</select></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Yıl</div><input type="text" value={fDateY} onChange={e=>setFDateY(e.target.value)} placeholder="2026" maxLength={4} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Ay</div><select value={fDateM} onChange={e=>setFDateM(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-input)",color:"var(--text)",fontSize:12}}><option value="">Tümü</option>{["01","02","03","04","05","06","07","08","09","10","11","12"].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:3}}>Gün</div><input type="text" value={fDateD} onChange={e=>setFDateD(e.target.value)} placeholder="15" maxLength={2} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:12,fontFamily:"inherit"}}/></div>
          </div>
          {(fCust||fPriority!=="all"||fDateY||fDateM||fDateD||fStatus!=="all"||fStep!=="all")&&<div style={{marginTop:8}}><Btn variant="ghost" size="sm" onClick={()=>{setFCust("");setFPriority("all");setFDateY("");setFDateM("");setFDateD("");setFStatus("all");setFStep("all");}}>Filtreleri Temizle</Btn></div>}
        </Card>}
        <Card>
          <div className="tbl-wrap">
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border-h)"}}>
                  {[{k:"_arrow",l:""},"No","Tür","Müşteri","Tarih","Termin","Kalem",canPrice&&"Tutar","Öncelik","Durum","İşlem"].filter(Boolean).map(h=>{
                    const label=typeof h==="object"?h.l:h;const key=typeof h==="object"?h.k:h;
                    return <th key={key} style={{padding:"10px 12px",textAlign:"left",fontSize:11,color:"var(--text-mute)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,width:key==="_arrow"?30:undefined}}>{label}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order=>{
                  const total=order.items.reduce((s,i)=>s+(i.qty*(i.unitPrice||0)),0);
                  const expanded=expandedOrders[order.id];
                  const wo=workOrders.find(w=>w.orderId===order.id);
                  return(
                    <React.Fragment key={order.id}>
                    <tr style={{borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",background:expanded?"rgba(59,130,246,0.04)":"transparent"}} onClick={()=>order.items.length>0&&toggleOrder(order.id)}>
                      <td style={{padding:"10px 8px",fontSize:12,color:"var(--text-mute)",textAlign:"center"}}>{order.items.length>1&&(expanded?<ChevronDown size={14}/>:<ChevronRight size={14}/>)}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"var(--text)",fontWeight:600}}>{order.id}</td>
                      <td style={{padding:"10px 12px"}}><OrderTypeBadge type={order.orderType}/></td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"var(--text-sec)"}}>{order.customerName}{order.customerCode&&<div style={{fontSize:10,color:"#6366f1",fontWeight:600}}>{order.customerCode}</div>}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"var(--text-sec)"}}>{fmtDate(order.date)}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"var(--text-sec)"}}>{fmtDate(order.deliveryDate)}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"var(--text-sec)"}}>{order.items.length}</td>
                      {canPrice&&<td style={{padding:"10px 12px",fontSize:13,color:"#10b981",fontWeight:600}}>{fmtMoney(total,order.currency)}</td>}
                      <td style={{padding:"10px 12px"}}><PriorityBadge priority={order.priority}/></td>
                      <td style={{padding:"10px 12px"}}><StatusBadge status={order.status==="completed"?"completed":order.status==="pending"?"pending":"active"}/></td>
                      <td style={{padding:"10px 12px"}} onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:4}}>
                          <Btn variant="ghost" size="sm" icon={Eye} onClick={()=>setModal({type:"orderDetail",order})}>Detay</Btn>
                          {hasPerm("orders_edit")&&order.status!=="completed"&&<Btn variant="ghost" size="sm" icon={Edit} onClick={()=>startEdit(order)}>Düzenle</Btn>}
                          {order.status==="pending"&&hasPerm("workorders_edit")&&<Btn variant="success" size="sm" icon={ClipboardList} onClick={()=>generateWorkOrder(order)}>İş Emri</Btn>}
                          {hasPerm("orders_edit")&&<Btn variant="danger" size="sm" icon={Trash2} onClick={()=>setConfirmDel({type:"order",id:order.id,label:order.id+" — "+order.customerName})}/>}
                        </div>
                      </td>
                    </tr>
                    {expanded&&order.items.map(item=>{
                      const woItem=wo?.items.find(i=>i.id===item.id);
                      return(
                        <tr key={item.id} style={{borderBottom:"1px solid rgba(255,255,255,0.02)",background:"rgba(255,255,255,0.015)"}}>
                          <td style={{padding:"6px 8px"}}/>
                          <td colSpan={2} style={{padding:"6px 12px",fontSize:12,color:"var(--text)"}}>
                            {order.orderType==="production"?<>{item.toolCode&&<span style={{fontWeight:700,color:"#f59e0b",marginRight:6}}>{item.toolCode}</span>}<span style={{color:"var(--text-sec)"}}>{item.productCode}</span>{item.productType&&<span style={{color:"#6366f1",fontSize:11,marginLeft:4}}>({item.productType})</span>}</>:`Ø${item.diameter}mm ${item.islem||""}`}
                          </td>
                          <td colSpan={2} style={{padding:"6px 12px",fontSize:12}}>
                            {item.coatingType&&<Badge color="#14b8a6" bg="rgba(20,184,166,0.12)">{item.coatingType}</Badge>}
                            {item.materialCode&&<span style={{fontSize:11,color:"var(--text-mute)",marginLeft:6}}>{item.materialCode}</span>}
                          </td>
                          <td style={{padding:"6px 12px",fontSize:12,color:"var(--text-sec)"}}>{item.estimatedMinutes?`${item.estimatedMinutes}dk`:""}</td>
                          <td style={{padding:"6px 12px",fontSize:12,color:"var(--text-sec)"}}>{item.qty} ad</td>
                          {canPrice&&<td style={{padding:"6px 12px",fontSize:12,color:"#10b981"}}>{fmtMoney(item.qty*(item.unitPrice||0),order.currency)}</td>}
                          <td style={{padding:"6px 12px"}}>
                            {woItem&&(()=>{
                              const st=woItem.woStatus;
                              const label=st==="completed"?"✓ Tamamlandı":st==="running"?"🔄 Üretimde":st==="assigned"?"📋 Atandı":st==="pending"?"⏳ Bekliyor":st==="pending_stock"?"📦 Stok Bekleniyor":st==="cut"?"✂️ Kesildi":st==="grinding"?"🔧 Taşlamada":st==="grinding_dispatch"?"🔧 Kares Sevk Bekl.":st==="grinding_shipped"?"📦 Kares'te":st==="qc"?"🔍 Kalite Kontrol":st==="qc_ready"?"✓ KK Tamam":st==="coating"?"🎨 Kaplamada":st==="coating_ready"?"✓ Kaplama Tamam":st==="shipping"?"🚚 Sevkiyatta":st;
                              const color=st==="completed"?"#10b981":st==="running"?"#3b82f6":(st==="assigned"||st==="cut")?"#8b5cf6":(st==="grinding"||st==="grinding_dispatch"||st==="grinding_shipped")?"#d946ef":st==="qc"||st==="qc_ready"?"#14b8a6":"#f59e0b";
                              return <Badge color={color} bg={color+"20"}>{label}</Badge>;
                            })()}
                            {!woItem&&<span style={{fontSize:11,color:"var(--text-mute)"}}>İş emri yok</span>}
                          </td>
                          <td colSpan={2}/>
                        </tr>
                      );
                    })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* NEW ORDER MODAL */}
        {showNew&&(
          <Modal title={editingOrder?`Sipariş Düzenle — ${editingOrder.id}`:"Yeni Sipariş"} onClose={closeForm} width={960}>
            <div style={{marginBottom:18}}>
              {editingOrder?<div style={{padding:"8px 14px",borderRadius:8,background:"var(--bg-hover)",fontSize:13,color:"var(--text-sec)"}}>Tür: <span style={{color:"var(--text)",fontWeight:700}}>{orderType==="production"?"🏭 Üretim":"🔧 Bileme"}</span> <span style={{fontSize:11,color:"var(--text-mute)"}}>(düzenlemede değiştirilemez)</span></div>
              :<TabSwitcher tabs={[{key:"production",label:"Üretim",icon:Factory,color:"#6366f1"},{key:"bileme",label:"Bileme",icon:Wrench,color:"#f59e0b"}]} active={orderType} onChange={resetItems}/>}
            </div>
            <div className="grid-mobile-2" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
              {/* Customer searchable dropdown */}
              <div style={{position:"relative"}}>
                <div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Müşteri</div>
                <input type="text" value={custSearch||newOrder.customerName} placeholder="Müşteri kodu veya adı ara..."
                  onChange={e=>{setCustSearch(e.target.value);setCustDropOpen(true);setNewOrder(p=>({...p,customerCode:"",customerName:e.target.value}));}}
                  onFocus={()=>setCustDropOpen(true)}
                  onBlur={()=>setTimeout(()=>setCustDropOpen(false),200)}
                  style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${newOrder.customerCode?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.12)"}`,background:newOrder.customerCode?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.04)",color:"var(--text)",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                {newOrder.customerCode&&<div style={{fontSize:10,color:"#10b981",marginTop:2,fontWeight:600}}>✓ {newOrder.customerCode}</div>}
                {custDropOpen&&(custSearch||"").length>0&&(()=>{
                  const q=(custSearch||"").toLowerCase();
                  const filtered=CUSTOMERS.filter(c=>c.code.toLowerCase().includes(q)||c.name.toLowerCase().includes(q)).slice(0,10);
                  if(filtered.length===0) return null;
                  return(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,maxHeight:220,overflowY:"auto",background:"var(--bg-input)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,marginTop:2,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
                      {filtered.map(c=>(
                        <div key={c.code} onClick={()=>{setNewOrder(p=>({...p,customerCode:c.code,customerName:c.name}));setCustSearch("");setCustDropOpen(false);}}
                          style={{padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12,color:"var(--text)"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.15)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <span style={{color:"#6366f1",fontWeight:700,marginRight:8}}>{c.code}</span>{c.name}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <Input label="Termin Tarihi" type="date" value={newOrder.deliveryDate} onChange={v=>setNewOrder(p=>({...p,deliveryDate:v}))}/>
              <Input label="Öncelik" value={newOrder.priority} onChange={v=>setNewOrder(p=>({...p,priority:v}))} options={[{value:"urgent",label:"Acil"},{value:"high",label:"Yüksek"},{value:"normal",label:"Normal"},{value:"low",label:"Düşük"}]}/>
              <Input label="Para Birimi" value={currency} onChange={setCurrency} options={CURRENCIES.map(c=>({value:c.value,label:c.label}))}/>
            </div>
            <Input label="Notlar" value={newOrder.notes} onChange={v=>setNewOrder(p=>({...p,notes:v}))} rows={2} placeholder="Sipariş notları..." style={{marginBottom:14}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h4 style={{color:"var(--text)",margin:0}}>{orderType==="production"?"🏭 Üretim Kalemleri":"🔧 Bileme Kalemleri"}</h4>
              {canPrice&&<span style={{fontSize:13,color:"var(--text-mute)"}}>Toplam: <strong style={{color:"#10b981"}}>{curSym}{orderTotal.toFixed(2)}</strong></span>}
            </div>
            {newOrder.items.map((item,idx)=>(
              <div key={idx} style={{padding:14,borderRadius:10,background:"var(--bg-subtle)",border:`1px solid ${orderType==="production"?"rgba(99,102,241,0.15)":"rgba(245,158,11,0.15)"}`,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:orderType==="production"?"#6366f1":"#f59e0b"}}>Kalem #{idx+1}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {canPrice&&item.qty&&item.unitPrice&&<span style={{fontSize:12,color:"#10b981",fontWeight:600}}>{curSym}{(Number(item.qty)*Number(item.unitPrice)).toFixed(2)}</span>}
                    {newOrder.items.length>1&&<button onClick={()=>removeItem(idx)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"#ef4444",fontSize:11,fontWeight:600}}>✕</button>}
                  </div>
                </div>
                {orderType==="production"?(
                  <>
                    <div className="mob-grid-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Ürün Tipi</div>
                        <div style={{display:"flex",gap:4}}>
                          <select value={PRODUCT_TYPES.includes(item.productType)?item.productType:"__custom__"} onChange={e=>{const v=e.target.value;if(v==="__custom__") updateItem(idx,"productType","");else updateItem(idx,"productType",v);}} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}>
                            {PRODUCT_TYPES.map(t=><option key={t} value={t} style={{background:"var(--bg-input)"}}>{t}</option>)}
                            <option value="__custom__" style={{background:"var(--bg-input)"}}>— Diğer (Manuel) —</option>
                          </select>
                          {!PRODUCT_TYPES.includes(item.productType)&&<input value={item.productType} onChange={e=>updateItem(idx,"productType",e.target.value)} placeholder="Ürün tipi yazın..." style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.06)",color:"#f59e0b",fontSize:13,fontFamily:"inherit",outline:"none"}}/>}
                        </div>
                      </div>
                      <Input label="Takım Kodu" value={item.toolCode||""} onChange={v=>updateItem(idx,"toolCode",v)} placeholder="Takım kodunu girin..."/>
                    </div>
                    <div className="grid-mobile-2" style={{display:"grid",gridTemplateColumns:"80px 80px 80px 1fr",gap:10,marginBottom:8}}>
                      <Input label="Çap (mm)" type="number" value={item.diameter} onChange={v=>updateItem(idx,"diameter",v)} placeholder="6"/>
                      <Input label="Boy (mm)" type="number" value={item.length} onChange={v=>updateItem(idx,"length",v)} placeholder="75"/>
                      <Input label="Adet" type="number" value={item.qty} onChange={v=>updateItem(idx,"qty",v)} placeholder="500"/>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Hammadde Kodu</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <select value={item.materialCode} onChange={e=>updateItem(idx,"materialCode",e.target.value)} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}>
                            <option disabled value="__sep1__">── Tam Çubuk ──</option>
                            {materialCodes.map(m=><option key={m.value} value={m.value} style={{background:"var(--bg-input)"}}>{m.label}</option>)}
                            <option disabled value="__sep2__">── Hazır Kesilmiş (P) ──</option>
                            {materialCodes.map(m=>{const pCode=m.value.replace(/^([A-Z]+-)(\d+)$/,"$1P-$2");const pEntry=preCutStock?preCutStock.filter(p=>p.materialCode===pCode):[];const totalQty=pEntry.reduce((s,p)=>s+p.qty,0);return <option key={pCode} value={pCode} style={{background:"var(--bg-input)"}}>{pCode}</option>;})}
                          </select>
                          {(()=>{const mc=materialCodes.find(m=>m.value===item.materialCode);return mc?.color?<div style={{width:14,height:14,borderRadius:4,background:mc.color,border:"1px solid rgba(255,255,255,0.2)",flexShrink:0}}/>:null;})()}
                        </div>
                      </div>
                    </div>
                    {/* ── Stock Status Indicator ── */}
                    {(()=>{
                      const dia=Number(item.diameter); const len=Number(item.length); const qty=Number(item.qty); const mc=item.materialCode;
                      if(!dia||!mc) return null;
                      const isPCode=/^[A-Z]+-P-\d+$/.test(mc);
                      const baseMc=isPCode?mc.replace("-P-","-"):mc;
                      const mcColor=materialCodes.find(m=>m.value===baseMc)?.color||"#94a3b8";
                      if(isPCode){
                        const pEntries=(preCutStock||[]).filter(p=>p.materialCode===mc&&p.diameter===dia);
                        const exactEntry=pEntries.find(p=>p.length===len);
                        const totalQty=pEntries.reduce((s,p)=>s+p.qty,0);
                        const available=exactEntry?exactEntry.qty:0;
                        const sufficient=qty>0&&available>=qty;
                        const statusColor=available===0?"#ef4444":sufficient?"#10b981":"#f59e0b";
                        const statusBg=available===0?"rgba(239,68,68,0.08)":sufficient?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)";
                        const statusBorder=available===0?"rgba(239,68,68,0.2)":sufficient?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.2)";
                        return(<div style={{padding:"8px 12px",borderRadius:8,background:statusBg,border:`1px solid ${statusBorder}`,marginBottom:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:8,height:8,borderRadius:4,background:statusColor}}/>
                            <span style={{fontSize:11,fontWeight:700,color:statusColor}}>{available===0?"Hazır Stok Yok":sufficient?"Hazır Stok Yeterli":"Hazır Stok Yetersiz"}</span>
                          </div>
                          <span style={{fontSize:11,color:"var(--text-sec)"}}><span style={{fontWeight:600,color:mcColor}}>✂ {mc} Ø{dia}mm{len?` ×${len}mm`:""}</span>{" → "}<span style={{fontWeight:700,color:available>0?"var(--text)":"#ef4444"}}>{available}</span> ad{totalQty!==available&&<span style={{color:"var(--text-mute)"}}> (bu çapta toplam {totalQty})</span>}</span>
                        </div>);
                      }
                      const stockEntry=barStock.find(s=>s.diameter===dia&&s.materialCode===mc);
                      const availBars=stockEntry?stockEntry.fullBars:0;
                      const remnants=stockEntry?.remnants||{};
                      const totalRemnants=Object.values(remnants).reduce((a,b)=>a+b,0);
                      const hasCutData=dia&&len&&qty&&len>0;
                      const piecesPerBar=len>0?Math.floor(330/len):0;
                      const barsNeeded=hasCutData&&piecesPerBar>0?Math.ceil(qty/piecesPerBar):0;
                      const sufficient=barsNeeded>0&&availBars>=barsNeeded;
                      const missing=barsNeeded>0?Math.max(0,barsNeeded-availBars):0;
                      const statusColor=!stockEntry?"#ef4444":sufficient?"#10b981":availBars>0?"#f59e0b":"#ef4444";
                      const statusBg=!stockEntry?"rgba(239,68,68,0.08)":sufficient?"rgba(16,185,129,0.08)":availBars>0?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)";
                      const statusBorder=!stockEntry?"rgba(239,68,68,0.2)":sufficient?"rgba(16,185,129,0.2)":availBars>0?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.2)";
                      return(
                        <div style={{padding:"8px 12px",borderRadius:8,background:statusBg,border:`1px solid ${statusBorder}`,marginBottom:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:8,height:8,borderRadius:4,background:statusColor}}/>
                            <span style={{fontSize:11,fontWeight:700,color:statusColor}}>
                              {!stockEntry?"Stokta Yok":sufficient?"Stok Yeterli":availBars>0?"Stok Yetersiz":"Stokta Yok"}
                            </span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,color:"var(--text-sec)"}}>
                              <span style={{fontWeight:600,color:mcColor}}>Ø{dia}mm {mc}</span>
                              {" → "}
                              <span style={{fontWeight:700,color:availBars>0?"var(--text)":"#ef4444"}}>{availBars}</span> çubuk
                              {totalRemnants>0&&<span style={{color:"var(--text-mute)"}}> + {totalRemnants} kırpıntı</span>}
                            </span>
                            {hasCutData&&piecesPerBar>0&&(
                              <span style={{fontSize:11,color:"var(--text-sec)"}}>
                                | Gerekli: <span style={{fontWeight:700,color:statusColor}}>{barsNeeded}</span> çubuk
                                <span style={{color:"var(--text-mute)"}}> ({piecesPerBar} ad/çubuk)</span>
                                {missing>0&&<span style={{fontWeight:700,color:"#ef4444",marginLeft:4}}>⚠ {missing} çubuk eksik!</span>}
                              </span>
                            )}
                            {hasCutData&&piecesPerBar===0&&len>0&&(
                              <span style={{fontSize:11,fontWeight:600,color:"#ef4444"}}>⚠ Ürün boyu çubuk boyundan (330mm) büyük!</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mob-grid-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
                      <Input label="Kaplama Firması" value={item.coatingCompanyId} onChange={v=>updateItem(idx,"coatingCompanyId",v)} options={COATING_COMPANIES_PRODUCTION.map(c=>({value:c.id,label:c.name}))}/>
                      <Input label="Kaplama Türü" value={item.coatingType} onChange={v=>updateItem(idx,"coatingType",v)} options={(COATING_TYPES_BY_COMPANY[item.coatingCompanyId]||[]).map(c=>({value:c,label:c}))}/>
                    </div>
                    <div className="grid-mobile-2" style={{display:"grid",gridTemplateColumns:canPrice?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:8}}>
                      {canPrice&&<Input label={`Birim Fiyat (${curSym})`} type="number" value={item.unitPrice} onChange={v=>updateItem(idx,"unitPrice",v)} placeholder="3.50" step="0.01"/>}
                      <Input label="Tah. Birim Süre (dk)" type="number" value={item.estimatedMinutes} onChange={v=>updateItem(idx,"estimatedMinutes",v)} placeholder="2"/>
                      <div style={{display:"flex",flexDirection:"column"}}>
                        <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Toplam Süre</div>
                        <div style={{padding:"7px 10px",borderRadius:8,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",fontSize:13,fontWeight:700,color:"#3b82f6",height:34,display:"flex",alignItems:"center"}}>
                          {Number(item.qty||0)*Number(item.estimatedMinutes||0)} dk
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:8,flexWrap:"wrap",paddingBottom:2}}>
                        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-sec)",cursor:"pointer"}}><input type="checkbox" checked={!!item.grinding} onChange={e=>updateItem(idx,"grinding",e.target.checked)}/> Taşlama</label>
                        {item.grinding&&(
                          <div style={{display:"flex",gap:4}}>
                            {GRINDING_TYPES.map(gt=>(
                              <button key={gt} onClick={()=>updateItem(idx,"grindingType",gt)} style={{
                                padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",
                                border:`1px solid ${item.grindingType===gt?"rgba(59,130,246,0.5)":"var(--border-strong)"}`,
                                background:item.grindingType===gt?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",
                                color:item.grindingType===gt?"#3b82f6":"#94a3b8",fontFamily:"inherit"
                              }}>{gt}</button>
                            ))}
                          </div>
                        )}
                        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:item.isTest?"#f59e0b":"var(--text-sec)",cursor:"pointer",marginLeft:8}}><input type="checkbox" checked={!!item.isTest} onChange={e=>updateItem(idx,"isTest",e.target.checked)} style={{accentColor:"#f59e0b"}}/> 🧪 Test / ARGE</label>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <Input label="📎 Teknik PDF" accept=".pdf" onFileChange={e=>handlePdf(idx,e)} style={{minWidth:160}}/>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)"}}>📷 Fotoğraf</div><input type="file" accept="image/*" capture="environment" onChange={e=>handlePhoto(idx,e)} style={{fontSize:11,color:"var(--text-sec)"}}/></div>
                      {(item.pdfs||[]).map(pdf=><button key={pdf.id} onClick={()=>pdf.data?.startsWith("data:image")?window.open(pdf.data,"_blank"):setPdfViewer({name:pdf.name,data:pdf.data})} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:600,color:pdf.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)?"#f59e0b":"#3b82f6",background:pdf.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)?"rgba(245,158,11,0.1)":"rgba(59,130,246,0.1)",border:"none",cursor:"pointer"}}><File size={10}/>{pdf.name}</button>)}
                    </div>
                  </>
                ):(
                  <>
                    <div className="grid-mobile-2" style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,marginBottom:8}}>
                      <Input label="Çap (mm)" type="number" value={item.diameter} onChange={v=>updateItem(idx,"diameter",v)} placeholder="6"/>
                      <Input label="Yapılacak İşlem" value={item.islem} onChange={v=>{updateItem(idx,"islem",v);if(!v.includes("Kaplama")){updateItem(idx,"coatingType","");updateItem(idx,"coatingCompanyId","");}else if(!item.coatingType){updateItem(idx,"coatingCompanyId","CK2");updateItem(idx,"coatingType","ALTİN");}}} options={BILEME_ISLEMLERI.map(b=>({value:b,label:b}))}/>
                      <Input label="Adet" type="number" value={item.qty} onChange={v=>updateItem(idx,"qty",v)} placeholder="100"/>
                      <Input label="Tahmini Süre (dk)" type="number" value={item.estimatedMinutes} onChange={v=>updateItem(idx,"estimatedMinutes",v)} placeholder="60"/>
                    </div>
                    <div className="grid-mobile-2" style={{display:"grid",gridTemplateColumns:canPrice?"1fr 1fr 1fr":"1fr 1fr",gap:10,marginBottom:8}}>
                      {canPrice&&<Input label={`Birim Fiyat (${curSym})`} type="number" value={item.unitPrice} onChange={v=>updateItem(idx,"unitPrice",v)} placeholder="2.50" step="0.01"/>}
                      {item.islem?.includes("Kaplama")&&<><Input label="Kaplama Firması" value={item.coatingCompanyId} onChange={v=>{updateItem(idx,"coatingCompanyId",v);const types=COATING_TYPES_BY_COMPANY[v]||[];if(!types.includes(item.coatingType))updateItem(idx,"coatingType",types[0]||"");}} options={COATING_COMPANIES_BILEME.map(c=>({value:c.id,label:c.name}))}/><Input label="Kaplama Türü" value={item.coatingType} onChange={v=>updateItem(idx,"coatingType",v)} options={(COATING_TYPES_BY_COMPANY[item.coatingCompanyId]||COATING_TYPES_BILEME).map(c=>({value:c,label:c}))}/></>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <Input label="📎 Teknik PDF" accept=".pdf" onFileChange={e=>handlePdf(idx,e)} style={{minWidth:160}}/>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{fontSize:10,fontWeight:600,color:"var(--text-sec)"}}>📷 Fotoğraf</div><input type="file" accept="image/*" capture="environment" onChange={e=>handlePhoto(idx,e)} style={{fontSize:11,color:"var(--text-sec)"}}/></div>
                      {(item.pdfs||[]).map(pdf=><button key={pdf.id} onClick={()=>pdf.data?.startsWith("data:image")?window.open(pdf.data,"_blank"):setPdfViewer({name:pdf.name,data:pdf.data})} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:600,color:pdf.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)?"#f59e0b":"#3b82f6",background:pdf.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)?"rgba(245,158,11,0.1)":"rgba(59,130,246,0.1)",border:"none",cursor:"pointer"}}><File size={10}/>{pdf.name}</button>)}
                      <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:item.isTest?"#f59e0b":"var(--text-sec)",cursor:"pointer",marginLeft:8}}><input type="checkbox" checked={!!item.isTest} onChange={e=>updateItem(idx,"isTest",e.target.checked)} style={{accentColor:"#f59e0b"}}/> 🧪 Test / ARGE</label>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:12,alignItems:"center"}}>
              <Btn variant="ghost" size="sm" icon={Plus} onClick={addItem}>Kalem Ekle</Btn>
              {canPrice&&<div style={{flex:1,textAlign:"right"}}><span style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Toplam: <span style={{color:"#10b981"}}>{curSym}{orderTotal.toFixed(2)}</span></span></div>}
            </div>
            <div style={{position:"sticky",bottom:-20,paddingTop:12,paddingBottom:4,marginTop:16,background:"var(--bg-modal)",borderTop:"1px solid var(--border)",display:"flex",gap:10,justifyContent:"flex-end",zIndex:10}}>
              <Btn variant="ghost" onClick={closeForm}>İptal</Btn>
              <Btn icon={Save} onClick={saveOrder} disabled={!newOrder.customerName||!newOrder.deliveryDate||newOrder.items.some(i=>!i.qty)}>Kaydet</Btn>
            </div>
          </Modal>
        )}

        {/* ORDER DETAIL */}
        {modal?.type==="orderDetail"&&(
          <Modal title={`Sipariş — ${modal.order.id}`} onClose={()=>setModal(null)} width={850}>
            <div style={{display:"flex",gap:8,marginBottom:14}}><OrderTypeBadge type={modal.order.orderType}/><PriorityBadge priority={modal.order.priority}/><StatusBadge status={modal.order.status==="completed"?"completed":modal.order.status==="pending"?"pending":"active"}/></div>
            <div className="grid-mobile-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Müşteri</span><div style={{fontSize:14,color:"var(--text)",fontWeight:600}}>{modal.order.customerName}</div>{modal.order.customerCode&&<div style={{fontSize:11,color:"#6366f1",fontWeight:600}}>{modal.order.customerCode}</div>}</div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Sipariş</span><div style={{fontSize:14,color:"var(--text)"}}>{fmtDate(modal.order.date)}</div></div>
              <div><span style={{fontSize:11,color:"var(--text-mute)"}}>Termin</span><div style={{fontSize:14,color:"var(--text)"}}>{fmtDate(modal.order.deliveryDate)}</div></div>
            </div>
            <h4 style={{color:"var(--text)",marginBottom:10}}>Kalemler</h4>
            {modal.order.items.map(item=>{
              const lt=(item.qty||0)*(item.unitPrice||0);
              const cc=[...COATING_COMPANIES_PRODUCTION,...COATING_COMPANIES_BILEME].find(c=>c.id===item.coatingCompanyId);
              return(
                <div key={item.id} style={{padding:14,borderRadius:10,background:"var(--bg-subtle)",border:"1px solid var(--border)",marginBottom:8}}>
                  <div className="mob-card-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      {modal.order.orderType==="production"?<><span style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{item.productCode}</span>{item.productType&&<span style={{fontSize:11,color:"#6366f1",marginLeft:8,padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,0.12)"}}>{item.productType}</span>}{item.toolCode&&<span style={{fontSize:11,color:"#f59e0b",marginLeft:6,fontWeight:600}}>{item.toolCode}</span>}<span style={{fontSize:12,color:"var(--text-mute)",marginLeft:8}}>Ø{item.diameter}x{item.length}</span></>
                      :<><span style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>Ø{item.diameter}mm</span><span style={{fontSize:12,color:"#f59e0b",marginLeft:8}}>{item.islem}</span></>}
                      {item.estimatedMinutes>0&&<span style={{fontSize:11,color:"#3b82f6",marginLeft:8}}>⏱ {item.estimatedMinutes} dk</span>}
                    </div>
                    {canPrice&&<div style={{textAlign:"right"}}><div style={{fontSize:12,color:"var(--text-mute)"}}>{item.qty} ad × {fmtMoney(item.unitPrice,modal.order.currency)}</div><div style={{fontSize:14,fontWeight:700,color:"#10b981"}}>{fmtMoney(lt,modal.order.currency)}</div></div>}
                    {!canPrice&&<span style={{fontSize:13,color:"var(--text-sec)"}}>{item.qty} ad</span>}
                  </div>
                  {Number(item.rejectQty||0)>0&&<div style={{marginTop:6,padding:8,borderRadius:6,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:12}}>
                        <span style={{color:"#ef4444",fontWeight:700}}>🔴 {item.rejectQty} fire</span>
                        <span style={{color:"var(--text-sec)",margin:"0 6px"}}>→</span>
                        <span style={{color:"#10b981",fontWeight:700}}>Teslim: {item.qty-Number(item.rejectQty||0)}</span>
                        <span style={{color:"var(--text-mute)"}}>/{item.qty} ad</span>
                      </div>
                      {item.defectLog&&item.defectLog.length>0&&<span style={{fontSize:10,color:"var(--text-mute)"}}>{item.defectLog.length} kayıt</span>}
                    </div>}
                  <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                    {item.materialCode&&(()=>{const mc=materialCodes.find(m=>m.value===item.materialCode);return mc?<Badge color={mc.color||"#94a3b8"} bg={`${mc.color||"#94a3b8"}22`}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:mc.color,marginRight:4}}></span>{mc.value}</Badge>:item.materialCode?<Badge color="#94a3b8" bg="rgba(148,163,184,0.15)">{item.materialCode}</Badge>:null;})()}
                    {item.coatingType&&<Badge color="#14b8a6" bg="rgba(20,184,166,0.15)">{item.coatingType}</Badge>}
                    {cc&&<span style={{fontSize:11,color:"var(--text-sec)"}}>→ {cc.name}</span>}
                    {item.grinding&&<Badge color="#a855f7" bg="rgba(168,85,247,0.15)">{item.grindingType||"Taşlama"}</Badge>}
                  </div>
                  <div style={{marginTop:8}}>
                    <PdfChips pdfs={item.pdfs||[]} canEdit={hasPerm("orders_edit")} onUpload={f=>addPdfToOrderItem(modal.order.id,item.id,f)}/>
                  </div>
                </div>
              );
            })}
            {canPrice&&<div style={{textAlign:"right",marginTop:12,padding:"12px 0",borderTop:"1px solid var(--border-h)"}}><span style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>Toplam: <span style={{color:"#10b981"}}>{fmtMoney(modal.order.items.reduce((s,i)=>s+(i.qty*(i.unitPrice||0)),0),modal.order.currency)}</span></span></div>}
            {hasPerm("orders_edit")&&<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between"}}>
              {modal.order.status!=="completed"&&<Btn variant="primary" size="sm" icon={Edit} onClick={()=>startEdit(modal.order)}>Düzenle</Btn>}
              <Btn variant="danger" size="sm" icon={Trash2} onClick={()=>setConfirmDel({type:"order",id:modal.order.id,label:modal.order.id+" — "+modal.order.customerName})}>Siparişi Sil</Btn>
            </div>}
          </Modal>
        )}
      </div>
    );
  };



