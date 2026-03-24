// ═══════════════════════════════════════
// Navigation
// ═══════════════════════════════════════
  //  NAV 
  const OPERATOR_PAGES = ["dashboard","workorders","production","qc"];
  const navItems = [
    {key:"dashboard",label:"Panel",icon:Home,perm:null},
    {key:"orders",label:"Siparişler",icon:Package,perm:"orders_view"},
    {key:"workorders",label:"İş Emirleri",icon:ClipboardList,perm:"workorders_view"},
    {key:"cutting",label:"Kesim",icon:Scissors,perm:"cutting_view"},
    {key:"grinding",label:"Taşlama",icon:Wrench,perm:"grinding_view"},
    {key:"planning",label:"Planlama",icon:Calendar,perm:"planning_view"},
    {key:"production",label:"Üretim",icon:Factory,perm:"production_view"},
    {key:"qc",label:"Kalite Kontrol",icon:CheckCircle2,perm:"qc_view"},
    {key:"coating",label:"Kaplama",icon:Layers,perm:"coating_view"},
    {key:"shipping",label:"Sevkiyat",icon:Truck,perm:"shipping_view"},
    {key:"invoices",label:"Faturalar",icon:Receipt,perm:"invoices_view"},
    {key:"stock",label:"Hammadde Stok",icon:Box,perm:"stock_view"},
    {key:"purchasing",label:"Satın Alma",icon:ShoppingCart,perm:"purchasing_view"},
    {key:"arge",label:"ARGE",icon:Zap,perm:"orders_view"},
    {key:"machines",label:"Makinalar",icon:Monitor,perm:"machines_view"},
    {key:"operators",label:"Operatörler",icon:Users,perm:"operators_view"},
    ...(hasPerm("admin")?[{key:"usermgmt",label:"Kullanıcı Yönetimi",icon:UserCog,perm:"admin"}]:[]),
  ].filter(n=>!n.perm||hasPerm(n.perm)).filter(n=>!isOperatorRole||OPERATOR_PAGES.includes(n.key));

  const handleNavClick = (key) => { setPage(key); if(isMobile) setMobileMenuOpen(false); };

  // Mobile top bar
  const MobileTopBar = () => (
    <div style={{position:"sticky",top:0,zIndex:900,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"var(--bg-sidebar)",borderBottom:"1px solid var(--border)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setMobileMenuOpen(true)} style={{background:"none",border:"none",color:"var(--text-sec)",cursor:"pointer",padding:6,display:"flex",alignItems:"center"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#fff"}}>M</div>
        <span style={{fontWeight:700,color:"var(--text-h)",fontSize:14}}>MİHENK</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div onClick={toggleTheme} style={{cursor:"pointer",padding:6,display:"flex",alignItems:"center",borderRadius:6,background:"var(--bg-hover)"}}>
          {theme==="dark"?<Sun size={16} color="#f59e0b"/>:<Moon size={16} color="#6366f1"/>}
        </div>
        <NotifBell/>
        <span style={{fontSize:11,color:"var(--text-mute)"}}>{currentUser?.name}</span>
        <button onClick={()=>{fetch("/api/logout",{method:"POST",credentials:"same-origin"});setAuthToken(null);setCurrentUser(null);setStateLoaded(false);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:6}}><LogOut size={16}/></button>
      </div>
    </div>
  );

  // Mobile overlay sidebar
  const MobileMenu = () => {
    if(!mobileMenuOpen) return null;
    return(
      <div style={{position:"fixed",inset:0,zIndex:950}} onClick={()=>setMobileMenuOpen(false)}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(2px)"}}/>
        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,top:0,bottom:0,width:260,background:"var(--bg-sidebar)",borderRight:"1px solid var(--border-h)",display:"flex",flexDirection:"column",animation:"slideIn 0.2s ease-out"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#fff"}}>M</div>
              <span style={{fontWeight:700,color:"var(--text-h)",fontSize:15}}>MİHENK ÜTS</span>
            </div>
            <button onClick={()=>setMobileMenuOpen(false)} style={{background:"var(--border)",border:"none",color:"var(--text-sec)",cursor:"pointer",width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✕</button>
          </div>
          <div style={{flex:1,padding:"8px",overflowY:"auto"}}>
            {navItems.map(item=>{const act=page===item.key;return(
              <div key={item.key} onClick={()=>handleNavClick(item.key)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:8,cursor:"pointer",marginBottom:2,background:act?"rgba(59,130,246,0.15)":"transparent",color:act?"#60a5fa":"#94a3b8",transition:"all 0.15s"}}>
                <item.icon size={20}/><span style={{fontSize:14,fontWeight:act?600:500}}>{item.label}</span>
              </div>
            );})}
          </div>
          <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px"}}>
              <div style={{width:32,height:32,borderRadius:8,background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontWeight:700,fontSize:13}}>{currentUser.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{currentUser.name}</div>
                <div style={{fontSize:11,color:"var(--text-mute)"}}>{DEFAULT_ROLES[currentUser.role]?.label}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Desktop sidebar (unchanged)
  const Sidebar = () => (
    <div style={{width:sideCollapsed?60:220,minWidth:sideCollapsed?60:220,height:"100vh",background:"var(--bg-sidebar)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",transition:"all 0.2s",overflow:"hidden"}}>
      <div style={{padding:sideCollapsed?"16px 10px":"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#fff",flexShrink:0}}>M</div>
        {!sideCollapsed&&<span style={{fontWeight:700,color:"var(--text-h)",fontSize:15}}>MİHENK ÜTS</span>}
      </div>
      <div style={{flex:1,padding:"8px",overflowY:"auto"}}>
        {navItems.map(item=>{const act=page===item.key;return(
          <div key={item.key} onClick={()=>setPage(item.key)} style={{display:"flex",alignItems:"center",gap:10,padding:sideCollapsed?"10px":"9px 14px",borderRadius:8,cursor:"pointer",marginBottom:2,justifyContent:sideCollapsed?"center":"flex-start",background:act?"rgba(59,130,246,0.15)":"transparent",color:act?"#60a5fa":"#94a3b8",transition:"all 0.15s"}}>
            <item.icon size={18}/>{!sideCollapsed&&<span style={{fontSize:13,fontWeight:act?600:500}}>{item.label}</span>}
          </div>
        );})}
      </div>
      <div style={{padding:"8px 12px",borderTop:"1px solid var(--border)"}}>
        {!sideCollapsed&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px",marginBottom:4}}>
            <div style={{width:28,height:28,borderRadius:7,background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontWeight:700,fontSize:12}}>{currentUser.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
              <div style={{fontSize:10,color:"var(--text-mute)"}}>{DEFAULT_ROLES[currentUser.role]?.label}</div>
            </div>
            <button onClick={()=>{fetch("/api/logout",{method:"POST",credentials:"same-origin"});setAuthToken(null);setCurrentUser(null);setStateLoaded(false);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:4}}><LogOut size={14}/></button>
          </div>
        )}
        <div style={{display:"flex",gap:4,alignItems:"center",justifyContent:sideCollapsed?"center":"space-between"}}>
          <div onClick={toggleTheme} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:8,borderRadius:8,cursor:"pointer",color:"var(--text-mute)",background:"var(--bg-hover)"}}>
            {theme==="dark"?<Sun size={16} color="#f59e0b"/>:<Moon size={16} color="#6366f1"/>}
          </div>
          <div onClick={()=>setSideCollapsed(!sideCollapsed)} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:8,borderRadius:8,cursor:"pointer",color:"var(--text-mute)"}}>
            {sideCollapsed?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}
          </div>
        </div>
      </div>
    </div>
  );

