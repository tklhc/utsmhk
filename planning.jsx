// ═══════════════════════════════════════
// Planning Page
// ═══════════════════════════════════════
  //  PLANNING PAGE 
  const PlanningPage = () => {
    const [planTab,setPlanTab]=useState("distribution");
    const [calView,setCalView]=useState("daily");
    const [viewDate,setViewDate]=useState(new Date("2026-02-16"));
    const cncMachines=machines.filter(m=>m.type==="CNC");
    const timeSlots = [];
    for(let m=WORK_START;m<=WORK_END;m+=10) timeSlots.push(m);

    const getBlocksForDate = (date, machineId) => {
      const ds = dateStr(date);
      return (schedule[ds]||[]).filter(b=>b.machineId===machineId);
    };

    const getWeekDates = (d) => {
      const start=new Date(d);
      const day=start.getDay();
      const diff=start.getDate()-day+(day===0?-6:1);
      const mon=new Date(start.setDate(diff));
      return Array.from({length:5},(_,i)=>addDays(mon,i));
    };

    const getMonthDates = (d) => {
      const y=d.getFullYear(), m=d.getMonth();
      const last=new Date(y,m+1,0);
      const days=[];
      for(let i=1;i<=last.getDate();i++) days.push(new Date(y,m,i));
      return days;
    };

    const TIMELINE_PX_PER_MIN = 4;
    const TIMELINE_WIDTH = WORK_MINUTES * TIMELINE_PX_PER_MIN;
    const MACHINE_ROW_H = 46; // row height (40px block + 6px margin)
    const MACHINE_LABEL_W = 130;

    // ── Drag state ──
    const [drag, setDrag] = useState(null); // {jobId, ..., active}
    const timelineRefs = useRef({}); // date → container DOM ref
    const dragIntent = useRef(null); // pre-drag state before threshold

    const snapMin = (px) => {
      const raw = WORK_START + px / TIMELINE_PX_PER_MIN;
      return Math.max(WORK_START, Math.min(WORK_END - 10, Math.round(raw / 10) * 10));
    };

    const getMachineFromY = (y, date) => {
      const container = timelineRefs.current[dateStr(date)];
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const relY = y - rect.top;
      const idx = Math.floor(relY / MACHINE_ROW_H);
      return cncMachines[Math.max(0, Math.min(idx, cncMachines.length - 1))]?.id || null;
    };

    const DRAG_THRESHOLD = 8; // px before drag activates

    const handleDragStart = (e, block, date) => {
      if (!hasPerm("planning_edit")) return;
      const job = productionJobs.find(j => j.id === block.jobId);
      if (!job || job.status === "running") return;
      const container = timelineRefs.current[dateStr(date)];
      if (!container) return;
      const machineIdx = cncMachines.findIndex(m => m.id === block.machineId);
      // Store intent — don't activate drag yet
      dragIntent.current = {
        jobId: block.jobId, woId: block.woId, itemId: block.itemId,
        machineId: block.machineId,
        origLeft: (block.start - WORK_START) * TIMELINE_PX_PER_MIN,
        origTop: machineIdx * MACHINE_ROW_H,
        width: (block.end - block.start) * TIMELINE_PX_PER_MIN,
        duration: block.end - block.start,
        startPtrX: e.clientX, startPtrY: e.clientY,
        date, pointerId: e.pointerId,
      };
      e.target.setPointerCapture?.(e.pointerId);
    };

    const handleDragMove = (e) => {
      // Check if we should activate drag (threshold)
      if (dragIntent.current && !drag) {
        const dx = e.clientX - dragIntent.current.startPtrX;
        const dy = e.clientY - dragIntent.current.startPtrY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          const di = dragIntent.current;
          setDrag({
            ...di, active: true,
            ghostX: di.origLeft, ghostY: di.origTop,
          });
        }
        return;
      }
      if (!drag) return;
      e.preventDefault();
      const dx = e.clientX - drag.startPtrX;
      const dy = e.clientY - drag.startPtrY;
      setDrag(p => ({ ...p, ghostX: p.origLeft + dx, ghostY: p.origTop + dy }));
    };

    const handleDragEnd = (e) => {
      const wasDragging = drag?.active;
      if (wasDragging) {
        e.preventDefault();
        const targetMin = snapMin(drag.ghostX);
        const targetMachineId = getMachineFromY(e.clientY, drag.date) || drag.machineId;
        const job = productionJobs.find(j => j.id === drag.jobId);
        if (job) {
          const ds = dateStr(drag.date);
          const origMin = WORK_START + Math.round(drag.origLeft / TIMELINE_PX_PER_MIN);
          const changed = targetMachineId !== drag.machineId || targetMin !== origMin;
          if (changed) {
            rescheduleJob(drag.jobId, {
              planDate: ds,
              planStartMin: targetMin,
              estimatedMinutes: job.estimatedMinutes,
              machineId: targetMachineId !== drag.machineId ? targetMachineId : undefined,
            });
          }
        }
      }
      setDrag(null);
      dragIntent.current = null;
    };

    const handleBlockClick = (e, block) => {
      // Only fire click if we didn't just drag
      if (drag || dragIntent.current) return;
      const wo = workOrders.find(w => w.id === block.woId);
      const job = productionJobs.find(j => j.id === block.jobId);
      if (job && hasPerm("planning_edit")) setRescheduleModal(job);
      else if (wo) setWoDetail(wo);
    };

    const TimelineDay = ({date}) => {
      const ds = dateStr(date);
      return (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:10}}>{new Date(date).toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          <div className="tbl-wrap" style={{overflowX:"auto",paddingBottom:6}}>
            <div style={{minWidth:TIMELINE_WIDTH+140}}>
              {/* Time header */}
              <div style={{display:"flex",marginBottom:2}}>
                <div style={{width:MACHINE_LABEL_W,flexShrink:0}}/>
                <div style={{position:"relative",width:TIMELINE_WIDTH,height:20}}>
                  {timeSlots.map((m)=>{
                    const x=(m-WORK_START)*TIMELINE_PX_PER_MIN;
                    const isHour=m%60===0;
                    const isHalf=m%30===0&&!isHour;
                    const is10=m%10===0;
                    return(
                      <div key={m} style={{position:"absolute",left:x,top:0,bottom:0}}>
                        <span style={{fontSize:isHour?10:isHalf?9:8,fontWeight:isHour?700:isHalf?600:400,color:isHour?"var(--text)":isHalf?"#94a3b8":"#64748b",whiteSpace:"nowrap",position:"absolute",left:-12,top:isHour?0:2}}>{is10?minToTime(m):""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Machine rows — drag container */}
              <div ref={el => { timelineRefs.current[ds] = el; }}
                onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={() => setDrag(null)}
                style={{position:"relative",touchAction:"none",userSelect:"none"}}>
                {cncMachines.map((machine, mi) => {
                  const blocks=getBlocksForDate(date,machine.id);
                  const isDropTarget = drag && drag.date === date;
                  const dropMachineIdx = isDropTarget ? Math.max(0, Math.min(Math.round(drag.ghostY / MACHINE_ROW_H), cncMachines.length - 1)) : -1;
                  return(
                    <div key={machine.id} style={{display:"flex",alignItems:"center",marginBottom:6,position:"relative"}}>
                      <div style={{width:MACHINE_LABEL_W,fontSize:12,fontWeight:600,color:"var(--text-sec)",flexShrink:0,paddingRight:10}}>{machine.name}</div>
                      <div style={{position:"relative",width:TIMELINE_WIDTH,height:40,background:dropMachineIdx===mi?"rgba(59,130,246,0.08)":"var(--bg-subtle)",borderRadius:6,border:dropMachineIdx===mi?"1px solid rgba(59,130,246,0.3)":"1px solid var(--border)",transition:"background 0.15s"}}>
                        {/* Grid lines */}
                        {timeSlots.map(m=>{
                          const x=(m-WORK_START)*TIMELINE_PX_PER_MIN;
                          const isHour=m%60===0;
                          const isHalf=m%30===0&&!isHour;
                          return <div key={m} style={{position:"absolute",left:x,top:0,bottom:0,width:1,background:isHour?"rgba(255,255,255,0.12)":isHalf?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.035)"}}/>;
                        })}
                        {/* Job blocks */}
                        {blocks.map((block,bi)=>{
                          const wo=workOrders.find(w=>w.id===block.woId);
                          const item=wo?.items.find(i=>i.id===block.itemId);
                          const job=productionJobs.find(j=>j.id===block.jobId);
                          const left=(block.start-WORK_START)*TIMELINE_PX_PER_MIN;
                          const width=(block.end-block.start)*TIMELINE_PX_PER_MIN;
                          const colors=["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#ec4899","#14b8a6"];
                          const color=colors[bi%colors.length];
                          const isManual=job?.planDate;
                          const isDragging=drag?.jobId===block.jobId;
                          return(
                            <div key={bi}
                              onPointerDown={e => handleDragStart(e, block, date)}
                              onClick={e => handleBlockClick(e, block)}
                              title={`${item?.productCode||`Ø${item?.diameter}`} — ${wo?.customerCode||wo?.customerName}\n${minToTime(block.start)} - ${minToTime(block.end)} (${block.end-block.start}dk)${isManual?"\n📌 Manuel planlama":""}${hasPerm("planning_edit")?"\n↔ Sürükle → Taşı":""}`}
                              style={{position:"absolute",left,width:Math.max(width,10),top:3,bottom:3,borderRadius:4,background:isDragging?`${color}44`:`${color}dd`,display:"flex",alignItems:"center",paddingLeft:4,overflow:"hidden",cursor:hasPerm("planning_edit")?"grab":"pointer",boxShadow:`0 1px 3px ${color}44`,zIndex:isDragging?0:1,borderBottom:isManual?"2px solid #f59e0b":"none",opacity:isDragging?0.3:1,transition:isDragging?"none":"opacity 0.15s"}}>
                              <span style={{fontSize:10,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                {width>120?`${isManual?"📌 ":""}${item?.productCode||`Ø${item?.diameter}`} | ${minToTime(block.start)}-${minToTime(block.end)} (${block.end-block.start}dk)`:width>60?`${isManual?"📌":""}${item?.productCode||`Ø${item?.diameter}`} ${block.end-block.start}dk`:width>30?`${block.end-block.start}dk`:""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Drag ghost overlay */}
                {drag && drag.date === date && (()=>{
                  const ghostMin = snapMin(drag.ghostX);
                  const ghostLeft = (ghostMin - WORK_START) * TIMELINE_PX_PER_MIN;
                  const ghostMi = Math.max(0, Math.min(Math.round(drag.ghostY / MACHINE_ROW_H), cncMachines.length - 1));
                  const ghostTop = ghostMi * MACHINE_ROW_H + 3;
                  const wo = workOrders.find(w => w.id === drag.woId);
                  const item = wo?.items.find(i => i.id === drag.itemId);
                  return(
                    <div style={{position:"absolute",left:MACHINE_LABEL_W + ghostLeft,top:ghostTop,width:Math.max(drag.width, 10),height:34,borderRadius:4,background:"rgba(59,130,246,0.7)",border:"2px solid #60a5fa",display:"flex",alignItems:"center",paddingLeft:6,zIndex:100,pointerEvents:"none",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>{item?.productCode||"..."} → {minToTime(ghostMin)} ({cncMachines[ghostMi]?.name})</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>İş Planlama</h2>
        </div>
        <div style={{marginBottom:16}}><TabSwitcher tabs={[{key:"distribution",label:"Makine Dağılımı",icon:Monitor},{key:"calendar",label:"Takvim Çizelgesi",icon:Calendar}]} active={planTab} onChange={setPlanTab}/></div>

        {planTab==="distribution"?(
          <>
            <Card style={{marginBottom:16}}>
              <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Makine İş Dağılımı</h3>
              {cncMachines.map(machine=>{
                const jobs=productionJobs.filter(j=>j.machineId===machine.id&&j.status!=="completed");
                return(
                  <div key={machine.id} style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <Monitor size={15} color="#3b82f6"/><span style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{machine.name}</span>
                      <Badge color={jobs.length>0?"#f59e0b":"#10b981"} bg={jobs.length>0?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)"}>{jobs.length>0?`${jobs.length} İş`:"Boş"}</Badge>
                    </div>
                    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                      {jobs.length===0?<div style={{padding:"10px 20px",borderRadius:8,background:"rgba(16,185,129,0.05)",border:"1px dashed rgba(16,185,129,0.2)",fontSize:12,color:"#10b981"}}>Müsait</div>
                      :jobs.map(job=>{
                        const wo=workOrders.find(w=>w.id===job.woId);const item=wo?.items.find(i=>i.id===job.itemId);
                        return(
                          <div key={job.id} style={{minWidth:180,padding:10,borderRadius:8,background:job.status==="running"?"rgba(59,130,246,0.1)":"rgba(245,158,11,0.08)",border:`1px solid ${job.status==="running"?"rgba(59,130,246,0.3)":"rgba(245,158,11,0.2)"}`,position:"relative"}}>
                            <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{item?.productCode||`Ø${item?.diameter} ${item?.islem||""}`}</div>
                            <div style={{fontSize:11,color:"var(--text-mute)",marginTop:3}}>{wo?.customerCode||wo?.customerName} — {item?.qty} ad</div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                              <span style={{fontSize:11,color:"#3b82f6"}}>⏱ {job.estimatedMinutes} dk</span>
                              {job.planDate&&<span style={{fontSize:10,color:"#f59e0b"}}>📌 {fmtTime(job.planStartMin)}</span>}
                            </div>
                            {hasPerm("planning_edit")&&<button onClick={()=>setRescheduleModal(job)} style={{position:"absolute",top:4,right:4,background:"var(--border)",border:"none",borderRadius:4,padding:"2px 5px",cursor:"pointer",fontSize:11,color:"var(--text-sec)"}} title="Zamanla / Düzenle">⏰</button>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card>
              <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Atanmamış İşler (Üretime Hazır)</h3>
              {workOrders.flatMap(wo=>wo.items.filter(it=>!it.machineId&&it.woStatus==="cut").map(it=>({...it,woId:wo.id,customerName:wo.customerName,customerCode:wo.customerCode,deliveryDate:wo.deliveryDate,orderType:wo.orderType}))).map(item=>(
                <div key={item.id} className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:10,borderRadius:8,background:"var(--bg-subtle)",border:"1px solid var(--border)",marginBottom:6}}>
                  <div className="mob-wrap" style={{display:"flex",alignItems:"center",gap:8}}>
                    <OrderTypeBadge type={item.orderType}/>
                    {item.toolCode&&<span style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>{item.toolCode}</span>}
                    <span style={{fontSize:13,fontWeight:item.toolCode?500:600,color:item.toolCode?"var(--text-sec)":"var(--text)"}}>{item.productCode||`Ø${item.diameter} ${item.islem||""}`}</span>
                    <span style={{fontSize:12,color:"var(--text-mute)"}}>{item.customerCode||item.customerName} — {item.qty} ad</span>
                    {item.estimatedMinutes>0&&<span style={{fontSize:11,color:"#3b82f6"}}>⏱ {item.orderType!=="bileme"?`${item.estimatedMinutes}dk/ad × ${item.qty} = ${item.qty*item.estimatedMinutes}dk`:`${item.estimatedMinutes}dk`}</span>}
                    <span style={{fontSize:12,color:"#f59e0b"}}>Termin: {fmtDate(item.deliveryDate)}</span>
                  </div>
                  {hasPerm("planning_edit")&&<Btn variant="primary" size="sm" icon={Factory} onClick={()=>{const totalEst=item.estimatedMinutes>0?(item.orderType!=="bileme"?item.qty*item.estimatedMinutes:item.estimatedMinutes):60;setModal({type:"assign",woId:item.woId,itemId:item.id,estMin:totalEst});}}>Atama</Btn>}
                </div>
              ))}
              {workOrders.flatMap(wo=>wo.items.filter(it=>!it.machineId&&it.woStatus==="cut")).length===0&&<div style={{textAlign:"center",padding:20,color:"var(--text-mute)",fontSize:13}}>Tüm işler atanmış ✓</div>}
            </Card>
          </>
        ):(
          <Card>
            <div className="mob-stack" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div className="mob-wrap" style={{display:"flex",gap:4}}>
                {["daily","weekly","monthly"].map(v=>(
                  <Btn key={v} variant={calView===v?"primary":"ghost"} size="sm" onClick={()=>setCalView(v)}>{v==="daily"?"Günlük":v==="weekly"?"Haftalık":"Aylık"}</Btn>
                ))}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Btn variant="ghost" size="sm" icon={ChevronLeft} onClick={()=>setViewDate(d=>addDays(d,calView==="daily"?-1:calView==="weekly"?-7:-30))}/>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)",minWidth:140,textAlign:"center"}}>{calView==="monthly"?viewDate.toLocaleDateString("tr-TR",{month:"long",year:"numeric"}):dayLabel(viewDate)}</span>
                <Btn variant="ghost" size="sm" icon={ChevronRight} onClick={()=>setViewDate(d=>addDays(d,calView==="daily"?1:calView==="weekly"?7:30))}/>
              </div>
            </div>

            {calView==="daily"&&<TimelineDay date={viewDate}/>}

            {calView==="weekly"&&(
              <div>
                {getWeekDates(viewDate).map(d=>(
                  <TimelineDay key={dateStr(d)} date={d}/>
                ))}
              </div>
            )}

            {calView==="monthly"&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"var(--text-mute)",padding:6}}>{d}</div>)}
                {(() => {
                  const dates=getMonthDates(viewDate);
                  const firstDay=(new Date(dates[0]).getDay()+6)%7;
                  const cells=[];
                  for(let i=0;i<firstDay;i++) cells.push(<div key={`e${i}`}/>);
                  dates.forEach(d=>{
                    const ds=dateStr(d);
                    const dayBlocks=(schedule[ds]||[]);
                    const hasWork=dayBlocks.length>0;
                    const isToday=dateStr(d)===dateStr(new Date());
                    cells.push(
                      <div key={ds} onClick={()=>{setViewDate(d);setCalView("daily");}} style={{padding:6,borderRadius:6,background:isToday?"rgba(59,130,246,0.15)":hasWork?"rgba(255,255,255,0.03)":"transparent",border:isToday?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.04)",cursor:"pointer",minHeight:48,textAlign:"center"}}>
                        <div style={{fontSize:12,fontWeight:600,color:isWeekend(d)?"var(--text-dim)":"var(--text)"}}>{d.getDate()}</div>
                        {hasWork&&<div style={{marginTop:3}}>
                          {[...new Set(dayBlocks.map(b=>b.machineId))].map(mid=>{
                            const mc=machines.find(m=>m.id===mid);
                            const totalMin=dayBlocks.filter(b=>b.machineId===mid).reduce((s,b)=>s+(b.end-b.start),0);
                            return <div key={mid} style={{fontSize:8,color:"#3b82f6",background:"rgba(59,130,246,0.15)",borderRadius:3,padding:"1px 3px",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mc?.name?.split(" ")[0]} {totalMin}dk</div>;
                          })}
                        </div>}
                      </div>
                    );
                  });
                  return cells;
                })()}
              </div>
            )}
          </Card>
        )}
        {modal?.type==="assign"&&<Modal title="Makine & Operatör Atama" onClose={()=>setModal(null)} width={500}><AssignForm woId={modal.woId} itemId={modal.itemId} estMin={modal.estMin} machines={machines} operators={operators} productionJobs={productionJobs} onAssign={(m,o,e)=>{assignToMachine(modal.woId,modal.itemId,m,o,e);setModal(null);}}/></Modal>}
      </div>
    );
  };

  // PRODUCTION
