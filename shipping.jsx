// ═══════════════════════════════════════
// Shipping Page
// ═══════════════════════════════════════
  //  SHIPPING 
  const ShippingPage = () => {
    const allReady=workOrders.filter(wo=>wo.items.some(it=>it.woStatus==="shipping"));
    const [shipSearch, setShipSearch] = useState("");
    const ready=allReady.filter(wo=>{
      if(!shipSearch) return true;
      const s=shipSearch.toLowerCase();
      return [wo.id,wo.customerName,wo.customerCode,...wo.items.map(i=>i.productCode)].filter(Boolean).join(" ").toLowerCase().includes(s);
    });
    return(
      <div>
        <h2 style={{margin:"0 0 16px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>Sevkiyat</h2>
        {allReady.length>3&&<Card style={{marginBottom:16,padding:14}}>
          <Input label="" value={shipSearch} onChange={setShipSearch} placeholder="Müşteri, iş emri, ürün ara..."/>
        </Card>}
        {ready.length===0?<Card style={{textAlign:"center",padding:40}}><Truck size={40} color="var(--text-dim)" style={{marginBottom:12}}/><div style={{color:"var(--text-mute)",fontSize:14}}>{shipSearch?"Sonuç bulunamadı.":"Sevke hazır yok."}</div></Card>
        :ready.map(wo=>(
          <Card key={wo.id} style={{marginBottom:12}}>
            <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>setWoDetail(wo)} style={{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontWeight:700,fontSize:15,textDecoration:"underline",fontFamily:"inherit"}}>{wo.id}</button><OrderTypeBadge type={wo.orderType}/><span style={{fontSize:13,color:"var(--text-mute)"}}>{wo.customerCode||wo.customerName}</span></div><PriorityBadge priority={wo.priority}/></div>
            {wo.items.filter(it=>it.woStatus==="shipping").map(item=>{
              const reject=Number(item.rejectQty)||0;
              const goodQty=(item.qty||0)-reject;
              return(
              <div key={item.id} style={{padding:10,borderRadius:8,background:reject>0?"rgba(245,158,11,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${reject>0?"rgba(245,158,11,0.15)":"var(--border)"}`,marginBottom:5}}>
                <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text)",alignItems:"center"}}>
                  <div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:600}}>{item.productCode||`Ø${item.diameter} ${item.islem||""}`}</span>
                    {reject>0?(
                      <span>
                        <span style={{color:"#f59e0b",fontWeight:700}}>{goodQty}</span>
                        <span style={{color:"var(--text-mute)"}}>/{item.qty} ad</span>
                        <span style={{color:"#ef4444",fontSize:11,marginLeft:4}}>({reject} fire)</span>
                      </span>
                    ):(
                      <span style={{color:"var(--text-sec)"}}>{item.qty} ad</span>
                    )}
                  </div>
                  {reject>0?(
                    <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">⚠ Eksik Teslim</Badge>
                  ):(
                    <Badge color="#10b981" bg="rgba(16,185,129,0.15)">Hazır ✓</Badge>
                  )}
                </div>
                <div style={{marginTop:4}}><PdfChips pdfs={item.pdfs||[]} canEdit={hasPerm("shipping_edit")} onUpload={f=>addPdfToWoItem(wo.id,item.id,f,"Sevkiyat")}/></div>
              </div>
            );})}
            {hasPerm("shipping_edit")&&<div style={{display:"flex",gap:8,marginTop:10}}><Btn variant="success" icon={Truck} onClick={()=>{completeShipping(wo.id);setPage("invoices");}}>Sevk Et & Fatura</Btn></div>}
          </Card>
        ))}
      </div>
    );
  };

