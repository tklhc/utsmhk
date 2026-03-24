// ═══════════════════════════════════════
// Stock Page
// ═══════════════════════════════════════

  // Hazır kesilmiş standart hammadde ölçüleri (çap × boy mm)
  const PRECUT_SIZES = [
    { diameter:3,  length:50  },
    { diameter:4,  length:50  },
    { diameter:5,  length:55  },
    { diameter:6,  length:55  },
    { diameter:8,  length:65  },
    { diameter:10, length:72  },
    { diameter:12, length:82  },
    { diameter:14, length:82  },
    { diameter:16, length:92  },
    { diameter:18, length:92  },
    { diameter:20, length:104 },
  ];


  const StockPage = () => {
    // Persistent UI state via stockUIRef (app-core) - remount reset yok
    const [, _su] = React.useReducer(function(n){return n+1;}, 0);
    const _s = stockUIRef.current;
    const stockTab = _s.tab;
    const setStockTab = function(v){ _s.tab=v; _su(); };
    const stockOpenGrades = _s.openGrades;
    const setStockOpenGrades = function(fn){ _s.openGrades=typeof fn==="function"?fn(_s.openGrades):fn; _su(); };
    const stockFilterDia = _s.filterDia;
    const setStockFilterDia = function(v){ _s.filterDia=v; _su(); };
    const stockManualOpen = _s.manualOpen;
    const setStockManualOpen = function(v){ _s.manualOpen=typeof v==="function"?v(_s.manualOpen):v; _su(); };
    const stockManualGrade = _s.manualGrade;
    const setStockManualGrade = function(v){ _s.manualGrade=v; _su(); };
    const stockManualDia = _s.manualDia;
    const setStockManualDia = function(v){ _s.manualDia=v; _su(); };
    const stockManualLength = _s.manualLength;
    const setStockManualLength = function(v){ _s.manualLength=v; _su(); };
    const stockManualQty = _s.manualQty;
    const setStockManualQty = function(v){ _s.manualQty=v; _su(); };
    const stockManualRemnantKey = _s.manualRemnantKey;
    const setStockManualRemnantKey = function(v){ _s.manualRemnantKey=v; _su(); };

    // Tüm kaliteler MATERIAL_CODES'dan — tek kaynak
    const allGrades = materialCodes.map(m => m.value);

    const toggleGrade = (grade) =>
      setStockOpenGrades(prev => ({ ...prev, [grade]: !prev[grade] }));

    // barStock'ta bu kalite+çap için satır bul
    const getBarEntry = (grade, dia) =>
      barStock.find(s => s.materialCode === grade && s.diameter === Number(dia));

    // preCutStock'ta bu kalite+çap+boy için kayıt bul
    // Tam çubuk grade'ini P formatına çevir: "BE-1" -> "BE-P-1"
    const toPCode = (grade) => grade.replace(/^([A-Z]+-)(\d+)$/, "$1P-$2");

    const getPrecutQty = (grade, dia, len) => {
      if (!preCutStock) return 0;
      const pCode = toPCode(grade);
      const e = preCutStock.find(p => p.materialCode === pCode && p.diameter === dia && p.length === len);
      return e ? e.qty : 0;
    };

    // ── Stok ayarlama yardımcıları ──
    const adjustBars = (grade, dia, delta) => {
      const existing = getBarEntry(grade, dia);
      if (existing) {
        updateBarStockItem(existing.id, { fullBars: Math.max(0, existing.fullBars + delta) });
      } else if (delta > 0) {
        const emptyRem = Object.fromEntries(REMNANT_RANGES.map(r => [r.key, 0]));
        createBarStockItem({ id: genId(), materialCode: grade, diameter: Number(dia), fullBars: delta, remnants: emptyRem });
      }
    };

    const adjustRemnant = (grade, dia, key, delta) => {
      const existing = getBarEntry(grade, dia);
      if (existing) {
        updateBarStockItem(existing.id, {
          remnants: { ...existing.remnants, [key]: Math.max(0, (existing.remnants?.[key] || 0) + delta) }
        });
      } else if (delta > 0) {
        const emptyRem = Object.fromEntries(REMNANT_RANGES.map(r => [r.key, 0]));
        emptyRem[key] = delta;
        createBarStockItem({ id: genId(), materialCode: grade, diameter: Number(dia), fullBars: 0, remnants: emptyRem });
      }
    };

    const adjustPrecut = (grade, dia, len, delta) => {
      if (!preCutStock) return;
      const pCode = toPCode(grade);
      const existing = preCutStock.find(p => p.materialCode === pCode && p.diameter === dia && p.length === len);
      if (existing) {
        updatePreCutStockItem(existing.id, { qty: Math.max(0, existing.qty + delta) });
      } else if (delta > 0) {
        createPreCutStockItem({ materialCode: pCode, diameter: dia, length: len, qty: delta });
      }
    };

    // ── Manuel giriş submit ──
    const resetManual = () => { setStockManualQty(""); setStockManualGrade(""); setStockManualDia(""); setStockManualLength(""); setStockManualRemnantKey(""); setStockManualOpen(false); };

    const handleManualSubmit = () => {
      const qty = parseInt(stockManualQty);
      if (!stockManualGrade || !stockManualDia || !qty || qty <= 0) return;
      const dia = Number(stockManualDia);
      if (stockTab === "bars") {
        adjustBars(stockManualGrade, dia, qty);
      } else if (stockTab === "precut") {
        const len = Number(stockManualLength);
        if (!len) return;
        adjustPrecut(stockManualGrade, dia, len, qty);
      } else if (stockTab === "remnants") {
        if (!stockManualRemnantKey) return;
        adjustRemnant(stockManualGrade, dia, stockManualRemnantKey, qty);
      }
      resetManual();
    };

    const canSubmit = stockManualGrade && stockManualDia && stockManualQty && parseInt(stockManualQty) > 0 &&
      (stockTab !== "precut" || stockManualLength) &&
      (stockTab !== "remnants" || stockManualRemnantKey);

    const diametersInStock = [...new Set(barStock.map(s => s.diameter))].sort((a, b) => a - b);

    // ── Ortak buton seti (-, +, +10) ──
    const AdjBtn = ({ onClick, label, color, bg, width = 24 }) => (
      <button onClick={onClick} style={{ width, height: 24, borderRadius: 5, border: `1px solid var(--border-strong)`, background: bg, color, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: width > 24 ? "0 6px" : 0, flexShrink: 0 }}>
        {label}
      </button>
    );

    // ── Accordion başlık satırı ──
    const GradeHeader = ({ grade, hasStock, totalBars, totalPrecut, totalRemnants }) => {
      const mc = materialCodes.find(m => m.value === grade);
      const isOpen = stockOpenGrades[grade];
      return (
        <button onClick={() => toggleGrade(grade)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: isOpen ? "rgba(99,102,241,0.08)" : "var(--bg-hover)", cursor: "pointer", marginBottom: isOpen ? 0 : 4, borderBottomLeftRadius: isOpen ? 0 : 8, borderBottomRightRadius: isOpen ? 0 : 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: mc?.color || "#94a3b8", flexShrink: 0, border: "1px solid rgba(255,255,255,0.15)" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-h)", minWidth: 60 }}>{grade}</span>
          {stockTab === "bars" && <span style={{ fontSize: 12, color: totalBars > 0 ? "#10b981" : "var(--text-dim)", marginLeft: 4 }}>{totalBars > 0 ? `${totalBars} çubuk` : "— stok yok"}</span>}
          {stockTab === "precut" && <><span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginLeft: 4 }}>{toPCode(grade)}</span><span style={{ fontSize: 12, color: totalPrecut > 0 ? "#3b82f6" : "var(--text-dim)", marginLeft: 6 }}>{totalPrecut > 0 ? `${totalPrecut} adet` : "— stok yok"}</span></>}
          {stockTab === "remnants" && <span style={{ fontSize: 12, color: totalRemnants > 0 ? "#8b5cf6" : "var(--text-dim)", marginLeft: 4 }}>{totalRemnants > 0 ? `${totalRemnants} parça` : "— stok yok"}</span>}
          <div style={{ marginLeft: "auto", color: "var(--text-mute)", fontSize: 12, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
        </button>
      );
    };

    return (
      <div>
        {/* ── Başlık ── */}
        <div className="mob-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: "var(--text-h)", fontSize: 22, fontWeight: 700 }}>📦 Hammadde & Fire Stok</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {hasPerm("stock_edit") && (
              <button onClick={() => { setStockManualOpen(o => !o); if (stockManualOpen) resetManual(); }}
                style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                ＋ Manuel Giriş
              </button>
            )}
            <Btn variant="ghost" size="sm" icon={Download} onClick={() => downloadCSV(`stok_${new Date().toISOString().slice(0, 10)}`, ["Malzeme", "Çap (mm)", "Tam Çubuk", ...REMNANT_RANGES.map(r => r.label)], barStock.map(s => [s.materialCode, s.diameter, s.fullBars, ...REMNANT_RANGES.map(r => s.remnants?.[r.key] || 0)]))}>CSV</Btn>
          </div>
        </div>

        {/* ── Manuel Giriş Paneli ── */}
        {stockManualOpen && hasPerm("stock_edit") && (
          <Card style={{ marginBottom: 16, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.04)" }}>
            <h4 style={{ margin: "0 0 14px", color: "#10b981", fontSize: 14, fontWeight: 700 }}>
              ＋ Manuel Stok Girişi — {stockTab === "bars" ? "Tam Çubuk" : stockTab === "precut" ? "Hazır Kesilmiş" : "Fire"}
            </h4>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              {/* Kalite */}
              <div style={{ minWidth: 130 }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, marginBottom: 4 }}>KALİTE</div>
                <select value={stockManualGrade} onChange={e => setStockManualGrade(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }}>
                  <option value="">Seç...</option>
                  {materialCodes.map(m => (
                    <option key={m.value} value={m.value}>{m.value}</option>
                  ))}
                </select>
              </div>
              {/* Çap */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, marginBottom: 4 }}>ÇAP (mm)</div>
                <select value={stockManualDia} onChange={e => { setStockManualDia(e.target.value); if (stockTab === "precut") { const found = PRECUT_SIZES.find(p => p.diameter === Number(e.target.value)); if (found) setStockManualLength(String(found.length)); } }}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }}>
                  <option value="">Seç...</option>
                  {[2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 30, 32].map(d => (
                    <option key={d} value={d}>Ø{d}mm</option>
                  ))}
                  <option value="__custom">Diğer</option>
                </select>
                {stockManualDia === "__custom" && (
                  <input type="number" placeholder="mm" onChange={e => setStockManualDia(e.target.value)}
                    style={{ marginTop: 6, padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }} />
                )}
              </div>
              {/* Boy — sadece Hazır Kesilmiş */}
              {stockTab === "precut" && (
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, marginBottom: 4 }}>BOY (mm)</div>
                  <select value={stockManualLength} onChange={e => setStockManualLength(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }}>
                    <option value="">Seç...</option>
                    {PRECUT_SIZES.map(p => <option key={p.length} value={p.length}>{p.length}mm</option>)}
                    <option value="__custom">Diğer</option>
                  </select>
                  {stockManualLength === "__custom" && (
                    <input type="number" placeholder="mm" onChange={e => setStockManualLength(e.target.value)}
                      style={{ marginTop: 6, padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }} />
                  )}
                </div>
              )}
              {/* Fire grubu — sadece Fire */}
              {stockTab === "remnants" && (
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, marginBottom: 4 }}>FIRE GRUBU</div>
                  <select value={stockManualRemnantKey} onChange={e => setStockManualRemnantKey(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }}>
                    <option value="">Seç...</option>
                    {REMNANT_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
              )}
              {/* Adet */}
              <div style={{ minWidth: 90 }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, marginBottom: 4 }}>ADET</div>
                <input type="number" min="1" value={stockManualQty} onChange={e => setStockManualQty(e.target.value)} placeholder="0"
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13, width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleManualSubmit} disabled={!canSubmit}
                  style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: canSubmit ? "#10b981" : "var(--border)", color: canSubmit ? "#fff" : "var(--text-dim)", cursor: canSubmit ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700 }}>
                  Ekle
                </button>
                <button onClick={resetManual}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-mute)", cursor: "pointer", fontSize: 13 }}>
                  İptal
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Tab Switcher ── */}
        <div style={{ marginBottom: 16 }}>
          <TabSwitcher tabs={[{ key: "bars", label: "Tam Çubuk (330mm)", icon: Box }, { key: "precut", label: "Hazır Kesilmiş", icon: Scissors }, { key: "remnants", label: "Fire Stok", icon: Layers }]}
            active={stockTab} onChange={v => { setStockTab(v); setStockManualOpen(false); }} />
        </div>

        {/* ── Çap filtresi ── */}
        <Card style={{ marginBottom: 16, padding: "10px 14px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>Çap Filtresi:</span>
            {[{ value: "", label: "Tümü" }, ...diametersInStock.map(d => ({ value: String(d), label: `Ø${d}` }))].map(opt => (
              <button key={opt.value} onClick={() => setStockFilterDia(opt.value)}
                style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--border-strong)", background: stockFilterDia === opt.value ? "#6366f1" : "transparent", color: stockFilterDia === opt.value ? "#fff" : "var(--text-sec)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* ══════════════════════════════════════
            TAB: Tam Çubuk
        ══════════════════════════════════════ */}
        {stockTab === "bars" && (
          <div>
            {allGrades.map(grade => {
              const mc = materialCodes.find(m => m.value === grade);
              const entries = barStock
                .filter(s => s.materialCode === grade && (!stockFilterDia || s.diameter === Number(stockFilterDia)))
                .sort((a, b) => a.diameter - b.diameter);
              const totalBars = entries.reduce((s, e) => s + e.fullBars, 0);
              const isOpen = stockOpenGrades[grade];

              return (
                <div key={grade} style={{ marginBottom: 6 }}>
                  <GradeHeader grade={grade} hasStock={totalBars > 0} totalBars={totalBars} />
                  {isOpen && (
                    <div style={{ border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", marginBottom: 4 }}>
                      {entries.length === 0 ? (
                        <div style={{ padding: "18px 16px", color: "var(--text-dim)", fontSize: 13 }}>Bu kalite için {stockFilterDia ? `Ø${stockFilterDia}mm` : ""} stok bulunmuyor.</div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                              {["ÇAP", "STOK (adet)", "DURUM", ""].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {entries.map(s => (
                              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ø{s.diameter}mm</td>
                                <td style={{ padding: "9px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 44, color: s.fullBars < 20 ? "#ef4444" : s.fullBars < 50 ? "#f59e0b" : "var(--text)" }}>{s.fullBars}</span>
                                    {hasPerm("stock_edit") && <>
                                      <AdjBtn onClick={() => adjustBars(grade, s.diameter, -1)} label="-" color="#ef4444" bg="rgba(239,68,68,0.1)" />
                                      <AdjBtn onClick={() => adjustBars(grade, s.diameter, 1)} label="+" color="#10b981" bg="rgba(16,185,129,0.1)" />
                                      <AdjBtn onClick={() => adjustBars(grade, s.diameter, 10)} label="+10" color="#3b82f6" bg="rgba(59,130,246,0.1)" width={36} />
                                    </>}
                                  </div>
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  {s.fullBars < 20 ? <Badge color="#ef4444" bg="rgba(239,68,68,0.15)">Kritik</Badge>
                                    : s.fullBars < 50 ? <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">Düşük</Badge>
                                    : <Badge color="#10b981" bg="rgba(16,185,129,0.15)">Yeterli</Badge>}
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  {Object.entries(s.remnants).filter(([, v]) => v > 0).length > 0 && (
                                    <span style={{ fontSize: 10, color: "#8b5cf6" }}>
                                      ♻️ {Object.entries(s.remnants).filter(([, v]) => v > 0).map(([k, v]) => `${REMNANT_RANGES.find(r => r.key === k)?.label}:${v}`).join(", ")}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: Hazır Kesilmiş
        ══════════════════════════════════════ */}
        {stockTab === "precut" && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.1)" }}>
              Standart ölçülerde önceden kesilmiş, üretime hazır çubuklar. Kesim aşamasında tam çubuk harcanmadan önce bu stoktan faydalanılır.
            </div>
            {allGrades.map(grade => {
              const sizeRows = PRECUT_SIZES.filter(p => !stockFilterDia || p.diameter === Number(stockFilterDia));
              const totalPrecut = sizeRows.reduce((s, p) => s + getPrecutQty(grade, p.diameter, p.length), 0)
                + (preCutStock ? preCutStock.filter(p => p.materialCode === toPCode(grade) && !PRECUT_SIZES.some(s => s.diameter === p.diameter && s.length === p.length)).reduce((s, p) => s + p.qty, 0) : 0);
              const isOpen = stockOpenGrades[grade];

              return (
                <div key={grade} style={{ marginBottom: 6 }}>
                  <GradeHeader grade={grade} totalPrecut={totalPrecut} />
                  {isOpen && (
                    <div style={{ border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", marginBottom: 4 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                            {["ÇAP × BOY", "STOK (adet)", "DURUM"].map(h => (
                              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sizeRows.map(p => {
                            const qty = getPrecutQty(grade, p.diameter, p.length);
                            return (
                              <tr key={`${p.diameter}-${p.length}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", opacity: qty === 0 ? 0.5 : 1 }}>
                                <td style={{ padding: "9px 12px" }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ø{p.diameter}mm</span>
                                  <span style={{ fontSize: 12, color: "var(--text-sec)", marginLeft: 6 }}>× {p.length}mm</span>
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 40, color: qty === 0 ? "var(--text-dim)" : qty < 10 ? "#f59e0b" : "var(--text)" }}>{qty}</span>
                                    {hasPerm("stock_edit") && <>
                                      <AdjBtn onClick={() => adjustPrecut(grade, p.diameter, p.length, -1)} label="-" color="#ef4444" bg="rgba(239,68,68,0.1)" />
                                      <AdjBtn onClick={() => adjustPrecut(grade, p.diameter, p.length, 1)} label="+" color="#10b981" bg="rgba(16,185,129,0.1)" />
                                      <AdjBtn onClick={() => adjustPrecut(grade, p.diameter, p.length, 10)} label="+10" color="#3b82f6" bg="rgba(59,130,246,0.1)" width={36} />
                                    </>}
                                  </div>
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  {qty === 0 ? <span style={{ fontSize: 11, color: "var(--text-dim)" }}>—</span>
                                    : qty < 10 ? <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">Az</Badge>
                                    : <Badge color="#3b82f6" bg="rgba(59,130,246,0.15)">Mevcut</Badge>}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Standart dışı özel ölçüler */}
                          {preCutStock && preCutStock
                            .filter(p => p.materialCode === toPCode(grade) && (!stockFilterDia || p.diameter === Number(stockFilterDia)) && !PRECUT_SIZES.some(s => s.diameter === p.diameter && s.length === p.length))
                            .map(p => (
                              <tr key={`custom-${p.id}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(139,92,246,0.03)" }}>
                                <td style={{ padding: "9px 12px" }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ø{p.diameter}mm</span>
                                  <span style={{ fontSize: 12, color: "var(--text-sec)", marginLeft: 6 }}>× {p.length}mm</span>
                                  <span style={{ marginLeft: 6, fontSize: 10, color: "#8b5cf6" }}>özel</span>
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 40, color: p.qty < 10 ? "#f59e0b" : "var(--text)" }}>{p.qty}</span>
                                    {hasPerm("stock_edit") && <>
                                      <AdjBtn onClick={() => adjustPrecut(grade, p.diameter, p.length, -1)} label="-" color="#ef4444" bg="rgba(239,68,68,0.1)" />
                                      <AdjBtn onClick={() => adjustPrecut(grade, p.diameter, p.length, 1)} label="+" color="#10b981" bg="rgba(16,185,129,0.1)" />
                                    </>}
                                  </div>
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  {p.qty < 10 ? <Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">Az</Badge>
                                    : <Badge color="#8b5cf6" bg="rgba(139,92,246,0.15)">Mevcut</Badge>}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: Fire Stok
        ══════════════════════════════════════ */}
        {stockTab === "remnants" && (
          <div>
            {allGrades.map(grade => {
              const entries = barStock
                .filter(s => s.materialCode === grade && (!stockFilterDia || s.diameter === Number(stockFilterDia)) && Object.values(s.remnants).some(v => v > 0))
                .sort((a, b) => a.diameter - b.diameter);
              const totalRemnants = entries.reduce((s, e) => s + Object.values(e.remnants).reduce((a, b) => a + b, 0), 0);
              const isOpen = stockOpenGrades[grade];

              return (
                <div key={grade} style={{ marginBottom: 6 }}>
                  <GradeHeader grade={grade} totalRemnants={totalRemnants} />
                  {isOpen && (
                    <div style={{ border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", marginBottom: 4 }}>
                      {entries.length === 0 ? (
                        <div style={{ padding: "18px 16px", color: "var(--text-dim)", fontSize: 13 }}>Bu kalite için fire stok bulunmuyor.</div>
                      ) : (
                        <div className="tbl-wrap">
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>ÇAP</th>
                                {REMNANT_RANGES.map(r => (
                                  <th key={r.key} style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "var(--text-mute)", fontWeight: 600 }}>{r.label}</th>
                                ))}
                                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>TOPLAM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entries.map(s => {
                                const total = Object.values(s.remnants).reduce((a, b) => a + b, 0);
                                return (
                                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                    <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ø{s.diameter}mm</td>
                                    {REMNANT_RANGES.map(r => {
                                      const v = s.remnants[r.key] || 0;
                                      return (
                                        <td key={r.key} style={{ padding: "6px 4px", textAlign: "center" }}>
                                          {v > 0 ? (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{v}</span>
                                              {hasPerm("stock_edit") && <>
                                                <button onClick={() => adjustRemnant(grade, s.diameter, r.key, -1)} style={{ width: 16, height: 16, borderRadius: 3, border: "none", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>-</button>
                                                <button onClick={() => adjustRemnant(grade, s.diameter, r.key, 1)} style={{ width: 16, height: 16, borderRadius: 3, border: "none", background: "rgba(16,185,129,0.15)", color: "#10b981", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>+</button>
                                              </>}
                                            </div>
                                          ) : <span style={{ fontSize: 12, color: "#334155" }}>—</span>}
                                        </td>
                                      );
                                    })}
                                    <td style={{ padding: "9px 12px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#8b5cf6" }}>{total}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
