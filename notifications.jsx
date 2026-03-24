// ═══════════════════════════════════════
// Notification Panel
// ═══════════════════════════════════════
  const NOTIF_COLORS = {
    urgent: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", dot: "#ef4444" },
    danger: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", dot: "#ef4444" },
    warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", dot: "#f59e0b" },
    success: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", dot: "#10b981" },
    info: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", dot: "#3b82f6" },
  };

  const NotifBell = ({style:s}) => (
    <div style={{position:"relative",cursor:"pointer",...s}} onClick={()=>setShowNotifPanel(p=>!p)}>
      <Bell size={20} color={unreadCount>0?"#f59e0b":"var(--text-sec)"}/>
      {unreadCount>0&&<div style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:9,background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",border:"2px solid var(--bg-app)"}}>{unreadCount>9?"9+":unreadCount}</div>}
    </div>
  );

  const NotifPanel = () => {
    if(!showNotifPanel) return null;
    const timeAgo = (ts) => {
      const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
      if(diff < 60) return "az önce";
      if(diff < 3600) return Math.floor(diff/60) + " dk önce";
      if(diff < 86400) return Math.floor(diff/3600) + " sa önce";
      return Math.floor(diff/86400) + " gün önce";
    };
    return(
      <div style={{position:"fixed",inset:0,zIndex:980}} onClick={()=>setShowNotifPanel(false)}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)"}}/>
        <div onClick={e=>e.stopPropagation()} style={{
          position:"absolute",
          top:isMobile?52:12,
          right:isMobile?8:sideCollapsed?70:230,
          width:isMobile?"calc(100vw - 16px)":380,
          maxHeight:"70vh",
          background:"var(--bg-modal)",
          border:"1px solid var(--border-strong)",
          borderRadius:14,
          overflow:"hidden",
          boxShadow:"var(--shadow-modal)",
          display:"flex",
          flexDirection:"column",
        }}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Bell size={16} color="#f59e0b"/>
              <span style={{fontSize:15,fontWeight:700,color:"var(--text-h)"}}>Bildirimler</span>
              {unreadCount>0&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:"rgba(239,68,68,0.15)",color:"#ef4444"}}>{unreadCount} yeni</span>}
            </div>
            <div style={{display:"flex",gap:6}}>
              {unreadCount>0&&<button onClick={markAllRead} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:6,padding:"4px 10px",color:"#60a5fa",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Tümünü Oku</button>}
              {notifications.length>0&&<button onClick={clearNotifications} style={{background:"var(--bg-hover)",border:"1px solid var(--border-h)",borderRadius:6,padding:"4px 10px",color:"var(--text-sec)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Temizle</button>}
            </div>
          </div>

          {/* Notification list */}
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            {notifications.length===0?(
              <div style={{padding:40,textAlign:"center",color:"var(--text-mute)"}}>
                <Bell size={32} color="var(--text-dim)" style={{marginBottom:8,opacity:0.5}}/>
                <div style={{fontSize:13}}>Bildirim yok</div>
              </div>
            ):(
              notifications.map(n => {
                const c = NOTIF_COLORS[n.type] || NOTIF_COLORS.info;
                const PAGE_LABELS={workorders:"İş Emirleri",production:"Üretim",qc:"Kalite Kontrol",stock:"Stok",coating:"Kaplama",shipping:"Sevkiyat",orders:"Siparişler",invoices:"Faturalar"};
                return(
                  <div key={n.id} onClick={()=>navigateNotif(n)} style={{
                    padding:"12px 16px",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                    background:n.read?"transparent":c.bg,
                    borderLeft:n.read?"3px solid transparent":`3px solid ${c.dot}`,
                    cursor:n.targetPage?"pointer":"default",
                    transition:"background 0.15s",
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:n.read?500:700,color:n.read?"var(--text-sec)":"var(--text-h)",marginBottom:2}}>{n.title}</div>
                        <div style={{fontSize:12,color:n.read?"#64748b":"var(--text-sec)",lineHeight:1.4}}>{n.detail}</div>
                        {n.targetPage&&<div style={{marginTop:4,fontSize:10,fontWeight:600,color:c.dot,opacity:0.8}}>{PAGE_LABELS[n.targetPage]||n.targetPage} →</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        <span style={{fontSize:10,color:"var(--text-mute)",whiteSpace:"nowrap"}}>{timeAgo(n.ts)}</span>
                        {!n.read&&<div style={{width:8,height:8,borderRadius:4,background:c.dot,flexShrink:0}}/>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

