// ═══════════════════════════════════════
// Constants & Helpers
// ═══════════════════════════════════════
const { useState, useEffect, useCallback, useMemo, useRef } = React;

// Simple SVG icon components
function _mkIcon(children) {
  return function IconComponent(props) {
    var p = props || {};
    var size = p.size || 24;
    var color = p.color || "currentColor";
    var style = p.style || {};
    return React.createElement("svg", {
      width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
      style: style, className: p.className || ""
    }, children);
  };
}
function _p(d,k) { return React.createElement("path", {d: d, key: k}); }
function _c(cx,cy,r,k) { return React.createElement("circle", {cx:cx,cy:cy,r:r, key: k}); }
function _r(x,y,w,h,rx,k) { return React.createElement("rect", {x:x,y:y,width:w,height:h,rx:rx||0,ry:rx||0, key: k}); }
function _l(x1,y1,x2,y2,k) { return React.createElement("line", {x1:x1,y1:y1,x2:x2,y2:y2, key: k}); }
function _pg(pts,k) { return React.createElement("polygon", {points:pts, key: k}); }

var Package = _mkIcon([_p("M16.5 9.4 7.55 4.24","a"),_p("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z","b"),_p("M3.27 6.96 12 12.01l8.73-5.05","c"),_p("M12 22.08V12","d")]);
var ClipboardList = _mkIcon([_r(8,2,8,4,1,"a"),_p("M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2","b"),_p("M12 11h4","c"),_p("M12 16h4","d"),_p("M8 11h.01","e"),_p("M8 16h.01","f")]);
var Scissors = _mkIcon([_c(6,6,3,"a"),_c(6,18,3,"b"),_p("M20 4 8.12 15.88","c"),_p("M14.47 14.48 20 20","d"),_p("M8.12 8.12 12 12","e")]);
var Factory = _mkIcon([_p("M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z","a"),_p("M17 18h1","b"),_p("M12 18h1","c"),_p("M7 18h1","d")]);
var CheckCircle2 = _mkIcon([_c(12,12,10,"a"),_p("M9 12l2 2 4-4","b")]);
var Zap = _mkIcon([_pg("13 2 3 14 12 14 11 22 21 10 12 10 13 2","a")]);
var Layers = _mkIcon([_p("M12 2 2 7l10 5 10-5-10-5Z","a"),_p("M2 17l10 5 10-5","b"),_p("M2 12l10 5 10-5","c")]);
var Truck = _mkIcon([_p("M1 3h15v13H1z","a"),_p("M16 8h4l3 3v5h-7V8z","b"),_c(5.5,18.5,2.5,"c"),_c(18.5,18.5,2.5,"d")]);
var Plus = _mkIcon([_p("M12 5v14","a"),_p("M5 12h14","b")]);
var Search = _mkIcon([_c(11,11,8,"a"),_p("M21 21l-4.35-4.35","b")]);
var ChevronRight = _mkIcon([_p("M9 18l6-6-6-6","a")]);
var ChevronDown = _mkIcon([_p("M6 9l6 6 6-6","a")]);
var ChevronLeft = _mkIcon([_p("M15 18l-6-6 6-6","a")]);
var Clock = _mkIcon([_c(12,12,10,"a"),_p("M12 6v6l4 2","b")]);
var AlertTriangle = _mkIcon([_p("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","a"),_p("M12 9v4","b"),_p("M12 17h.01","c")]);
var BarChart3 = _mkIcon([_p("M18 20V10","a"),_p("M12 20V4","b"),_p("M6 20v-6","c")]);
var Calendar = _mkIcon([_r(3,4,18,18,2,"a"),_p("M16 2v4","b"),_p("M8 2v4","c"),_p("M3 10h18","d")]);
var Users = _mkIcon([_p("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","a"),_c(9,7,4,"b"),_p("M23 21v-2a4 4 0 0 0-3-3.87","c"),_c(16,3.13,4,"d")]);
var Settings = _mkIcon([_c(12,12,3,"a"),_p("M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z","b")]);
var Eye = _mkIcon([_p("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","a"),_c(12,12,3,"b")]);
var EyeOff = _mkIcon([_p("M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94","a"),_p("M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19","b"),_p("M1 1l22 22","c"),_p("M14.12 14.12a3 3 0 1 1-4.24-4.24","d")]);
var Play = _mkIcon([_pg("5 3 19 12 5 21 5 3","a")]);
var Square = _mkIcon([_r(3,3,18,18,2,"a")]);
var Check = _mkIcon([_p("M20 6L9 17l-5-5","a")]);
var X = _mkIcon([_p("M18 6L6 18","a"),_p("M6 6l12 12","b")]);
var Printer = _mkIcon([_p("M6 9V2h12v7","a"),_p("M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2","b"),_p("M6 14h12v8H6z","c")]);
var FileText = _mkIcon([_p("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","a"),_p("M14 2v6h6","b"),_p("M16 13H8","c"),_p("M16 17H8","d"),_p("M10 9H8","e")]);
var ArrowRight = _mkIcon([_p("M5 12h14","a"),_p("M12 5l7 7-7 7","b")]);
var Filter = _mkIcon([_pg("22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3","a")]);
var RefreshCw = _mkIcon([_p("M23 4v6h-6","a"),_p("M1 20v-6h6","b"),_p("M3.51 9a9 9 0 0 1 14.85-3.36L23 10","c"),_p("M1 14l4.64 4.36A9 9 0 0 0 20.49 15","d")]);
var Monitor = _mkIcon([_r(2,3,20,14,2,"a"),_p("M8 21h8","b"),_p("M12 17v4","c")]);
var User = _mkIcon([_p("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","a"),_c(12,7,4,"b")]);
var Box = _mkIcon([_p("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z","a"),_p("M3.27 6.96 12 12.01l8.73-5.05","b"),_p("M12 22.08V12","c")]);
var Tag = _mkIcon([_p("M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z","a"),_l(7,7,7.01,7,"b")]);
var CircleDot = _mkIcon([_c(12,12,10,"a"),_c(12,12,1,"b")]);
var Hash = _mkIcon([_p("M4 9h16","a"),_p("M4 15h16","b"),_p("M10 3L8 21","c"),_p("M16 3l-2 18","d")]);
var Gauge = _mkIcon([_p("M12 15.5A3.5 3.5 0 1 0 8.5 12 3.5 3.5 0 0 0 12 15.5Z","a"),_p("M19.14 9.15a8 8 0 1 0 1.56 5.35","b")]);
var TrendingUp = _mkIcon([_p("M23 6l-9.5 9.5-5-5L1 18","a"),_p("M17 6h6v6","b")]);
var Edit = _mkIcon([_p("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","a"),_p("M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z","b")]);
var Trash2 = _mkIcon([_p("M3 6h18","a"),_p("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2","b"),_p("M10 11v6","c"),_p("M14 11v6","d")]);
var Save = _mkIcon([_p("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","a"),_p("M17 21v-8H7v8","b"),_p("M7 3v5h8","c")]);
var ArrowDown = _mkIcon([_p("M12 5v14","a"),_p("M19 12l-7 7-7-7","b")]);
var ArrowUp = _mkIcon([_p("M12 19V5","a"),_p("M5 12l7-7 7 7","b")]);
var Home = _mkIcon([_p("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","a"),_p("M9 22V12h6v10","b")]);
var Wrench = _mkIcon([_p("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z","a")]);
var Lock = _mkIcon([_r(3,11,18,11,2,"a"),_p("M7 11V7a5 5 0 0 1 10 0v4","b")]);
var Unlock = _mkIcon([_r(3,11,18,11,2,"a"),_p("M7 11V7a5 5 0 0 1 9.9-1","b")]);
var Shield = _mkIcon([_p("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","a")]);
var Upload = _mkIcon([_p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","a"),_p("M17 8l-5-5-5 5","b"),_p("M12 3v12","c")]);
var File = _mkIcon([_p("M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z","a"),_p("M13 2v7h7","b")]);
var Download = _mkIcon([_p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","a"),_p("M7 10l5 5 5-5","b"),_p("M12 15V3","c")]);
var LogOut = _mkIcon([_p("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","a"),_p("M16 17l5-5-5-5","b"),_p("M21 12H9","c")]);
var Bell = _mkIcon([_p("M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","a"),_p("M13.73 21a2 2 0 0 1-3.46 0","b")]);
var Sun = _mkIcon([_p("M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z","a"),_p("M12 1v2","b"),_p("M12 21v2","c"),_p("M4.22 4.22l1.42 1.42","d"),_p("M18.36 18.36l1.42 1.42","e"),_p("M1 12h2","f"),_p("M21 12h2","g"),_p("M4.22 19.78l1.42-1.42","h"),_p("M18.36 5.64l1.42-1.42","i")]);
var Moon = _mkIcon([_p("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z","a")]);
var UserCog = _mkIcon([_p("M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","a"),_c(8.5,7,4,"b"),_c(19,14,2,"c"),_p("M19 8v1","d"),_p("M19 19v1","e"),_p("M22.9 14H22","f"),_p("M16.1 14H15","g")]);
var ShoppingCart = _mkIcon([_c(9,21,1,"a"),_c(20,21,1,"b"),_p("M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6","c")]);
var Receipt = _mkIcon([_p("M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z","a"),_p("M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8","b"),_p("M12 17.5V18","c"),_p("M12 6v.5","d")]);
var Send = _mkIcon([_p("M22 2L11 13","a"),_p("M22 2l-7 20-4-9-9-4 20-7z","b")]);
var BanknoteIcon = _mkIcon([_p("M2 8h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z","a"),_p("M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2","b"),_c(12,12,2,"c")]);

const DEFAULT_COMPANY = {name:"",taxId:"",taxOffice:"",address:"",phone:"",email:"",bankName:"",iban:"",bankBranch:"",defaultVatRate:20,invoicePrefix:"MHK"};


// 
// RBAC — ROLES & PERMISSIONS
// 
const PERMISSIONS = {
  orders_view: "Siparişleri Görüntüle",
  orders_edit: "Sipariş Oluştur/Düzenle",
  orders_price: "Fiyat Bilgisi Görüntüle",
  workorders_view: "İş Emirlerini Görüntüle",
  workorders_edit: "İş Emri Düzenle",
  cutting_view: "Kesimi Görüntüle",
  cutting_edit: "Kesim İşlemleri",
  grinding_view: "Taşlamayı Görüntüle",
  grinding_edit: "Taşlama İşlemleri",
  planning_view: "Planlamayı Görüntüle",
  planning_edit: "Planlama Düzenle",
  production_view: "Üretimi Görüntüle",
  production_edit: "Üretim Başlat/Bitir",
  qc_view: "Kalite Kontrolü Görüntüle",
  qc_edit: "KK Onayı Ver",
  coating_view: "Kaplamayı Görüntüle",
  coating_edit: "Kaplama İşlemleri",
  shipping_view: "Sevkiyatı Görüntüle",
  shipping_edit: "Sevkiyat İşlemleri",
  invoices_view: "Faturaları Görüntüle",
  invoices_edit: "Fatura İşlemleri",
  stock_view: "Stok Görüntüle",
  stock_edit: "Stok Düzenle",
  purchasing_view: "Satın Almayı Görüntüle",
  purchasing_edit: "Satın Alma İşlemleri",
  machines_view: "Makinaları Görüntüle",
  operators_view: "Operatörleri Görüntüle",
  admin: "Yönetici (Tüm Yetkiler)",
};

const DEFAULT_ROLES = {
  admin: { label: "Yönetici", permissions: Object.keys(PERMISSIONS) },
  manager: { label: "Üretim Müdürü", permissions: [
    "orders_view","orders_edit","orders_price","workorders_view","workorders_edit",
    "cutting_view","cutting_edit","grinding_view","grinding_edit","planning_view","planning_edit","production_view","production_edit",
    "qc_view","qc_edit","coating_view","coating_edit","shipping_view","shipping_edit",
    "invoices_view","invoices_edit",
    "stock_view","stock_edit","purchasing_view","purchasing_edit","machines_view","operators_view"
  ]},
  planner: { label: "Planlama Sorumlusu", permissions: [
    "orders_view","workorders_view","workorders_edit","cutting_view","grinding_view",
    "planning_view","planning_edit","production_view","purchasing_view","machines_view","operators_view"
  ]},
  operator: { label: "Operatör", permissions: [
    "orders_view","workorders_view","cutting_view","cutting_edit","grinding_view","grinding_edit",
    "production_view","production_edit","qc_view","qc_edit","stock_view","purchasing_view","machines_view"
  ]},
  viewer: { label: "İzleyici", permissions: [
    "orders_view","workorders_view","cutting_view","grinding_view","planning_view","production_view","qc_view",
    "coating_view","shipping_view","invoices_view","stock_view","purchasing_view","machines_view","operators_view"
  ]},
};

const USERS_SEED = [
  { id: "U1", name: "Taha", username: "taha", role: "admin", avatar: "T" },
  { id: "U2", name: "Ahmet Yılmaz", username: "ahmet", role: "operator", avatar: "A" },
  { id: "U3", name: "Mehmet Kaya", username: "mehmet", role: "operator", avatar: "M" },
  { id: "U4", name: "Fatma Demir", username: "fatma", role: "manager", avatar: "F" },
  { id: "U5", name: "Zeynep Acar", username: "zeynep", role: "planner", avatar: "Z" },
  { id: "U6", name: "Emre Şahin", username: "emre", role: "viewer", avatar: "E" },
];

// 
// DATA
// 
const MACHINES_SEED = [
  { id: "M1", name: "S20-1", type: "CNC", status: "active" },
  { id: "M2", name: "S20-2", type: "CNC", status: "active" },
  { id: "M3", name: "S20-3", type: "CNC", status: "active" },
  { id: "M4", name: "Studer Taşlama", type: "Taşlama", status: "active" },
  { id: "M5", name: "Lazer Markalama", type: "Lazer", status: "active" },
  { id: "M6", name: "Kesim Tezgahı", type: "Kesim", status: "active" },
  { id: "M8", name: "S22-1", type: "CNC", status: "active" },
  { id: "M9", name: "S22-2", type: "CNC", status: "active" },
  { id: "M10", name: "Saacke", type: "CNC", status: "active" },
];
const OPERATORS_SEED = [
  { id: "O1", name: "Ahmet Yılmaz", role: "CNC Operatör", shift: "Gündüz" },
  { id: "O2", name: "Mehmet Kaya", role: "CNC Operatör", shift: "Gündüz" },
  { id: "O3", name: "Ali Demir", role: "CNC Operatör", shift: "Gece" },
  { id: "O4", name: "Hasan Çelik", role: "Taşlamacı", shift: "Gündüz" },
  { id: "O5", name: "Veli Acar", role: "Kesimci", shift: "Gündüz" },
  { id: "O6", name: "Emre Şahin", role: "Lazer Operatör", shift: "Gündüz" },
];
const MIHENG_INFO = {
  name: "Mihenk Kesici Takımlar San. Tic. Ltd. Şti.",
  address: "Fevzi Çakmak Mh. 10662.Sk No:17/A Karatay/Konya",
};
const KARES_INFO = {
  name: "Kares Kesici Takımlar",
  address: "75.yıl Sultandere Mh. 11279.SK No:12/2 Yunus Emre Kobi Odunpazarı/ESKİŞEHİR",
};
const COATING_COMPANIES_PRODUCTION = [
  { id: "CK1", name: "Akko", fullName: "Akko Makina", address: "Aşağıpınarbaşı Osb Mh. 526 Nolu Sk. No:1 42160 Selçuklu / Konya", tel: "" },
  { id: "CK2", name: "Primus", fullName: "Primus Coating Turkey Kaplama San. Tic. A.Ş.", address: "Işıktepe Organize Sanayi Bölgesi, Beyaz Sokak, No: 4H Nilüfer/Bursa", tel: "" },
  { id: "CK3", name: "Oerlikon Balzers", fullName: "Oerlikon Balzers Kaplama Sanayi ve Ticaret Ltd. Şti.", address: "NOSAB Ihlamur Cad. No:16 / A 16145 Nilüfer / Bursa", tel: "0262 XXX XX XX" },
];
const COATING_COMPANIES_BILEME = [
  { id: "CK1", name: "Akko", fullName: "Akko Makina", address: "Aşağıpınarbaşı Osb Mh. 526 Nolu Sk. No:1 42160 Selçuklu / Konya", tel: "" },
  { id: "CK2", name: "Primus", fullName: "Primus Coating Turkey Kaplama San. Tic. A.Ş.", address: "Işıktepe Organize Sanayi Bölgesi, Beyaz Sokak, No: 4H Nilüfer/Bursa", tel: "" },
  { id: "CK3", name: "Oerlikon Balzers", fullName: "Oerlikon Balzers Kaplama Sanayi ve Ticaret Ltd. Şti.", address: "NOSAB Ihlamur Cad. No:16 / A 16145 Nilüfer / Bursa", tel: "0262 XXX XX XX" },
];
const COATING_TYPES_BY_COMPANY = {
  CK1: ["AlCrN","TiN"],
  CK2: ["ALTİN","ALCRN","TISIN","ALTISIN","ZRN"],
  CK3: ["Latuma","Xceed","Alcrn Pro","Alnova","Durana","Tisinos Pro","DLC","Mayura"],
};
const COATING_TYPES_PRODUCTION = [...new Set(Object.values(COATING_TYPES_BY_COMPANY).flat())];
const COATING_TYPES_BILEME = ["ALTİN","ALCRN","TISIN","ALTISIN","ZRN","AlCrN","TiN"];
const DEFAULT_MATERIAL_CODES = [
  { value:"BE-1", label:"BE-1", color:"#eab308" },
  { value:"BE-2", label:"BE-2", color:"#4b5563" },
  { value:"BE-3", label:"BE-3", color:"#a855f7" },
  { value:"BS-1", label:"BS-1", color:"#3b82f6" },
  { value:"BC-1", label:"BC-1", color:"#ef4444" },
  { value:"BM-1", label:"BM-1", color:"#f97316" },
  { value:"BM-2", label:"BM-2", color:"#b45309" },
  { value:"AB-1", label:"AB-1", color:"#94a3b8" },
  { value:"AS-1", label:"AS-1", color:"#94a3b8" },
  { value:"AS-2", label:"AS-2", color:"#94a3b8" },
  { value:"AC-1", label:"AC-1", color:"#94a3b8" },
  { value:"AG-1", label:"AG-1", color:"#94a3b8" },
];
// Runtime'da materialCodes state ile güncellenir (app-core.jsx)
let MATERIAL_CODES = DEFAULT_MATERIAL_CODES;
const GRINDING_TYPES = ["Kares Taşlama","Studer Taşlama"];
const PRODUCT_TYPES = [
  "Std. Freze","Chatter Free Freze","Küre Freze","Radyuslu Freze","Aluminyum Freze",
  "Matkap","Havşalı Matkap","Kademeli Matkap","Çok Kademeli Matkap","Rayba","Konik Rayba"
];
const BILEME_ISLEMLERI = [
  "Alın Bileme","Alın Bileme + Kaplama","Komple Bileme","Komple Bileme + Kaplama",
  "Küre Alın Bileme","Küre Alın Bileme + Kaplama","Radyuslu Alın Bileme",
  "Radyuslu Alın Bileme + Kaplama","Radyuslu Komple Bileme","Radyuslu Komple Bileme + Kaplama",
  "Kademeli Matkap Bileme","Kademeli Matkap Bileme + Kaplama",
];
const BAR_LENGTH = 330; // mm - standard carbide bar length
const STANDARD_DIAMETERS = [2,3,4,5,6,8,10,12,14,16,18,20,22,25,30,32];
const QUALITY_GRADES = MATERIAL_CODES.map(m => m.value);
const CUSTOMERS = [
["220-01-001","TOPRAK MÜH.KESİCİ TAKIM KASIM TOPRAK (GR)"],
["120-07-001","BIML VE WİEDEMANN OTOMASYON SAN.VE TİC.LTD.ŞTİ"],
["120-07-002","MAN MENGENE SANAYİ ALİ KENDİRCİ"],
["120-07-003","ÖZKANLAR AV TÜFEĞİ OTOV.MAK. İNŞ.MLZ.GIDA İTH.İHR.VE TİC.LTD.ŞTİ."],
["120-34-001","CERATİZE TÜRKİYE KESİCİ VE KARBÜR ÇÖZÜMLER LTD.ŞTİ."],
["120-35-001","TORKSAN ENDÜSTRİ MALZ.KESİCİ TAKIM VE ALETLERİ SAN.TİC.LTD.ŞTİ."],
["220-38-001","GLOBAL HIRDAVAT / BAĞLANTI ELEMANLARI"],
["120-42-001","ŞENKELEŞ MAKİNA KESİCİ TAKIMLAR MÜH.SAN. VE TİC.LTD.ŞTİ."],
["120-42-003","AKKO OTO.MAK.HIRD.SAN.TİC.LTD.ŞTİ."],
["220-06-001","MAKTEK ENDÜSTRİ MÜHENDİSLİK HIRDAVAT İTH.İHRC.SAN.VE TİC.LTD.ŞTİ."],
["220-06-003","ZİRVE TAKIM TEKNİK HIRD.İML.İHR.İTH.SAN.VE TİC.LTD.ŞTİ."],
["220-42-001","ASELKON HİDROLİK METAL DEMİR ÇELİK MÜH.MAK.SAN.VE TİC.A.Ş."],
["220-42-002","İHSAN KOÇAK MAKİNA SAN.VE TİC.A.Ş."],
["220-42-003","ALMET OTOMOTİV YEDEK PARÇA"],
["220-42-004","AKDAŞ MAKİNA SİLAH SAN."],
["220-42-005","ALT METAL OTOMASYON"],
["220-42-006","BARAK SİLAH İNŞAAT SAN."],
["220-42-007","BUR MAKİNA SİLAH SAN. HASAN IŞIKLI"],
["220-42-008","DEĞİRMENCİ OTOMATİV VE METAL SAN.A.Ş."],
["220-42-009","DERYA SİLAH SAN.VE TİC."],
["220-42-010","DORLA MAKİNA SAN.TİC.LTD.ŞTİ."],
["220-42-011","FAME OTOMATİV DÖKÜM"],
["220-42-012","FİNAL AV PAZARLAMA SAN.TİC."],
["220-42-013","GÜNDOĞAR MAKİNA KALIP"],
["220-42-014","RETAY SİLAH OTO."],
["220-42-015","ŞENER SAVUNMA SAN."],
["220-42-016","SANCAK TEKNİK HIRDAVAT MEHMET ÖZGÜNCÜ"],
["220-42-017","REXİMEX AV SAN."],
["220-42-018","YKO TEKNİK HIRDAVAT YUSUF CİHANGİR"],
["220-42-019","SERİN KALIP"],
["220-42-020","SAB OTOMOTİV (BAGEN) YEDEK PARÇA"],
["220-42-021","ÖZERBAŞ MAKİNA OTO"],
["220-42-022","ZETAMAG KARBÜR KESİCİ TAKIM BİLEME"],
["220-42-023","SİTE İNŞAAT TAŞIMACILIK HIRDAVAT"],
["220-42-024","KAÇMAZLAR OTOMOTİV"],
["220-42-025","ÖZDEN OTOMOTİV YEDEK PARÇA"],
["220-42-026","ELKOTEK KESİCİ TAKIM"],
["220-42-027","FERAZ KESİCİ TAKIM"],
["220-42-028","AVCI SİLAH SANAYİ"],
["220-42-029","YÜKSELİŞ MAKİNA ABDULLAH BÜYÜKBAYRAM"],
["220-42-030","BAŞAK TEKNİK HIRDAVAT KESİCİ TAKIM MUSTAFA AVCI"],
["220-42-031","KONEKS PİSTON GÖMLEK A.Ş."],
["220-42-032","TTT OTOMOTİV NAKLİYAT"],
["220-42-033","SARITAŞ MOTOR YENİLEME MAKİNALARI"],
["220-42-034","ERÇETİN MAKİNA SAN."],
["220-42-035","İMA DEĞİRMEN MAK.SAN.MENDERES ALTUNTEPE"],
["220-42-036","MORMED KOZMETİK ESTETİK"],
["220-42-037","TEKNİK MAKİNA KESİCİ TAKIM ARİF SİNEN"],
["220-42-038","AYDINSAN FREN CIRCIRLARI"],
["220-42-039","ARSLAN SİLAH TARIM OTOMOTİV"],
["220-42-040","TÜRKON MAKİNA OTOMOTİV HIRDAVAT PLASTİK"],
["220-42-041","TOSUNOĞLU MOBİLYA A.Ş."],
["220-42-042","DİRİM METAL A.Ş."],
["220-42-043","A.S.C. HİDROLİK ENDÜSTRİ SAN.A.Ş."],
["220-42-044","SUPAR SUPAP VE PARÇA A.Ş."],
["220-42-045","ULUSAN ALÜMİNYUM SAN.A.Ş."],
["220-42-046","SENA KESİCİ TAKIM"],
["220-42-047","ATAKPAR OTO.SAN"],
["220-42-048","FİRMATEK MAKİNA FATİH ÇEKİLMEZ"],
["220-42-049","MOGESAN MOTOR GÖMLEK PİSTON"],
["220-42-050","BİRLİK PLASTİK KALIP FATİH TETİK-ALİ YILMAZ"],
["220-42-051","YURTSAN OTO.VE METAL SAN."],
["220-42-052","ŞEKEROĞLU KİMYA VE PLASTİK A.Ş."],
["220-42-053","KONDÖKSAN DÖKÜM SAN."],
["220-42-054","HEMKO MAKİNA SAN."],
["220-42-055","ÖRNEK ÜÇ TEKERLEK MOT.SAN"],
["220-42-056","MESA MAKİNA DÖKÜM A.Ş."],
["220-42-057","MEHMET ÖZEN MAKİNA SAN.A.Ş."],
["220-42-058","ŞENEL BİLEME"],
["220-42-059","AYKU İDEAL KALİTE OTO.KRANK ŞAFT"],
["220-42-060","GEÇGEL METAL DÖKÜM"],
["220-42-061","ÖZENİR DEĞİRMEN MAKİNA SAN."],
["220-42-062","ÇİFT KARTAL DEĞİRMEN MAKİNALARI"],
["220-42-063","ERTES MAKİNA SAN.TİC.HIRDAVAT HULUSİ AĞDAŞ"],
["220-42-064","YENMAK PİSTON SEGMAN SAN.A.Ş."],
["220-42-065","KONCARE TIBBİ CİHAZLAR GAZ SİST."],
["220-42-066","GELİŞİM ELEKTROMEKANİK"],
["220-42-067","İNNO PİSTON"],
["220-42-068","MEPAŞ TORNA"],
["220-42-069","ALİMOĞLU KALIP"],
["220-42-070","BALMAKSAN ARMS SAVUNMA"],
["220-42-071","HİMMET USTA DEĞİRMEN"],
["220-42-072","BERKON MAKİNA"],
["220-42-073","CASALTA ENDÜSTRİ"],
["220-42-074","ŞEKER AMBALAJ PLASTİK"],
["220-42-075","HONEKS MAKİNA İMALAT"],
["220-42-076","GÜNSOY TEKNİK HIRDAVAT"],
["220-42-077","ERMOX SAVUNMA / ELERTE TR OTOMOTİV"],
["220-42-078","HARS TRAKTÖR VE YEDEK PARÇA"],
["220-42-079","SELÇUKLU KONALSAN ALÜMİNYUM"],
["220-42-080","YILDIZ PUL OTO MOTOR"],
["220-42-081","HİLALSAN MAKİNA ENDST."],
["220-42-082","ANS BUJİ OTOMOTİV"],
["220-42-083","AKDAŞ QUTOOR"],
["220-42-084","TEKELİOĞLU CİVATA SANAYİ"],
["220-42-085","ALTUN DÖKÜM SANAYİ"],
["220-42-086","CANMATEK MAKİNA SANAYİ"],
["220-42-087","AYD OTOMOTİV SANAYİ"],
["220-42-088","GALİPOĞLU HİDROMOS HİDROLİK SAN."],
["220-42-089","BARANOK TAKIM TEZGAHLARI"],
["220-42-090","HİDROKON KONYA HİDROLİK SAN."],
["220-42-091","YUMAK OTOMOTİV MAM.SAN."],
["220-42-092","HEM TEKNİK METAL İŞLEME"],
["220-42-093","S.S.HUĞLU AV TÜFEKLERİ SAN.KOOP."],
["220-42-094","HMS ÖZCEYLANLAR HİDROLİK MAKİNA"],
["220-42-095","TOPRAK MÜH.KESİCİ TAKIM KASIM TOPRAK"],
["220-42-096","TASAŞ ALÜMİNYUM SAN."],
["220-42-097","BÜYÜK EKER BİJON SAN."],
["220-42-098","ÖZMEDİ İNŞAAT TAAH.TURZ."],
["220-42-099","PARANTEZ ARGE SAVUNMA SAN."],
["220-42-100","URBAN ARMS SAVUNMA"],
["220-42-101","BEYCİTY METAL ERDOĞAN UÇAR"],
["220-42-102","ÖZDUMAN TARIM MAKİNALARI"],
["220-42-103","MUSAN METAL TEKNOLOJİLERİ SAN."],
["220-42-104","HS SAVUNMA SANAYİ"],
["220-42-105","AHEN OTOMOTİV"],
["220-42-106","WENTRO MAKİNA SANAYİ"],
["220-42-107","VİZYOM TEKNİK TRAFİK GÜV.SİS."],
["220-42-108","KOÇAK METALURJİ MAK.SAN."],
["220-42-109","MMT KESİCİ TAKIM"],
["220-42-110","SELÇUKLU KESİCİ TAKIMLAR"],
["220-42-111","KAYASU MODÜLER SIVI DEPOLAMA"],
["220-42-112","AKIŞ ASANSÖR"],
["220-42-113","BEYTEKNİK"],
["220-42-114","VATAN ÖZKAYA"],
["220-42-115","CANMATEK"],
["220-42-116","ACV"],
["220-42-117","KAZEL HİDROLİK"],
["220-42-118","MEMAK"],
["220-42-120","MERGEN"],
["220-42-121","FİLKAR"],
["220-42-123","YAVUZSAN"],
["220-42-124","HYDRO GOLD"],
["220-42-125","SRT"],
["220-42-127","İSA ÇOBANOĞLU"],
["220-42-128","SİMYA"],
["220-42-129","TÜRKALSAN İNOVASYON"],
].map(([code,name])=>({code,name}));
const getCustomerName = (code) => CUSTOMERS.find(c=>c.code===code)?.name || code;
const REMNANT_RANGES = [
  { key:"0-45", label:"0–45mm", min:0, max:45 },
  { key:"45-55", label:"45–55mm", min:45, max:55 },
  { key:"55-65", label:"55–65mm", min:55, max:65 },
  { key:"65-82", label:"65–82mm", min:65, max:82 },
  { key:"82-110", label:"82–110mm", min:82, max:110 },
  { key:"110-150", label:"110–150mm", min:110, max:165 },
  { key:"165+", label:"165mm+", min:165, max:999 },
];
const getRemnantRange = (len) => REMNANT_RANGES.find(r => len >= r.min && len < r.max) || (len >= 165 ? REMNANT_RANGES[6] : null);

// Seed: main material codes with representative stock
const BAR_STOCK_SEED = (() => {
  const stock = [];
  const seedQty = {
    "BE-1": {2:100,3:250,4:180,5:320,6:410,8:150,10:200,12:90,14:60,16:45,18:30,20:25,22:20,25:15,30:10,32:8},
    "BE-2": {3:80,4:60,6:120,8:75,10:50,12:35,14:20,16:15},
    "BE-3": {4:40,6:55,8:30,10:20},
    "BS-1": {3:90,4:70,6:100,8:60,10:45,12:25},
    "BC-1": {4:50,6:80,8:45,10:30,12:20},
    "BM-1": {6:65,8:40,10:25,12:15},
    "BM-2": {6:35,8:25,10:15},
  };
  Object.entries(seedQty).forEach(([grade, diameters]) => {
    Object.entries(diameters).forEach(([d, qty]) => {
      const emptyRemnants = {};
      REMNANT_RANGES.forEach(r => { emptyRemnants[r.key] = 0; });
      stock.push({ id: `BS-${grade}-${d}`, diameter: Number(d), materialCode: grade, fullBars: qty, remnants: { ...emptyRemnants } });
    });
  });
  return stock;
})();

const RAW_MATERIALS = BAR_STOCK_SEED; // backward compat
const CURRENCIES = [
  { value:"EUR",label:"€ Euro",symbol:"€" },
  { value:"TRY",label:"₺ TL",symbol:"₺" },
  { value:"USD",label:"$ Dolar",symbol:"$" },
];

// Invoice constants
const VAT_RATES = [
  { value:0, label:"KDV %0" },
  { value:10, label:"KDV %10" },
  { value:20, label:"KDV %20" },
];
const INVOICE_STATUSES = {
  draft: { label:"Taslak", color:"#94a3b8", bg:"rgba(148,163,184,0.15)" },
  sent: { label:"Gönderildi", color:"#3b82f6", bg:"rgba(59,130,246,0.15)" },
  paid: { label:"Ödendi", color:"#10b981", bg:"rgba(16,185,129,0.15)" },
  cancelled: { label:"İptal", color:"#ef4444", bg:"rgba(239,68,68,0.15)" },
  partial: { label:"Kısmi Ödeme", color:"#f59e0b", bg:"rgba(245,158,11,0.15)" },
};

const WORK_START = 8*60;    // 08:00 = 480 min
const WORK_END = 17*60+30;  // 17:30 = 1050 min
const WORK_MINUTES = WORK_END - WORK_START; // 570 min

const genId = () => Math.random().toString(36).substr(2,9);

// Self-managing input that maintains focus during typing
function LocalInput({value,onChange,onBlur,placeholder,style:s2,type,inputMode:im}) {
  const [local,setLocal]=useState(value||"");
  const ref=useRef(null);
  const prevValue=useRef(value);
  useEffect(()=>{if(value!==prevValue.current){setLocal(value||"");prevValue.current=value;}},[value]);
  return <input ref={ref} type={type||"text"} inputMode={im} value={local} placeholder={placeholder}
    onChange={e=>{setLocal(e.target.value);if(onChange)onChange(e.target.value);}}
    onBlur={()=>{if(onBlur)onBlur(local);}} style={s2}/>;
}
const fmtDate = d => new Date(d).toLocaleDateString("tr-TR");
const fmtDateTime = d => new Date(d).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtMoney = (v,c) => { const s=CURRENCIES.find(x=>x.value===c)?.symbol||"€"; return `${s}${Number(v||0).toFixed(2)}`; };

// CSV Export utility
const downloadCSV = (filename, headers, rows) => {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel Turkish chars
  const escape = v => { let s=String(v??""); if(/^[=+\-@\t\r]/.test(s)) s="'"+s; return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s; };
  const csv = BOM + [headers.join(","), ...rows.map(r=>r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename+".csv"; a.click();
  URL.revokeObjectURL(url);
};
const minToTime = m => { const h=Math.floor(m/60); const mm=m%60; return `${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`; };
const fmtTime = minToTime;
const dateStr = d => { const dd=new Date(d); return `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`; };
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const isWeekend = d => { const day=new Date(d).getDay(); return day===0||day===6; };
const nextWorkDay = d => { let r=addDays(d,1); while(isWeekend(r)) r=addDays(r,1); return r; };
const dayLabel = d => new Date(d).toLocaleDateString("tr-TR",{weekday:"short",day:"numeric",month:"short"});



