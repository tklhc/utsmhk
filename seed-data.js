// ═══════════════════════════════════════
// Seed Data
// ═══════════════════════════════════════
const SAMPLE_ORDERS = [
  {
    id:"SIP-2026-001",customerId:"220-42-001",customerCode:"220-42-001",customerName:"ASELKON HİDROLİK METAL DEMİR ÇELİK MÜH.MAK.SAN.VE TİC.A.Ş.",date:"2026-02-10",
    deliveryDate:"2026-02-28",status:"production",priority:"high",notes:"Acil sipariş",
    orderType:"production",currency:"EUR",
    items:[{id:"I1",productType:"Std. Freze",toolCode:"MHK-E4050",productCode:"Ø4x50",diameter:4,length:50,qty:500,unitPrice:3.20,
      coatingType:"Latuma",coatingCompanyId:"CK3",materialCode:"BE-1",grinding:"",grindingType:"",
      estimatedMinutes:120,pdfs:[]}]
  },
  {
    id:"SIP-2026-002",customerId:"220-42-014",customerCode:"220-42-014",customerName:"RETAY SİLAH OTO.",date:"2026-02-12",
    deliveryDate:"2026-03-10",status:"production",priority:"normal",notes:"",
    orderType:"production",currency:"EUR",
    items:[
      {id:"I2",productType:"Küre Freze",toolCode:"MHK-EG6075",productCode:"Ø6x75",diameter:6,length:75,qty:200,unitPrice:5.50,
        coatingType:"ALTİN",coatingCompanyId:"CK2",materialCode:"BE-1",grinding:true,grindingType:"Studer Taşlama",
        estimatedMinutes:240,pdfs:[]},
      {id:"I3",productType:"Matkap",toolCode:"MHK-D8100",productCode:"Ø8x100",diameter:8,length:100,qty:150,unitPrice:7.80,
        coatingType:"AlCrN",coatingCompanyId:"CK1",materialCode:"BE-2",grinding:true,grindingType:"Kares Taşlama",
        estimatedMinutes:180,pdfs:[]}
    ]
  },
  {
    id:"SIP-2026-003",customerId:"120-34-001",customerCode:"120-34-001",customerName:"CERATİZE TÜRKİYE KESİCİ VE KARBÜR ÇÖZÜMLER LTD.ŞTİ.",date:"2026-02-14",
    deliveryDate:"2026-03-15",status:"pending",priority:"normal",notes:"Bileme siparişi",
    orderType:"bileme",currency:"TRY",
    items:[
      {id:"I4",diameter:10,islem:"Komple Bileme + Kaplama",qty:80,unitPrice:125.00,
        coatingType:"ALTİN",coatingCompanyId:"CK2",estimatedMinutes:90,pdfs:[]},
      {id:"I5",diameter:6,islem:"Alın Bileme",qty:200,unitPrice:55.00,
        coatingType:"",coatingCompanyId:"",estimatedMinutes:60,pdfs:[]}
    ]
  }
];

// 
// UI COMPONENTS
// 
