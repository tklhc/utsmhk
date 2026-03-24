// ═══════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════
  //  DASHBOARD 
  const Dashboard = () => (
    <div>
      {isOperatorRole?(
        <>
        <h2 style={{margin:"0 0 20px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>Hoş Geldin, {currentUser?.name}</h2>
        {!myOperator&&<Card style={{padding:16,marginBottom:16,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)"}}><div style={{fontSize:13,color:"#ef4444",fontWeight:600}}>⚠ Operatör eşleşmesi bulunamadı. Kullanıcı adınız ({currentUser?.name}) ile operatör listesindeki isim aynı olmalıdır. Yöneticinize bildirin.</div></Card>}
        <div className="mob-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
          {[
            {l:"Atanan İşlerim",v:stats.myAssigned,i:Clock,c:"#f59e0b"},
            {l:"Çalışıyorum",v:stats.myRunning,i:Play,c:"#3b82f6"},
            {l:"KK Bekleyen",v:stats.myQc,i:CheckCircle2,c:"#d946ef"},
            {l:"Tamamlanan",v:stats.myDone,i:Check,c:"#10b981"},
          ].map((s,i)=>(
            <Card key={i} style={{display:"flex",alignItems:"center",gap:14,padding:16,cursor:"pointer"}} onClick={()=>s.l==="KK Bekleyen"?setPage("qc"):setPage("production")}>
              <div style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:`${s.c}22`,color:s.c}}><s.i size={20}/></div>
              <div><div style={{fontSize:22,fontWeight:700,color:"var(--text-h)",lineHeight:1.1}}>{s.v}</div><div style={{fontSize:11,color:"var(--text-sec)"}}>{s.l}</div></div>
            </Card>
          ))}
        </div>
        <Card>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Aktif İşlerim</h3>
          {productionJobs.filter(j=>j.status!=="completed"&&isMyJob(j)).length===0?<div style={{textAlign:"center",padding:30,color:"var(--text-mute)",fontSize:13}}>Şu an atanmış aktif işiniz yok.</div>
          :productionJobs.filter(j=>j.status!=="completed"&&isMyJob(j)).map(job=>{
            const wo=workOrders.find(w=>w.id===job.woId);const item=wo?.items.find(i=>i.id===job.itemId);
            const machine=machines.find(m=>m.id===job.machineId);
            const elapsed=job.startTime?Math.floor((Date.now()-new Date(job.startTime))/60000):0;
            return(
              <div key={job.id} style={{padding:12,borderRadius:10,marginBottom:8,background:job.status==="running"?"rgba(59,130,246,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${job.status==="running"?"rgba(59,130,246,0.2)":"var(--border)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{item?.toolCode&&<span style={{color:"#f59e0b",marginRight:4}}>{item.toolCode}</span>}{item?.productCode||`Ø${item?.diameter} ${item?.islem||""}`}</span>
                    <span style={{fontSize:12,color:"var(--text-mute)",marginLeft:8}}>{wo?.customerCode||wo?.customerName}</span>
                    <span style={{fontSize:12,color:"var(--text-sec)",marginLeft:8}}>🖥️ {machine?.name}</span>
                  </div>
                  <Badge color={job.status==="running"?"#3b82f6":"#f59e0b"} bg={job.status==="running"?"rgba(59,130,246,0.15)":"rgba(245,158,11,0.15)"}>{job.status==="running"?`${elapsed} dk`:"Başlatılmadı"}</Badge>
                </div>
              </div>
            );
          })}
        </Card>
        </>
      ):(
        <>
        <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>Üretim Paneli</h2>
          <div style={{display:"flex",gap:6}}>
            <Btn variant="ghost" size="sm" icon={Download} onClick={()=>{
              const d=new Date().toISOString().slice(0,10);
              // 1- Sipariş Özeti
              downloadCSV(`siparisler_${d}`,
                ["Sipariş No","Müşteri Kodu","Müşteri","Tarih","Termin","Öncelik","Durum","Tip","Kalem Sayısı","Toplam Adet"],
                orders.map(o=>[o.id,o.customerCode,o.customerName,fmtDate(o.date),fmtDate(o.deliveryDate),o.priority,o.status,o.orderType,o.items.length,o.items.reduce((s,i)=>s+(i.qty||0),0)])
              );
              // 2- İş Emirleri
              setTimeout(()=>downloadCSV(`is_emirleri_${d}`,
                ["İE No","Sipariş No","Müşteri Kodu","Müşteri","Termin","Tip","Kalem","Ürün","Çap","Adet","Durum","Fire","Makine","Operatör"],
                workOrders.flatMap(wo=>wo.items.map(it=>[wo.id,wo.orderId,wo.customerCode,wo.customerName,fmtDate(wo.deliveryDate),wo.orderType,it.id,it.productCode||`Ø${it.diameter}`,it.diameter,it.qty,it.woStatus,it.rejectQty||0,machines.find(m=>m.id===it.machineId)?.name||"",operators.find(o=>o.id===it.operatorId)?.name||""]))
              ),100);
              // 3- Makine Verimlilik
              setTimeout(()=>downloadCSV(`makine_verimlilik_${d}`,
                ["Makine","Aktif İş","Biten İş","Toplam İş","Toplam Süre (dk)"],
                stats.machineUtil.map(m=>[m.name,m.active,m.done,m.totalJobs,m.totalMin])
              ),200);
              // 4- Operatör Performans
              setTimeout(()=>downloadCSV(`operator_performans_${d}`,
                ["Operatör","Biten İş","Ort. Süre (dk)","Toplam Süre (dk)","Fire Adet"],
                stats.operatorPerf.map(op=>[op.name,op.completed,op.avgMin,op.totalMin,op.rejects])
              ),300);
              // 5- Müşteri Dağılımı
              setTimeout(()=>downloadCSV(`musteri_dagilim_${d}`,
                ["Müşteri Kodu","Müşteri","Sipariş Sayısı","Kalem Sayısı","Tamamlanan"],
                stats.topCustomers.map(c=>[c.code,c.name,c.orders,c.items,c.completed])
              ),400);
            }}>Tümünü Dışa Aktar</Btn>
          </div>
        </div>

        {/* ROW 1: Key reporting metrics */}
        <div className="mob-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20}}>
          {[
            {l:"Toplam Sipariş",v:stats.total,i:Package,c:"#6366f1"},
            {l:"Aktif",v:stats.active,i:Play,c:"#3b82f6",s:`${stats.running} makine çalışıyor`},
            {l:"Bekleyen",v:stats.pending,i:Clock,c:"#94a3b8"},
            {l:"Bu Ay Tamamlanan",v:stats.completedThisMonth,i:Check,c:"#10b981",s:`${stats.completedWosThisMonth} iş emri`},
            {l:"Ort. Üretim Süresi",v:stats.avgProdMin>0?`${stats.avgProdMin}dk`:"—",i:Clock,c:"#8b5cf6"},
            {l:"Fire Oranı",v:`%${stats.defectRate}`,i:AlertTriangle,c:Number(stats.defectRate)>5?"#ef4444":Number(stats.defectRate)>2?"#f59e0b":"#10b981",s:`${stats.totalReject}/${stats.totalProduced} ad`},
          ].map((s,i)=>(
            <Card key={i} style={{display:"flex",alignItems:"center",gap:14,padding:16}}>
              <div style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:`${s.c}22`,color:s.c}}><s.i size={20}/></div>
              <div><div style={{fontSize:22,fontWeight:700,color:"var(--text-h)",lineHeight:1.1}}>{s.v}</div><div style={{fontSize:11,color:"var(--text-sec)"}}>{s.l}</div>{s.s&&<div style={{fontSize:10,color:s.c}}>{s.s}</div>}</div>
            </Card>
          ))}
        </div>

        {/* ROW 2: Quick counts */}
        <div className="mob-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
          {[
            {l:"Üretim",v:stats.production,c:"#6366f1"},{l:"Bileme",v:stats.bileme,c:"#f59e0b"},
            {l:"Kesim Bekleyen",v:stats.cuttingPending,c:"#ef4444"},{l:"Taşlamada",v:stats.grindingPending,c:"#d946ef"},
            {l:"Kaplamada",v:stats.coatingPending,c:"#14b8a6"},{l:"Satın Alma",v:stats.purchasePending,c:"#f97316"},
          ].map((s,i)=>(
            <div key={i} style={{padding:"12px 16px",borderRadius:10,background:"var(--bg-subtle)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:12,color:"var(--text-sec)"}}>{s.l}</span>
              <span style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>

        {/* ROW 2b: Invoice Stats */}
        {hasPerm("invoices_view") && invoices.length > 0 && (() => {
          const draftInv = invoices.filter(i=>i.status==="draft").length;
          const sentInv = invoices.filter(i=>i.status==="sent").length;
          const paidInv = invoices.filter(i=>i.status==="paid").length;
          const totalRevenue = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.grandTotal||0),0);
          const pendingRevenue = invoices.filter(i=>i.status==="sent").reduce((s,i)=>s+(i.grandTotal||0),0);
          const thisMonth = new Date().toISOString().slice(0,7);
          const monthlyInv = invoices.filter(i=>i.createdAt?.startsWith(thisMonth)).length;
          return (
            <Card style={{marginBottom:20,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>💰 Fatura Özeti</h3>
                <button onClick={()=>setPage("invoices")} style={{background:"rgba(59,130,246,0.1)",border:"none",borderRadius:6,padding:"4px 10px",color:"#3b82f6",cursor:"pointer",fontSize:11,fontWeight:600}}>Tümünü Gör →</button>
              </div>
              <div className="mob-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
                {[
                  {l:"Taslak",v:draftInv,c:"#94a3b8"},
                  {l:"Gönderilen",v:sentInv,c:"#3b82f6"},
                  {l:"Ödenen",v:paidInv,c:"#10b981"},
                  {l:"Bu Ay",v:monthlyInv,c:"#8b5cf6"},
                  {l:"Bekleyen Gelir",v:pendingRevenue>0?`${pendingRevenue.toLocaleString("tr-TR",{maximumFractionDigits:0})}`:"—",c:"#f59e0b"},
                  {l:"Toplam Gelir",v:totalRevenue>0?`${totalRevenue.toLocaleString("tr-TR",{maximumFractionDigits:0})}`:"—",c:"#10b981"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 14px",borderRadius:10,background:"var(--bg-subtle)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setPage("invoices")}>
                    <span style={{fontSize:12,color:"var(--text-sec)"}}>{s.l}</span>
                    <span style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

        {/* ROW 3: Stage distribution + Machine utilization */}
        <div className="grid-mobile-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>📊 Aşama Dağılımı</h3>
              {stats.stageDist.length>0&&<button onClick={()=>downloadCSV(`asama_dagilim_${new Date().toISOString().slice(0,10)}`,["Aşama","Adet"],stats.stageDist.map(s=>[s.label,s.count]))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4}} title="CSV İndir"><Download size={14}/></button>}
            </div>
            {stats.stageDist.length===0?<div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Veri yok</div>:
            <div>
              {(()=>{
                const maxCount=Math.max(...stats.stageDist.map(s=>s.count),1);
                return stats.stageDist.map(s=>(
                  <div key={s.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:11,color:"var(--text-sec)",minWidth:100,textAlign:"right"}}>{s.label}</span>
                    <div style={{flex:1,height:20,borderRadius:4,background:"var(--bg-hover)",overflow:"hidden",position:"relative"}}>
                      <div style={{height:"100%",borderRadius:4,width:`${(s.count/maxCount)*100}%`,background:s.color,opacity:0.7,transition:"width 0.3s"}}/>
                      <span style={{position:"absolute",right:6,top:2,fontSize:10,fontWeight:700,color:"var(--text)"}}>{s.count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>}
          </Card>

          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>🖥️ Makine Verimliliği</h3>
              <button onClick={()=>downloadCSV(`makine_verimlilik_${new Date().toISOString().slice(0,10)}`,["Makine","Aktif İş","Biten İş","Toplam İş","Toplam Süre (dk)"],stats.machineUtil.map(m=>[m.name,m.active,m.done,m.totalJobs,m.totalMin]))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4}} title="CSV İndir"><Download size={14}/></button>
            </div>
            {stats.machineUtil.map(m=>{
              const maxJobs=Math.max(...stats.machineUtil.map(x=>x.totalJobs),1);
              const hours=Math.floor(m.totalMin/60);
              const mins=m.totalMin%60;
              return(
                <div key={m.id} style={{padding:10,borderRadius:8,marginBottom:8,background:"var(--bg-subtle)",border:"1px solid var(--border)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{m.name}</span>
                    <div style={{display:"flex",gap:10,fontSize:11}}>
                      <span style={{color:m.active>0?"#3b82f6":"#64748b"}}>{m.active>0?`${m.active} aktif`:"Boş"}</span>
                      <span style={{color:"#10b981"}}>{m.done} biten</span>
                      {m.totalMin>0&&<span style={{color:"var(--text-sec)"}}>{hours>0?`${hours}sa ${mins}dk`:`${mins}dk`}</span>}
                    </div>
                  </div>
                  <div style={{height:6,borderRadius:3,background:"var(--border)"}}>
                    <div style={{height:"100%",borderRadius:3,width:`${Math.min((m.totalJobs/maxJobs)*100,100)}%`,background:m.active>0?"#3b82f6":"#10b981",transition:"width 0.3s"}}/>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* ROW 4: Top Customers + Operator Performance */}
        <div className="grid-mobile-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>🏢 Müşteri Dağılımı</h3>
              <button onClick={()=>downloadCSV(`musteri_dagilim_${new Date().toISOString().slice(0,10)}`,["Müşteri Kodu","Müşteri","Sipariş","Kalem","Tamamlanan"],stats.topCustomers.map(c=>[c.code,c.name,c.orders,c.items,c.completed]))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4}} title="CSV İndir"><Download size={14}/></button>
            </div>
            {stats.topCustomers.length===0?<div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Veri yok</div>:
            <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:"1px solid var(--border-h)"}}>
                <th style={{padding:"6px 8px",textAlign:"left",color:"var(--text-mute)"}}>Müşteri</th>
                <th style={{padding:"6px 8px",textAlign:"center",color:"var(--text-mute)"}}>Sipariş</th>
                <th style={{padding:"6px 8px",textAlign:"center",color:"var(--text-mute)"}}>Kalem</th>
                <th style={{padding:"6px 8px",textAlign:"center",color:"var(--text-mute)"}}>Tamamlanan</th>
              </tr></thead>
              <tbody>{stats.topCustomers.map((c,i)=>(
                <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <td style={{padding:"8px",color:"var(--text)",fontWeight:600}}>
                    {c.code&&<span style={{fontSize:10,color:"#6366f1",marginRight:6}}>{c.code}</span>}
                    {c.name}
                  </td>
                  <td style={{padding:"8px",textAlign:"center",color:"var(--text-sec)"}}>{c.orders}</td>
                  <td style={{padding:"8px",textAlign:"center",color:"var(--text-sec)"}}>{c.items}</td>
                  <td style={{padding:"8px",textAlign:"center"}}>
                    <span style={{color:c.completed>0?"#10b981":"#64748b",fontWeight:600}}>{c.completed}</span>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>}
          </Card>

          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>👷 Operatör Performansı</h3>
              {stats.operatorPerf.length>0&&<button onClick={()=>downloadCSV(`operator_performans_${new Date().toISOString().slice(0,10)}`,["Operatör","Biten İş","Ort. Süre (dk)","Toplam Süre (dk)","Fire"],stats.operatorPerf.map(op=>[op.name,op.completed,op.avgMin,op.totalMin,op.rejects]))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4}} title="CSV İndir"><Download size={14}/></button>}
            </div>
            {stats.operatorPerf.length===0?<div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Henüz tamamlanan iş yok</div>:
            <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:"1px solid var(--border-h)"}}>
                <th style={{padding:"6px 8px",textAlign:"left",color:"var(--text-mute)"}}>Operatör</th>
                <th style={{padding:"6px 8px",textAlign:"center",color:"var(--text-mute)"}}>Biten İş</th>
                <th style={{padding:"6px 8px",textAlign:"center",color:"var(--text-mute)"}}>Ort. Süre</th>
                <th style={{padding:"6px 8px",textAlign:"center",color:"var(--text-mute)"}}>Fire</th>
              </tr></thead>
              <tbody>{stats.operatorPerf.map(op=>(
                <tr key={op.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <td style={{padding:"8px",color:"var(--text)",fontWeight:600}}>{op.name}</td>
                  <td style={{padding:"8px",textAlign:"center",color:"#3b82f6",fontWeight:600}}>{op.completed}</td>
                  <td style={{padding:"8px",textAlign:"center",color:"var(--text-sec)"}}>{op.avgMin>0?`${op.avgMin}dk`:"—"}</td>
                  <td style={{padding:"8px",textAlign:"center"}}>
                    <span style={{color:op.rejects>0?"#ef4444":"#10b981",fontWeight:600}}>{op.rejects}</span>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>}
          </Card>
        </div>

        {/* ROW 5: Monthly Trend */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{margin:0,color:"var(--text-h)",fontSize:15,fontWeight:600}}>📈 Aylık Trend (Son 6 Ay)</h3>
            <button onClick={()=>downloadCSV(`aylik_trend_${new Date().toISOString().slice(0,10)}`,["Ay","Oluşturulan","Tamamlanan"],stats.monthlyTrend.map(m=>[m.month,m.created,m.done]))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4}} title="CSV İndir"><Download size={14}/></button>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:12,padding:"10px 0",height:160}}>
            {(()=>{
              const maxVal=Math.max(...stats.monthlyTrend.map(m=>Math.max(m.created,m.done)),1);
              return stats.monthlyTrend.map((m,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{display:"flex",gap:3,alignItems:"flex-end",height:110,width:"100%",justifyContent:"center"}}>
                    <div style={{width:"40%",maxWidth:28,borderRadius:"4px 4px 0 0",background:"rgba(99,102,241,0.5)",height:`${Math.max((m.created/maxVal)*100,4)}%`,position:"relative"}}>
                      {m.created>0&&<span style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:"#6366f1"}}>{m.created}</span>}
                    </div>
                    <div style={{width:"40%",maxWidth:28,borderRadius:"4px 4px 0 0",background:"rgba(16,185,129,0.5)",height:`${Math.max((m.done/maxVal)*100,4)}%`,position:"relative"}}>
                      {m.done>0&&<span style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:"#10b981"}}>{m.done}</span>}
                    </div>
                  </div>
                  <span style={{fontSize:11,color:"var(--text-sec)",fontWeight:600}}>{m.month}</span>
                </div>
              ));
            })()}
          </div>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--text-sec)"}}>
              <div style={{width:12,height:12,borderRadius:3,background:"rgba(99,102,241,0.5)"}}/> Oluşturulan
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--text-sec)"}}>
              <div style={{width:12,height:12,borderRadius:3,background:"rgba(16,185,129,0.5)"}}/> Tamamlanan
            </div>
          </div>
        </Card>
        </>
      )}
    </div>
  );

