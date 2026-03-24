// ═══════════════════════════════════════
// Login Screen
// ═══════════════════════════════════════
  //  LOGIN SCREEN 
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // [FIX #2] Password change state
  const [pwChangeForm, setPwChangeForm] = useState(null); // {currentPassword, newPassword, confirmPassword}
  const [pwChangeError, setPwChangeError] = useState("");
  const [pwChangeLoading, setPwChangeLoading] = useState(false);

  // [FIX #2] Force password change modal
  if(mustChangePassword && currentUser){
    const handlePwChange = async () => {
      setPwChangeLoading(true); setPwChangeError("");
      const cur = pwChangeForm?.currentPassword || "";
      const np = pwChangeForm?.newPassword || "";
      const cp = pwChangeForm?.confirmPassword || "";
      if(!cur) { setPwChangeError("Mevcut şifreyi girin"); setPwChangeLoading(false); return; }
      if(np.length < 8) { setPwChangeError("Yeni şifre en az 8 karakter olmalıdır"); setPwChangeLoading(false); return; }
      if(!/[0-9]/.test(np)) { setPwChangeError("Yeni şifre en az bir rakam içermelidir"); setPwChangeLoading(false); return; }
      if(np !== cp) { setPwChangeError("Şifreler eşleşmiyor"); setPwChangeLoading(false); return; }
      try {
        const res = await fetch("/api/change-password", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body: JSON.stringify({currentPassword:cur,newPassword:np}) });
        const data = await res.json();
        if(res.ok) { setMustChangePassword(false); setCurrentUser(data.user); setPwChangeForm(null); }
        else { setPwChangeError(data.error || "Şifre değiştirilemedi"); }
      } catch(e) { setPwChangeError("Sunucuya bağlanılamadı"); }
      setPwChangeLoading(false);
    };
    return (
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-app)",fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
        <div style={{width:"100%",maxWidth:420,padding:32,borderRadius:20,background:"var(--bg-card)",border:"1px solid var(--border-h)"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",marginBottom:12}}>🔒</div>
            <h2 style={{color:"var(--text-h)",margin:"8px 0 4px",fontSize:18}}>Şifre Değişikliği Gerekli</h2>
            <p style={{color:"var(--text-mute)",fontSize:12,margin:0}}>Güvenliğiniz için ilk girişte şifrenizi değiştirmeniz gerekmektedir. Yeni şifre en az 8 karakter ve 1 rakam içermelidir.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Mevcut Şifre</div>
              <input type="password" value={pwChangeForm?.currentPassword||""} onChange={e=>setPwChangeForm(p=>({...p,currentPassword:e.target.value}))}
                placeholder="Mevcut şifreniz" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Yeni Şifre</div>
              <input type="password" value={pwChangeForm?.newPassword||""} onChange={e=>setPwChangeForm(p=>({...p,newPassword:e.target.value}))}
                placeholder="En az 8 karakter, 1 rakam" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Yeni Şifre (Tekrar)</div>
              <input type="password" value={pwChangeForm?.confirmPassword||""} onChange={e=>setPwChangeForm(p=>({...p,confirmPassword:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&handlePwChange()}
                placeholder="Aynı şifreyi tekrar girin" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            {pwChangeError&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center"}}>{pwChangeError}</div>}
            <button onClick={handlePwChange} disabled={pwChangeLoading} style={{padding:"10px 0",borderRadius:10,border:"none",background:pwChangeLoading?"var(--text-dim)":"linear-gradient(135deg,#f59e0b,#ef4444)",color:"#fff",fontSize:14,fontWeight:700,cursor:pwChangeLoading?"not-allowed":"pointer",fontFamily:"inherit",marginTop:4}}>{pwChangeLoading?"Değiştiriliyor...":"Şifreyi Değiştir"}</button>
          </div>
        </div>
      </div>
    );
  }

  if(!currentUser){
    const handleLogin = async () => {
      setLoginLoading(true); setLoginError("");
      try {
        const res = await fetch("/api/login", { method: "POST", credentials: "same-origin", headers: {"Content-Type":"application/json"}, body: JSON.stringify({username: loginUser, password: loginPass}) });
        const data = await res.json();
        if(res.ok) {
          setAuthToken("cookie"); setCurrentUser(data.user); setLoginUser(""); setLoginPass("");
          // [FIX #2] Check if password change required
          if(data.mustChangePassword) setMustChangePassword(true);
        } else {
          setLoginError(data.error || "Giriş başarısız!");
        }
      } catch(e) {
        // Offline/standalone fallback — no password check, demo mode only
        setLoginError("Sunucuya bağlanılamadı. Sunucu çalıştığından emin olun.");
      }
      setLoginLoading(false);
    };
    return (
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-app)",fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
        <div style={{width:"100%",maxWidth:380,padding:isMobile?20:32,borderRadius:20,background:"var(--bg-card)",border:"1px solid var(--border-h)",margin:isMobile?"0 16px":0}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",marginBottom:12}}>M</div>
            <h2 style={{color:"var(--text-h)",margin:"8px 0 4px",fontSize:20}}>MİHENK Üretim Takip</h2>
            <p style={{color:"var(--text-mute)",fontSize:13,margin:0}}>Kullanıcı adı ve şifrenizle giriş yapın</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Kullanıcı Adı</div>
              <input type="text" value={loginUser} onChange={e=>{setLoginUser(e.target.value);setLoginError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="Kullanıcı adı" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-sec)",marginBottom:4}}>Şifre</div>
              <input type="password" value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="Şifre" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-strong)",background:"var(--bg-hover)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            {loginError&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center"}}>{loginError}</div>}
            <button onClick={handleLogin} disabled={loginLoading} style={{padding:"10px 0",borderRadius:10,border:"none",background:loginLoading?"var(--text-dim)":"linear-gradient(135deg,#3b82f6,#6366f1)",color:"#fff",fontSize:14,fontWeight:700,cursor:loginLoading?"not-allowed":"pointer",fontFamily:"inherit",marginTop:4}}>{loginLoading?"Bağlanıyor...":"Giriş Yap"}</button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while state syncs from server
  if(!stateLoaded){
    return (
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-app)"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",marginBottom:16,animation:"pulse 1.5s infinite"}}>M</div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><div className="spinner"/></div>
          <div style={{color:"var(--text-sec)",fontSize:14}}>Sunucuya bağlanılıyor...</div>
          <div style={{color:"var(--text-mute)",fontSize:11,marginTop:4}}>Lütfen bekleyin</div>
        </div>
      </div>
    );
  }

