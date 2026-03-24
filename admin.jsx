// ═══════════════════════════════════════
// Admin Pages (Machines, Operators, UserMgmt)
// ═══════════════════════════════════════
  const MachinesPage = () => {
    const [editM,setEditM]=useState(null);
    const [newM,setNewM]=useState(false);
    const [mName,setMName]=useState("");
    const [mType,setMType]=useState("CNC");
    const startEditM = m => { setEditM(m); setMName(m.name); setMType(m.type); };
    const saveM = () => {
      if(editM) setMachines(p=>p.map(m=>m.id===editM.id?{...m,name:mName,type:mType}:m));
      else { const id="M"+Date.now(); setMachines(p=>[...p,{id,name:mName,type:mType,status:"active"}]); }
      setEditM(null); setNewM(false); setMName(""); setMType("CNC");
    };
    const deleteM = id => { if(productionJobs.some(j=>j.machineId===id&&j.status!=="completed")) return alert("Aktif işi olan makina silinemez!"); const m=machines.find(x=>x.id===id); if(!confirm(`"${m?.name||id}" makinasını silmek istediğinize emin misiniz?`)) return; setMachines(p=>p.filter(m=>m.id!==id)); };
    return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>Makinalar</h2>
        {hasPerm("admin")&&<Btn icon={Plus} onClick={()=>{setNewM(true);setMName("");setMType("CNC");}}>Yeni Makina</Btn>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {machines.map(m=>{const j=productionJobs.filter(x=>x.machineId===m.id&&x.status!=="completed");return(
          <Card key={m.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Monitor size={18} color="#3b82f6"/><span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{m.name}</span></div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <Badge color={j.length>0?"#3b82f6":"#10b981"} bg={j.length>0?"rgba(59,130,246,0.15)":"rgba(16,185,129,0.15)"}>{j.length>0?`${j.length} İş`:"Boş"}</Badge>
                {hasPerm("admin")&&<button onClick={()=>startEditM(m)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:2}}><Edit size={13}/></button>}
                {hasPerm("admin")&&j.length===0&&<button onClick={()=>deleteM(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:2}}><Trash2 size={13}/></button>}
              </div>
            </div>
            <div style={{fontSize:12,color:"var(--text-mute)",marginBottom:6}}>Tip: {m.type}</div>
            {j.map(job=>{const wo=workOrders.find(w=>w.id===job.woId);const it=wo?.items.find(i=>i.id===job.itemId);return <div key={job.id} style={{padding:7,borderRadius:6,background:"rgba(59,130,246,0.08)",marginBottom:4,fontSize:12,color:"var(--text-sec)"}}>{it?.productCode||`Ø${it?.diameter}`} — {it?.qty}ad ({job.estimatedMinutes}dk)</div>;})}
          </Card>
        );})}
      </div>
      {(editM||newM)&&<Modal title={editM?"Makina Düzenle":"Yeni Makina Ekle"} onClose={()=>{setEditM(null);setNewM(false);}} width={400}>
        <Input label="Makina Adı" value={mName} onChange={setMName} placeholder="S20-4"/>
        <div style={{marginTop:12}}><Input label="Tip" value={mType} onChange={setMType} options={[{value:"CNC",label:"CNC"},{value:"Taşlama",label:"Taşlama"},{value:"Lazer",label:"Lazer"},{value:"Kesim",label:"Kesim"},{value:"Diğer",label:"Diğer"}]}/></div>
        <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}><Btn variant="primary" icon={Save} onClick={saveM} disabled={!mName.trim()}>Kaydet</Btn></div>
      </Modal>}
    </div>
  );};

  const OperatorsPage = () => {
    const [editOp,setEditOp]=useState(null);
    const [newOp,setNewOp]=useState(false);
    const [opName,setOpName]=useState("");
    const [opRole,setOpRole]=useState("CNC Operatör");
    const [opShift,setOpShift]=useState("Gündüz");
    const startEditOp = op => { setEditOp(op); setOpName(op.name); setOpRole(op.role); setOpShift(op.shift); };
    const saveOp = () => {
      if(editOp) setOperators(p=>p.map(o=>o.id===editOp.id?{...o,name:opName,role:opRole,shift:opShift}:o));
      else { const id="O"+Date.now(); setOperators(p=>[...p,{id,name:opName,role:opRole,shift:opShift}]); }
      setEditOp(null); setNewOp(false); setOpName(""); setOpRole("CNC Operatör"); setOpShift("Gündüz");
    };
    const deleteOp = id => { if(productionJobs.some(j=>j.operatorId===id&&j.status!=="completed")) return alert("Aktif işi olan operatör silinemez!"); const op=operators.find(x=>x.id===id); if(!confirm(`"${op?.name||id}" operatörünü silmek istediğinize emin misiniz?`)) return; setOperators(p=>p.filter(o=>o.id!==id)); };
    return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>Operatörler</h2>
        {hasPerm("admin")&&<Btn icon={Plus} onClick={()=>{setNewOp(true);setOpName("");setOpRole("CNC Operatör");setOpShift("Gündüz");}}>Yeni Operatör</Btn>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {operators.map(op=>{
          const activeJ=productionJobs.filter(x=>x.operatorId===op.id&&x.status!=="completed").length;
          const doneJ=productionJobs.filter(x=>x.operatorId===op.id&&x.status==="completed").length;
          return(
          <Card key={op.id}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontWeight:700,fontSize:15}}>{op.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{op.name}</div>
                <div style={{fontSize:12,color:"var(--text-mute)"}}>{op.role} — {op.shift}</div>
              </div>
              <div style={{display:"flex",gap:4}}>
                {hasPerm("admin")&&<button onClick={()=>startEditOp(op)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-mute)",padding:2}}><Edit size={13}/></button>}
                {hasPerm("admin")&&activeJ===0&&<button onClick={()=>deleteOp(op.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:2}}><Trash2 size={13}/></button>}
              </div>
            </div>
            <div style={{display:"flex",gap:14,fontSize:12,color:"var(--text-sec)"}}><span>Aktif: <strong style={{color:"#3b82f6"}}>{activeJ}</strong></span><span>Biten: <strong style={{color:"#10b981"}}>{doneJ}</strong></span></div>
          </Card>
        );})}
      </div>
      {(editOp||newOp)&&<Modal title={editOp?"Operatör Düzenle":"Yeni Operatör Ekle"} onClose={()=>{setEditOp(null);setNewOp(false);}} width={400}>
        <Input label="İsim" value={opName} onChange={setOpName} placeholder="Ad Soyad"/>
        <div style={{marginTop:12}}><Input label="Görev" value={opRole} onChange={setOpRole} options={[{value:"CNC Operatör",label:"CNC Operatör"},{value:"Taşlamacı",label:"Taşlamacı"},{value:"Kesimci",label:"Kesimci"},{value:"Lazer Operatör",label:"Lazer Operatör"},{value:"Kalite Kontrol",label:"Kalite Kontrol"},{value:"Diğer",label:"Diğer"}]}/></div>
        <div style={{marginTop:12}}><Input label="Vardiya" value={opShift} onChange={setOpShift} options={[{value:"Gündüz",label:"Gündüz"},{value:"Gece",label:"Gece"},{value:"Tam Gün",label:"Tam Gün"}]}/></div>
        <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}><Btn variant="primary" icon={Save} onClick={saveOp} disabled={!opName.trim()}>Kaydet</Btn></div>
      </Modal>}
    </div>
  );};

  //  USER MANAGEMENT 
  const UserMgmtPage = () => {
    const [editUser,setEditUser]=useState(null);
    const [editPerms,setEditPerms]=useState([]);
    const [editMode,setEditMode]=useState(null); // "perms" | "user" | "new"
    const [euName,setEuName]=useState("");
    const [euUsername,setEuUsername]=useState("");
    const [euPassword,setEuPassword]=useState("");
    const [euRole,setEuRole]=useState("operator");
    const startEdit = u => { setEditUser(u); setEditPerms(userPerms[u.id] || DEFAULT_ROLES[u.role]?.permissions||[]); setEditMode("perms"); };
    const startEditUser = u => { setEditUser(u); setEuName(u.name); setEuUsername(u.username); setEuPassword(u.password); setEuRole(u.role); setEditMode("user"); };
    const startNewUser = () => { setEditUser(null); setEuName(""); setEuUsername(""); setEuPassword("1234"); setEuRole("operator"); setEditMode("new"); };
    const savePerms = () => { 
      const newPerms = {...userPerms, [editUser.id]: editPerms};
      setUserPerms(newPerms); 
      // Update current user's effective permissions if editing self
      if(currentUser?.id===editUser.id) {
        setCurrentUser(p=>({...p}));
      }
      setEditMode(null); setEditUser(null); 
    };
    const saveUser = () => {
      if(!euName.trim()||!euUsername.trim()||!euPassword.trim()) return;
      const dup=users.find(u=>u.username.toLowerCase()===euUsername.trim().toLowerCase()&&u.id!==(editUser?.id));
      if(dup) return alert(`"${euUsername.trim()}" kullanıcı adı zaten "${dup.name}" tarafından kullanılıyor.`);
      if(euPassword.length<8) return alert("Şifre en az 8 karakter olmalı.");
      if(!/[0-9]/.test(euPassword)) return alert("Şifre en az bir rakam içermelidir.");
      let newUsers;
      if(editMode==="new"){
        const id="U"+Date.now();
        const nu={id,name:euName.trim(),username:euUsername.trim(),password:euPassword,role:euRole,avatar:euName.trim()[0].toUpperCase()};
        newUsers=[...users,nu];
        // Server will hash the password for new users
      } else if(editUser) {
        newUsers=users.map(u=>u.id===editUser.id?{...u,name:euName.trim(),username:euUsername.trim(),role:euRole,avatar:euName.trim()[0].toUpperCase()}:u);
        // Send password change separately via socket
        if(socketRef.current) socketRef.current.emit("users:changePassword", {userId: editUser.id, newPassword: euPassword});
        if(currentUser?.id===editUser.id) setCurrentUser(p=>({...p,name:euName.trim(),username:euUsername.trim(),role:euRole,avatar:euName.trim()[0].toUpperCase()}));
      }
      if(newUsers) { setUsers(newUsers); }
      setEditMode(null); setEditUser(null);
    };
    const deleteUser = uid => {
      if(uid===currentUser?.id) return alert("Kendinizi silemezsiniz!");
      const u=users.find(x=>x.id===uid);
      if(!confirm(`"${u?.name||uid}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
      setUsers(p=>p.filter(u=>u.id!==uid));
      setUserPerms(p=>{const np={...p}; delete np[uid]; return np;});
    };
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{margin:0,color:"var(--text-h)",fontSize:22,fontWeight:700}}>Kullanıcı Yönetimi</h2>
          {hasPerm("admin")&&<Btn icon={Plus} onClick={startNewUser}>Yeni Kullanıcı</Btn>}
        </div>
        <Card>
          <div className="tbl-wrap"><table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid var(--border-h)"}}>{["Kullanıcı","Rol","Kullanıcı Adı","Yetki Sayısı","İşlem"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,color:"var(--text-mute)",fontWeight:600,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map(u=>{
                const actualPerms = userPerms[u.id] || DEFAULT_ROLES[u.role]?.permissions || [];
                const role=DEFAULT_ROLES[u.role];
                return(
                  <tr key={u.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:8,background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontWeight:700,fontSize:13}}>{u.avatar}</div><div><div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{u.name}</div></div></div></td>
                    <td style={{padding:"10px 12px"}}><Badge color="#8b5cf6" bg="rgba(139,92,246,0.15)">{role?.label}</Badge></td>
                    <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-sec)"}}>{u.username}</td>
                    <td style={{padding:"10px 12px",fontSize:13,color:"var(--text-sec)"}}>{actualPerms.length}</td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",gap:4}}>
                        {hasPerm("admin")&&<Btn variant="ghost" size="sm" icon={Edit} onClick={()=>startEditUser(u)}>Düzenle</Btn>}
                        <Btn variant="ghost" size="sm" icon={Shield} onClick={()=>startEdit(u)}>Yetkiler</Btn>
                        {hasPerm("admin")&&u.id!==currentUser?.id&&<Btn variant="danger" size="sm" icon={Trash2} onClick={()=>deleteUser(u.id)}/>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </Card>

        {editMode==="perms"&&editUser&&(
          <Modal title={`${editUser.name} — Yetki Düzenleme`} onClose={()=>{setEditMode(null);setEditUser(null);}} width={600}>
            <div style={{marginBottom:14}}><span style={{fontSize:13,color:"var(--text-sec)"}}>Rol: </span><Badge color="#8b5cf6" bg="rgba(139,92,246,0.15)">{DEFAULT_ROLES[editUser.role]?.label}</Badge></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {Object.entries(PERMISSIONS).map(([key,label])=>(
                <label key={key} style={{display:"flex",alignItems:"center",gap:8,padding:8,borderRadius:8,background:editPerms.includes(key)?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${editPerms.includes(key)?"rgba(16,185,129,0.2)":"var(--border)"}`,cursor:"pointer",fontSize:12,color:"var(--text)"}}>
                  <input type="checkbox" checked={editPerms.includes(key)} onChange={e=>{if(e.target.checked) setEditPerms(p=>[...p,key]); else setEditPerms(p=>p.filter(x=>x!==key));}}/>
                  {key==="orders_price"&&<EyeOff size={12} color="#f59e0b"/>}
                  {label}
                </label>
              ))}
            </div>
            <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}><Btn variant="primary" icon={Save} onClick={savePerms}>Kaydet</Btn></div>
          </Modal>
        )}

        {(editMode==="user"||editMode==="new")&&(
          <Modal title={editMode==="new"?"Yeni Kullanıcı Ekle":`${editUser?.name} — Düzenle`} onClose={()=>{setEditMode(null);setEditUser(null);}} width={500}>
            <Input label="Ad Soyad" value={euName} onChange={setEuName} placeholder="Ad Soyad"/>
            <div style={{marginTop:12}}><Input label="Kullanıcı Adı" value={euUsername} onChange={setEuUsername} placeholder="kullanici"/></div>
            <div style={{marginTop:12}}><Input label="Şifre" value={euPassword} onChange={setEuPassword} placeholder="****"/></div>
            <div style={{marginTop:12}}><Input label="Rol" value={euRole} onChange={setEuRole} options={Object.entries(DEFAULT_ROLES).map(([k,v])=>({value:k,label:v.label}))}/></div>
            <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}><Btn variant="primary" icon={Save} onClick={saveUser} disabled={!euName.trim()||!euUsername.trim()||!euPassword.trim()}>Kaydet</Btn></div>
          </Modal>
        )}
      </div>
    );
  };


  // ── Kalite Kodu Yönetimi ──
  const MaterialCodesPage = () => {
    const [newCode,    setNewCode]    = useState("");
    const [newColor,   setNewColor]   = useState("#94a3b8");
    const [delConfirm, setDelConfirm] = useState(null);

    const PRESET_COLORS = [
      "#eab308","#4b5563","#a855f7","#3b82f6","#ef4444",
      "#f97316","#b45309","#94a3b8","#10b981","#14b8a6",
      "#ec4899","#6366f1","#84cc16","#f43f5e","#0ea5e9",
    ];

    const handleAdd = () => {
      const val = newCode.trim().toUpperCase();
      if (!val || materialCodes.find(m => m.value === val)) return;
      createMaterialCode({ value: val, label: val, color: newColor });
      setNewCode(""); setNewColor("#94a3b8");
    };

    const handleDelete = (mc) => {
      const inUse = barStock.some(s => s.materialCode === mc.value);
      setDelConfirm({ id: mc.id, value: mc.value, inUse });
    };

    return (
      <div>
        <h2 style={{margin:"0 0 20px",color:"var(--text-h)",fontSize:22,fontWeight:700}}>🧪 Kalite Kodu Yönetimi</h2>

        <Card style={{marginBottom:20}}>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>Yeni Kalite Kodu Ekle</h3>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{minWidth:160}}>
              <div style={{fontSize:11,color:"var(--text-mute)",fontWeight:600,marginBottom:4}}>KALİTE KODU</div>
              <input value={newCode} onChange={e=>setNewCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}
                placeholder="örn. BE-4, KC-1..." autoCapitalize="characters"
                style={{padding:"8px 12px",borderRadius:7,border:"1px solid var(--border-strong)",background:"var(--bg-card)",color:"var(--text)",fontSize:13,width:"100%",textTransform:"uppercase"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:"var(--text-mute)",fontWeight:600,marginBottom:4}}>RENK</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",maxWidth:300,alignItems:"center"}}>
                {PRESET_COLORS.map(c=>(
                  <button key={c} onClick={()=>setNewColor(c)}
                    style={{width:24,height:24,borderRadius:5,background:c,border:newColor===c?"3px solid #fff":"2px solid transparent",cursor:"pointer",flexShrink:0}}/>
                ))}
                <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)}
                  style={{width:24,height:24,borderRadius:5,border:"none",cursor:"pointer",padding:0}} title="Özel renk"/>
              </div>
            </div>
            <button onClick={handleAdd}
              disabled={!newCode.trim()||!!materialCodes.find(m=>m.value===newCode.trim().toUpperCase())}
              style={{padding:"8px 20px",borderRadius:7,border:"none",background:newCode.trim()?"#10b981":"var(--border)",color:newCode.trim()?"#fff":"var(--text-dim)",cursor:newCode.trim()?"pointer":"not-allowed",fontSize:13,fontWeight:700,height:36,alignSelf:"flex-end"}}>
              ＋ Ekle
            </button>
          </div>
          {materialCodes.find(m=>m.value===newCode.trim().toUpperCase())&&(
            <div style={{marginTop:8,fontSize:12,color:"#f59e0b"}}>⚠ Bu kod zaten mevcut.</div>
          )}
        </Card>

        <Card>
          <h3 style={{margin:"0 0 14px",color:"var(--text-h)",fontSize:15,fontWeight:600}}>
            Mevcut Kalite Kodları
            <span style={{marginLeft:8,fontSize:12,color:"var(--text-mute)",fontWeight:400}}>{materialCodes.length} kod</span>
          </h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {materialCodes.map(mc=>{
              const totalBars = barStock.filter(s=>s.materialCode===mc.value).reduce((a,s)=>a+s.fullBars,0);
              const diaCount  = barStock.filter(s=>s.materialCode===mc.value).length;
              return(
                <div key={mc.id||mc.value} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--bg-hover)"}}>
                  <input type="color" value={mc.color||"#94a3b8"}
                    onChange={e=>mc.id&&updateMaterialCode(mc.id,{color:e.target.value})}
                    style={{width:22,height:22,borderRadius:4,border:"none",cursor:"pointer",padding:0,flexShrink:0}} title="Rengi değiştir"/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--text-h)"}}>{mc.value}</div>
                    <div style={{fontSize:10,color:"var(--text-dim)",marginTop:1}}>
                      {diaCount>0?`${diaCount} çap · ${totalBars} çubuk`:"stok yok"}
                    </div>
                  </div>
                  <button onClick={()=>handleDelete(mc)}
                    style={{width:26,height:26,borderRadius:5,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {delConfirm&&(
          <Modal title="Kalite Kodu Sil" onClose={()=>setDelConfirm(null)} width={440}>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:600,color:"var(--text-h)",marginBottom:10}}>
                <span style={{color:"#ef4444"}}>{delConfirm.value}</span> kodunu silmek istiyorsunuz.
              </div>
              {delConfirm.inUse?(
                <div style={{padding:"10px 14px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",fontSize:13,color:"#ef4444"}}>
                  ⚠️ Bu kod stokta kullanılıyor. Silinirse yeni sipariş ve stok formlarından kaybolur, mevcut stok kayıtları etkilenmez.
                </div>
              ):(
                <div style={{fontSize:13,color:"var(--text-sec)"}}>Bu kod stokta kullanılmıyor.</div>
              )}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setDelConfirm(null)}>İptal</Btn>
              <Btn variant="danger" onClick={()=>{deleteMaterialCode(delConfirm.id);setDelConfirm(null);}}>Sil</Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  };
