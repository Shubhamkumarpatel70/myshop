import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const dictionary = {
    // Navbar & Layout
    "home": { en: "Home", hi: "होम" },
    "company": { en: "Company", hi: "कंपनी" },
    "browse shops": { en: "Browse Shops", hi: "दुकानें देखें" },
    "my shopping": { en: "My Shopping", hi: "मेरी शॉपिंग" },
    "pricing": { en: "Pricing", hi: "कीमतें" },
    "about": { en: "About", hi: "हमारे बारे में" },
    "contact": { en: "Contact", hi: "संपर्क करें" },
    "login": { en: "Login", hi: "लॉगिन" },
    "register": { en: "Register", hi: "रजिस्टर" },
    "dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
    "logout": { en: "Logout", hi: "लॉगआउट" },
    "start free": { en: "Start Free", hi: "मुफ़्त शुरू करें" },
    "start free trial": { en: "Start Free Trial", hi: "मुफ़्त ट्रायल शुरू करें" },
    "view pricing": { en: "View Pricing", hi: "कीमतें देखें" },
    "lookup receipt": { en: "Lookup Receipt", hi: "रसीद खोजें" },

    // Sidebar & Groups
    "main": { en: "Main", hi: "मुख्य" },
    "operations": { en: "Operations", hi: "संचालन / ऑपरेशन्स" },
    "supply chain": { en: "Supply Chain", hi: "आपूर्ति श्रृंखला" },
    "community": { en: "Community", hi: "कम्युनिटी" },
    "administrative": { en: "Administrative", hi: "प्रशासनिक" },
    "overview": { en: "Overview", hi: "समीक्षा / ओवरव्यू" },
    "sales": { en: "Sales", hi: "बिक्री / POS" },
    "shifts": { en: "Shifts", hi: "काम की शिफ्ट" },
    "reports": { en: "Reports", hi: "रिपोर्ट्स" },
    "inventory": { en: "Inventory", hi: "स्टॉक / इन्वेंटरी" },
    "stock ledger": { en: "Stock Ledger", hi: "स्टॉक लेजर" },
    "categories": { en: "Categories", hi: "श्रेणियां" },
    "barcodes": { en: "Barcodes", hi: "बारकोड" },
    "staff": { en: "Staff", hi: "कर्मचारी / स्टाफ" },
    "payments": { en: "Payments", hi: "भुगतान" },
    "share shop": { en: "Share Shop", hi: "दुकान शेयर करें" },
    "customers": { en: "Customers", hi: "ग्राहक" },
    "purchase orders": { en: "Purchase Orders", hi: "खरीद आदेश" },
    "account": { en: "Account", hi: "खाता" },
    "collapse": { en: "Collapse", hi: "छोटा करें" },
    "expand": { en: "Expand", hi: "बड़ा करें" },
    
    // Admin Sidebar Groups & Pages
    "core admin": { en: "Core Admin", hi: "मुख्य एडमिन" },
    "lookup tools": { en: "Lookup Tools", hi: "सर्च टूल्स" },
    "communication": { en: "Communication", hi: "संचार / बातचीत" },
    "system": { en: "System", hi: "सिस्टम सेटिंग्स" },
    "shops": { en: "Shops", hi: "दुकानें" },
    "approvals": { en: "Approvals", hi: "मंजूरी / अप्रूवल" },
    "global staff": { en: "Global Staff", hi: "ग्लोबल स्टाफ" },
    "admin barcodes": { en: "Admin Barcodes", hi: "एडमिन बारकोड" },
    "subscriptions": { en: "Subscriptions", hi: "सब्सक्रिप्शन" },
    "admin sales": { en: "Admin Sales", hi: "एडमिन बिक्री" },
    "admin inventory": { en: "Admin Inventory", hi: "एडमिन इन्वेंटरी" },
    "admin pos": { en: "Admin POs", hi: "एडमिन खरीद" },
    "platform reports": { en: "Platform Reports", hi: "प्लेटफॉर्म रिपोर्ट" },
    "shop finder": { en: "Shop Finder", hi: "दुकान खोजक" },
    "order finder": { en: "Order Finder", hi: "ऑर्डर खोजक" },
    "broadcast": { en: "Broadcast", hi: "प्रसारण / ब्रॉडकास्ट" },
    "queries": { en: "Queries", hi: "पूछताछ / सपोर्ट" },
    "activity": { en: "Activity", hi: "गतिविधि लॉग" },
    "pricing config": { en: "Pricing Config", hi: "कीमत सेटिंग्स" },
    "settings": { en: "Settings", hi: "सेटिंग्स" },
    "platform revenue": { en: "Platform Revenue", hi: "प्लेटफॉर्म राजस्व" },

    // Landing / Home Page Text (Simplified, clean)
    "trusted by growing retail teams": { en: "Trusted by growing retail teams", hi: "बढ़ती हुई रिटेल टीमों का भरोसा" },
    "professional pos & inventory software built for modern stores": { 
        en: "Professional POS & inventory software built for modern stores", 
        hi: "आधुनिक दुकानों के लिए पेशेवर बिलिंग और स्टॉक मैनेजमेंट सॉफ्टवेयर" 
    },
    "manage billing, stock, teams, and reports from one platform. designed for fast daily operations and long-term scalability.": {
        en: "Manage billing, stock, teams, and reports from one platform. Designed for fast daily operations and long-term scalability.",
        hi: "एक ही जगह से बिल, स्टॉक, कर्मचारी और रिपोर्ट मैनेज करें। तेज़ दैनिक काम-काज के लिए विशेष रूप से तैयार।"
    },
    "start free trial": { en: "Start Free Trial", hi: "मुफ़्त ट्रायल शुरू करें" },
    "view pricing": { en: "View Pricing", hi: "कीमतें देखें" },
    "uptime": { en: "Uptime", hi: "अपटाइम" },
    "checkout speed": { en: "Checkout Speed", hi: "चेकआउट स्पीड" },
    "business reports": { en: "Business Reports", hi: "बिजनेस रिपोर्ट" },
    "cloud access": { en: "Cloud Access", hi: "क्लाउड एक्सेस" },
    "today's summary": { en: "Today's Summary", hi: "आज का सारांश" },
    "live store performance": { en: "Live store performance", hi: "लाइव दुकान का प्रदर्शन" },
    "sales": { en: "Sales", hi: "बिक्री" },
    "orders": { en: "Orders", hi: "ऑर्डर" },
    "stock health": { en: "Stock Health", hi: "स्टॉक की स्थिति" },
    "low stock alerts: 4": { en: "Low stock alerts: 4", hi: "कम स्टॉक अलर्ट: 4" },
    "pending invoices: 6": { en: "Pending invoices: 6", hi: "लंबित बिल: 6" },
    "cashier shifts active: 9": { en: "Cashier shifts active: 9", hi: "सक्रिय शिफ्ट: 9" },
    "live": { en: "Live", hi: "लाइव" },
    "capabilities": { en: "Capabilities", hi: "विशेषताएं" },
    "everything your store needs in one workflow": { en: "Everything your store needs in one workflow", hi: "आपकी दुकान की हर ज़रूरत, एक ही जगह पर" },
    "replace disconnected tools with one reliable stack for billing, stock, and reporting.": {
        en: "Replace disconnected tools with one reliable stack for billing, stock, and reporting.",
        hi: "पुराने तरीकों को हटाकर बिलिंग, स्टॉक और रिपोर्टिंग के लिए एक विश्वसनीय सिस्टम अपनाएं।"
    },
    "lightning pos & barcode": { en: "Lightning POS & Barcode", hi: "सुपर-फास्ट बिलिंग और बारकोड" },
    "checkout screens optimized for speed. integrated barcode scanning and keyboard-first inputs for high-volume retail.": {
        en: "Checkout screens optimized for speed. Integrated barcode scanning and keyboard-first inputs for high-volume retail.",
        hi: "तेज़ चेकआउट स्क्रीन। बारकोड स्कैनिंग और आसान इनपुट के साथ तुरंत बिल बनाएं।"
    },
    "whatsapp digital billing": { en: "WhatsApp Digital Billing", hi: "व्हाट्सएप डिजिटल बिलिंग" },
    "instantly share professional digital invoices with customers via whatsapp. save paper, go green, and look modern.": {
        en: "Instantly share professional digital invoices with customers via whatsapp. Save paper, go green, and look modern.",
        hi: "व्हाट्सएप के जरिए ग्राहकों को तुरंत सुंदर डिजिटल इनवॉइस भेजें। कागज बचाएं, आधुनिक बनें।"
    },
    "net profit intelligence": { en: "Net Profit Intelligence", hi: "मुनाफा रिपोर्ट" },
    "real-time daily, monthly, and yearly net profit tracking. automated reports that help you make better decisions.": {
        en: "Real-time daily, monthly, and yearly net profit tracking. Automated reports that help you make better decisions.",
        hi: "दैनिक, मासिक और वार्षिक शुद्ध मुनाफा ट्रैक करें। बेहतर फैसलों के लिए ऑटोमैटिक रिपोर्ट।"
    },
    "auto-restock system": { en: "Auto-Restock System", hi: "ऑटो-रीस्टॉक सिस्टम" },
    "never run out of stock. automatically generate purchase orders and restock inventory when levels are low.": {
        en: "Never run out of stock. Automatically generate purchase orders and restock inventory when levels are low.",
        hi: "स्टॉक कभी खत्म न होने दें। स्टॉक कम होने पर ऑटोमैटिक ऑर्डर तैयार करें।"
    },
    "smart alerts & expiry": { en: "Smart Alerts & Expiry", hi: "स्मार्ट अलर्ट और एक्सपायरी" },
    "native browser push notifications for low stock, expiring batches, and shift closing reports.": {
        en: "Native browser push notifications for low stock, expiring batches, and shift closing reports.",
        hi: "कम स्टॉक, एक्सपायर होने वाली दवाओं/सामान और शिफ्ट बंद करने के लिए तुरंत नोटिफिकेशन।"
    },
    "staff & shift control": { en: "Staff & Shift Control", hi: "स्टाफ और शिफ्ट कंट्रोल" },
    "manage staff roles, track attendance, and monitor cash drawers with secure shift closing protocols.": {
        en: "Manage staff roles, track attendance, and monitor cash drawers with secure shift closing protocols.",
        hi: "कर्मचारियों की हाजिरी, काम और गल्ले (कैश) पर पूरी नज़र रखें।"
    },
    "get started": { en: "Get Started", hi: "शुरू करें" },
    "launch your digital retail operation in days, not months": { en: "Launch your digital retail operation in days, not months", hi: "महीनों नहीं, कुछ ही दिनों में अपनी डिजिटल दुकान शुरू करें" },
    "move from spreadsheets and manual billing to a reliable system with clear visibility and real-time control.": {
        en: "Move from spreadsheets and manual billing to a reliable system with clear visibility and real-time control.",
        hi: "हाथ के काम और बही-खातों से मुक्त होकर एक रीयल-टाइम सुरक्षित सिस्टम अपनाएं।"
    },
    "create account": { en: "Create Account", hi: "खाता बनाएं" },
    "talk to sales": { en: "Talk to Sales", hi: "सेल्स से बात करें" },

    // Login & Register Pages
    "sign in to stocksaathi": { en: "Sign In to StockSaathi", hi: "स्टॉकसाथी में लॉग इन करें" },
    "enter credentials to manage your store layout": { en: "Enter credentials to manage your store layout", hi: "अपनी दुकान का प्रबंधन करने के लिए जानकारी भरें" },
    "email address": { en: "Email Address", hi: "ईमेल एड्रेस" },
    "password": { en: "Password", hi: "पासवर्ड" },
    "sign in": { en: "Sign In", hi: "साइन इन करें" },
    "processing...": { en: "Processing...", hi: "प्रक्रिया जारी है..." },
    "don't have an account?": { en: "Don't have an account?", hi: "क्या आपके पास खाता नहीं है?" },
    "register here": { en: "Register here", hi: "यहाँ रजिस्टर करें" },
    "start your 14-day free trial": { en: "Start your 14-day free trial", hi: "14 दिनों का मुफ़्त ट्रायल शुरू करें" },
    "no credit card required. instant setup.": { en: "No credit card required. Instant setup.", hi: "क्रेडिट कार्ड की आवश्यकता नहीं। तुरंत सेटअप।" },
    "owner name": { en: "Owner Name", hi: "मालिक का नाम" },
    "shop name": { en: "Shop Name", hi: "दुकान का नाम" },
    "phone number": { en: "Phone Number", hi: "फ़ोन नंबर" },
    "confirm password": { en: "Confirm Password", hi: "पासवर्ड की पुष्टि करें" },
    "already have an account?": { en: "Already have an account?", hi: "क्या आपके पास पहले से खाता है?" },
    "login here": { en: "Login here", hi: "यहाँ लॉग इन करें" },

    // Register Page Specific
    "create your account": { en: "Create your account", hi: "अपना खाता बनाएं" },
    "set up your store in a few minutes and start managing billing, stock, and staff from one dashboard.": { 
        en: "Set up your store in a few minutes and start managing billing, stock, and staff from one dashboard.", 
        hi: "कुछ ही मिनटों में अपनी दुकान सेट करें और एक ही डैशबोर्ड से बिल, स्टॉक और स्टाफ मैनेज करना शुरू करें।" 
    },
    "step 1: store profile": { en: "Step 1: Store profile", hi: "चरण 1: दुकान की प्रोफ़ाइल" },
    "step 2: credentials and access": { en: "Step 2: Credentials and access", hi: "चरण 2: क्रेडेंशियल और एक्सेस" },
    "step 3: identity verification (kyc)": { en: "Step 3: Identity Verification (KYC)", hi: "चरण 3: पहचान सत्यापन (KYC)" },
    "your shop name": { en: "Your shop name", hi: "अपनी दुकान का नाम" },
    "full name": { en: "Full name", hi: "पूरा नाम" },
    "continue": { en: "Continue", hi: "जारी रखें" },
    "email": { en: "Email", hi: "ईमेल" },
    "you@shop.com": { en: "you@shop.com", hi: "you@shop.com" },
    "phone": { en: "Phone", hi: "फ़ोन" },
    "+91...": { en: "+91...", hi: "+91..." },
    "create password": { en: "Create password", hi: "पासवर्ड बनाएं" },
    "repeat password": { en: "Repeat password", hi: "पासवर्ड दोबारा दर्ज करें" },
    "4-digit mpin": { en: "4-digit mPIN", hi: "4-अंकों का mPIN" },
    "identity verification required": { en: "Identity Verification Required", hi: "पहचान सत्यापन आवश्यक है" },
    "aadhar card number": { en: "Aadhar Card Number", hi: "आधार कार्ड नंबर" },
    "12-digit aadhar number": { en: "12-digit Aadhar Number", hi: "12-अंकों का आधार नंबर" },
    "aadhar front": { en: "Aadhar Front", hi: "आधार फ्रंट (सामने)" },
    "aadhar back": { en: "Aadhar Back", hi: "आधार बैक (पीछे)" },
    "upload": { en: "Upload", hi: "अपलोड करें" },
    "complete registration": { en: "Complete Registration", hi: "रजिस्ट्रेशन पूरा करें" },

    // Overview Page Specific
    "analyzing operations": { en: "Analyzing Operations", hi: "संचालन का विश्लेषण" },
    "real-time performance metrics": { en: "Real-time Performance Metrics", hi: "वास्तविक समय प्रदर्शन मेट्रिक्स" },
    "business": { en: "Business", hi: "व्यवसाय" },
    "audit": { en: "Audit", hi: "ऑडिट" },
    "a detailed breakdown of your storefront's financial performance and operational efficiency.": {
        en: "A detailed breakdown of your storefront's financial performance and operational efficiency.",
        hi: "आपकी दुकान के वित्तीय प्रदर्शन और परिचालन दक्षता का विस्तृत विवरण।"
    },
    "systems nominal": { en: "Systems Nominal", hi: "सिस्टम सामान्य है" },
    "today's revenue": { en: "Today's Revenue", hi: "आज का राजस्व / बिक्री" },
    "active orders": { en: "Active Orders", hi: "सक्रिय ऑर्डर" },
    "inventory health": { en: "Inventory Health", hi: "स्टॉक की स्थिति" },
    "total shops": { en: "Total Shops", hi: "कुल दुकानें" },
    "network items": { en: "Network Items", hi: "नेटवर्क सामान" },
    "net profit": { en: "Net Profit", hi: "शुद्ध मुनाफा" },
    "low stock shops": { en: "Low Stock Shops", hi: "कम स्टॉक वाली दुकानें" },
    "revenue": { en: "Revenue", hi: "राजस्व / बिक्री" },
    "transactions": { en: "Transactions", hi: "लेन-देन" },
    "low stock": { en: "Low Stock", hi: "कम स्टॉक" },
    "revenue analytics": { en: "Revenue Analytics", hi: "राजस्व विश्लेषण" },
    "growth velocity tracking": { en: "Growth Velocity Tracking", hi: "विकास गति ट्रैकिंग" },
    "optimization engine active": { en: "Optimization Engine Active", hi: "ऑप्टिमाइज़ेशन इंजन सक्रिय है" },
    "system indicates healthy net margins. focus on clearing high-risk items from the watchlist below.": {
        en: "System indicates healthy net margins. Focus on clearing high-risk items from the watchlist below.",
        hi: "सिस्टम स्वस्थ शुद्ध मार्जिन दर्शाता है। नीचे दी गई वॉचलिस्ट से उच्च जोखिम वाली वस्तुओं को हटाने पर ध्यान दें।"
    },
    "avg ticket": { en: "Avg Ticket", hi: "औसत टिकट" },
    "expiry watchlist": { en: "Expiry Watchlist", hi: "एक्सपायरी सूची" },
    "critical: action required": { en: "Critical: Action Required", hi: "महत्वपूर्ण: कार्रवाई आवश्यक है" },
    "alerts": { en: "Alerts", hi: "अलर्ट" },
    "expires": { en: "Expires", hi: "समाप्ति तिथि" },
    "units": { en: "Units", hi: "यूनिट्स" },
    "all assets stable": { en: "All Assets Stable", hi: "सभी संपत्तियां स्थिर हैं" },
    "refill protocol active": { en: "Refill Protocol Active", hi: "रिफिल प्रोटोकॉल सक्रिय है" },
    "items": { en: "Items", hi: "वस्तुएं" },
    "current": { en: "Current", hi: "वर्तमान" },
    "min": { en: "Min", hi: "न्यूनतम" },
    "restock": { en: "Restock", hi: "स्टॉक भरें" },
    "inventory fully operational": { en: "Inventory Fully Operational", hi: "स्टॉक पूर्ण रूप से संचालित है" },
    "network directory": { en: "Network Directory", hi: "नेटवर्क निर्देशिका" },
    "latest merchant onboarding": { en: "Latest Merchant Onboarding", hi: "नवीनतम मर्चेंट ऑनबोर्डिंग" },
    "view all partners": { en: "View All Partners", hi: "सभी पार्टनर्स देखें" },
    "merchant entity": { en: "Merchant Entity", hi: "मर्चेंट इकाई" },
    "ownership": { en: "Ownership", hi: "स्वामित्व" },
    "plan tier": { en: "Plan Tier", hi: "प्लान टियर" },
    "status": { en: "Status", hi: "स्थिति" },
    "registered partners": { en: "Registered partners", hi: "पंजीकृत पार्टनर्स" },
    "across all shops": { en: "Across all shops", hi: "सभी दुकानों में" },
    "platform earnings": { en: "Platform earnings", hi: "प्लेटफ़ॉर्म कमाई" },
    "action required": { en: "Action required", hi: "कार्रवाई आवश्यक है" },
    "selected period": { en: "Selected period", hi: "चयनित अवधि" },
    "calculated earnings": { en: "Calculated earnings", hi: "गणना की गई कमाई" },
    "orders completed": { en: "Orders completed", hi: "पूर्ण किए गए ऑर्डर" },
    "critical inventory": { en: "Critical inventory", hi: "महत्वपूर्ण स्टॉक" },

    // Inventory Page Specific
    "real-time warehouse intelligence": { en: "Real-time Warehouse Intelligence", hi: "वास्तविक समय स्टॉक जानकारी" },
    "stock inventory": { en: "Stock Inventory", hi: "स्टॉक इन्वेंटरी" },
    "stock": { en: "Stock", hi: "स्टॉक" },
    "inventory": { en: "Inventory", hi: "इवेंटरी / स्टॉक" },
    "complete catalog oversight with real-time health metrics, expiry tracking, and procurement automation.": {
        en: "Complete catalog oversight with real-time health metrics, expiry tracking, and procurement automation.",
        hi: "वास्तविक समय स्वास्थ्य मेट्रिक्स, समाप्ति ट्रैकिंग और खरीद स्वचालन के साथ संपूर्ण कैटलॉग निरीक्षण।"
    },
    "export": { en: "Export", hi: "एक्सपोर्ट" },
    "new product": { en: "New Product", hi: "नया उत्पाद" },
    "identify product by name, category or identifier...": {
        en: "Identify product by name, category or identifier...",
        hi: "नाम, श्रेणी या बारकोड द्वारा उत्पाद की पहचान करें..."
    },
    "metric: all items": { en: "Metric: All Items", hi: "सभी सामान" },
    "metric: low stock": { en: "Metric: Low Stock", hi: "कम स्टॉक वाले सामान" },
    "metric: depleted": { en: "Metric: Depleted", hi: "खत्म स्टॉक" },
    "product specification": { en: "Product Specification", hi: "उत्पाद विशिष्टता / नाम" },
    "category": { en: "Category", hi: "श्रेणी" },
    "stock metric": { en: "Stock Metric", hi: "स्टॉक मात्रा" },
    "expiry tracking": { en: "Expiry Tracking", hi: "एक्सपायरी ट्रैकिंग" },
    "price points": { en: "Price Points", hi: "मूल्य बिंदु / कीमत" },
    "health status": { en: "Health Status", hi: "स्वास्थ्य स्थिति" },
    "control": { en: "Control", hi: "नियंत्रण" },
    "no identifier": { en: "NO IDENTIFIER", hi: "कोई बारकोड नहीं" },
    "generic": { en: "GENERIC", hi: "सामान्य" },
    "units in bin": { en: "Units in Bin", hi: "स्टॉक में मौजूद" },
    "expiration": { en: "Expiration", hi: "समाप्ति" },
    "lifetime asset": { en: "Lifetime Asset", hi: "लाइफटाइम उत्पाद" },
    "margin focus": { en: "Margin Focus", hi: "मार्जिन फोकस" },
    "stock alert": { en: "Stock Alert", hi: "स्टॉक अलर्ट" },
    "optimal": { en: "Optimal", hi: "इष्टतम (ठीक है)" },
    "critical": { en: "Critical", hi: "गंभीर स्थिति" },
    "healthy": { en: "Healthy", hi: "स्वस्थ" },
    "modify asset": { en: "Modify Asset", hi: "उत्पाद बदलें" },
    "register asset": { en: "Register Asset", hi: "उत्पाद पंजीकृत करें" },
    "asset identity": { en: "Asset Identity", hi: "उत्पाद पहचान" },
    "assign a visual identifier to this product. high-quality imagery improves catalog navigation and cashier efficiency.": {
        en: "Assign a visual identifier to this product. High-quality imagery improves catalog navigation and cashier efficiency.",
        hi: "इस उत्पाद के लिए चित्र असाइन करें। उच्च-गुणवत्ता वाली छवियां कैटलॉग नेविगेशन और कैशियर दक्षता में सुधार करती हैं।"
    },
    "ai recognition active": { en: "AI Recognition Active", hi: "AI पहचान सक्रिय है" },
    "product designation": { en: "Product Designation", hi: "उत्पाद का नाम" },
    "logical category": { en: "Logical Category", hi: "तार्किक श्रेणी" },
    "select domain": { en: "Select Domain", hi: "श्रेणी चुनें" },
    "bin quantity": { en: "Bin Quantity", hi: "कुल मात्रा" },
    "threshold alert": { en: "Threshold Alert", hi: "न्यूनतम चेतावनी सीमा" },
    "sale valuation (₹)": { en: "Sale Valuation (₹)", hi: "बिक्री मूल्य (₹)" },
    "procurement cost (₹)": { en: "Procurement Cost (₹)", hi: "खरीद लागत (₹)" },
    "global identifier (barcode)": { en: "Global Identifier (Barcode)", hi: "ग्लोबल आइडेंटिफायर (बारकोड)" },
    "scan or type": { en: "Scan or Type", hi: "स्कैन करें या टाइप करें" },
    "identifier vault": { en: "Identifier Vault", hi: "बारकोड वॉल्ट" },
    "ready": { en: "Ready", hi: "तैयार" },
    "vault is empty": { en: "Vault is Empty", hi: "वॉल्ट खाली है" },
    "asset expiration": { en: "Asset Expiration", hi: "उत्पाद समाप्ति तिथि" },
    "cancel operation": { en: "Cancel Operation", hi: "ऑपरेशन रद्द करें" },
    "commit changes": { en: "Commit Changes", hi: "परिवर्तन सहेजें" },
    "confirm entry": { en: "Confirm Entry", hi: "प्रविष्टि की पुष्टि करें" },
    "vision uplink": { en: "Vision Uplink", hi: "विजन अपलिंक (स्कैनर)" },
    "position the barcode within the viewport for synchronization.": {
        en: "Position the barcode within the viewport for synchronization.",
        hi: "सिंक्रनाइज़ेशन के लिए बारकोड को व्यूपोर्ट के भीतर रखें।"
    },

    // About & Contact Pages
    "who we are": { en: "Who We Are", hi: "हम कौन हैं" },
    "our mission": { en: "Our Mission", hi: "हमारा उद्देश्य" },
    "contact us": { en: "Contact Us", hi: "हमसे संपर्क करें" },
    "subject": { en: "Subject", hi: "विषय" },
    "message": { en: "Message", hi: "संदेश" },
    "send message": { en: "Send Message", hi: "संदेश भेजें" },
    "get in touch": { en: "Get in Touch", hi: "संपर्क में रहें" },

    // Dashboard Overview
    "total sales": { en: "Total Sales", hi: "कुल बिक्री" },
    "daily profit": { en: "Daily Profit", hi: "दैनिक लाभ" },
    "low stock": { en: "Low Stock", hi: "कम स्टॉक" },
    "active shifts": { en: "Active Shifts", hi: "सक्रिय शिफ्ट" },
    "quick actions": { en: "Quick Actions", hi: "त्वरित विकल्प" },
    "add product": { en: "Add Product", hi: "सामान जोड़ें" },
    "new sale (pos)": { en: "New Sale (POS)", hi: "नई बिक्री (POS)" },
    "open shift": { en: "Open Shift", hi: "शिफ्ट खोलें" },
    "close shift": { en: "Close Shift", hi: "शिफ्ट बंद करें" },
    "view reports": { en: "View Reports", hi: "रिपोर्ट देखें" },
    "recent activity": { en: "Recent Activity", hi: "हालिया गतिविधि" },
    
    // Dashboard Inventory Table & Form
    "product name": { en: "Product Name", hi: "उत्पाद का नाम" },
    "sku": { en: "SKU", hi: "एसकेयू (SKU)" },
    "category": { en: "Category", hi: "श्रेणी" },
    "price": { en: "Price", hi: "कीमत" },
    "quantity": { en: "Quantity", hi: "मात्रा" },
    "status": { en: "Status", hi: "स्थिति" },
    "actions": { en: "Actions", hi: "कार्रवाई" },
    "edit": { en: "Edit", hi: "बदलें" },
    "delete": { en: "Delete", hi: "हटाएं" },
    "search products...": { en: "Search products...", hi: "सामान खोजें..." },
    "all categories": { en: "All Categories", hi: "सभी श्रेणियां" },
    "add new product": { en: "Add New Product", hi: "नया उत्पाद जोड़ें" },
    "update product": { en: "Update Product", hi: "उत्पाद की जानकारी बदलें" },
    "buying price": { en: "Buying Price", hi: "खरीद मूल्य" },
    "selling price": { en: "Selling Price", hi: "बिक्री मूल्य" },
    "min stock level": { en: "Min Stock Level", hi: "न्यूनतम स्टॉक स्तर" },
    "expiry date": { en: "Expiry Date", hi: "एक्सपायरी डेट" },
    "product description": { en: "Product Description", hi: "उत्पाद का विवरण" },
    "barcode": { en: "Barcode", hi: "बारकोड" },
    "save": { en: "Save", hi: "सुरक्षित करें" },
    "cancel": { en: "Cancel", hi: "रद्द करें" },
    "submit": { en: "Submit", hi: "जमा करें" },

    // My Shop / Sharing Screen
    "storefront online": { en: "Storefront Online", hi: "दुकान लाइव है" },
    "storefront offline": { en: "Storefront Offline", hi: "दुकान ऑफलाइन है" },
    "go live now": { en: "Go Live Now", hi: "लाइव जाएं" },
    "go offline": { en: "Go Offline", hi: "ऑफलाइन जाएं" },
    "preview": { en: "Preview", hi: "पूर्वावलोकन देखें" },
    "whatsapp": { en: "WhatsApp", hi: "व्हाट्सएप" },
    "scan to browse": { en: "Scan to browse", hi: "देखने के लिए स्कैन करें" },
    "broadcast shop": { en: "Broadcast Shop", hi: "दुकान शेयर करें" },
    "active showcase": { en: "Active Showcase", hi: "सक्रिय शोकेस" },
    "showcase registry": { en: "Showcase Registry", hi: "शोकेस सूची" },
    "publicly visible products": { en: "Publicly visible products", hi: "सामने दिखने वाले सामान" },
    "official merchant": { en: "Official Merchant", hi: "आधिकारिक व्यापारी" },
    "live sync": { en: "Live Sync", hi: "लाइव डेटा सिंक" },
    "premium collection": { en: "Premium Collection", hi: "विशेष कलेक्शन" },
    "real-time data": { en: "Real-time Data", hi: "रीयल-टाइम डेटा" },
    "public store": { en: "Public Store", hi: "सार्वजनिक दुकान" },
    "on maintenance": { en: "On Maintenance", hi: "रखरखाव में है / बंद है" },
    "your professional digital catalog is live. share this link with your customers to accept orders and showcase your inventory.": {
        en: "Your professional digital catalog is live. Share this link with your customers to accept orders and showcase your inventory.",
        hi: "आपका पेशेवर डिजिटल कैटलॉग लाइव है। ऑर्डर स्वीकार करने और अपना स्टॉक दिखाने के लिए इस लिंक को अपने ग्राहकों के साथ साझा करें।"
    },
    "your storefront is currently hidden from the public. customers visiting your link will see an offline status message.": {
        en: "Your storefront is currently hidden from the public. Customers visiting your link will see an offline status message.",
        hi: "आपका स्टोरफ्रंट वर्तमान में जनता से छिपा हुआ है। आपके लिंक पर जाने वाले ग्राहकों को एक ऑफ़लाइन स्थिति संदेश दिखाई देगा।"
    },
    "store offline": { en: "Store Offline", hi: "दुकान ऑफलाइन है" },
    "live": { en: "Live", hi: "लाइव" },
    "hidden": { en: "Hidden", hi: "छिपा हुआ" },
    "in stock": { en: "In Stock", hi: "स्टॉक में है" },
    "sold out": { en: "Sold Out", hi: "बिक चुका है" },
    
    // Public Shop View
    "boutique unavailable": { en: "Boutique Unavailable", hi: "दुकान वर्तमान में उपलब्ध नहीं है" },
    "return to portal": { en: "Return to Portal", hi: "पोर्टल पर वापस जाएं" },
    "connect": { en: "Connect", hi: "संपर्क करें" },
    "initializing boutique": { en: "Initializing Boutique", hi: "दुकान शुरू की जा रही है" },
    "the requested digital storefront is currently offline or the security clearance has expired.": {
        en: "The requested digital storefront is currently offline or the security clearance has expired.",
        hi: "अनुरोधित डिजिटल स्टोरफ्रंट वर्तमान में ऑफ़लाइन है या सुरक्षा मंजूरी समाप्त हो गई है।"
    },
    "flagship store": { en: "Flagship Store", hi: "मुख्य दुकान" },
    "curated intelligence": { en: "Curated Intelligence", hi: "क्यूरेटेड इंटेलिजेंस" },
    "experience the future of retail transparency.": {
        en: "Experience the future of retail transparency.",
        hi: "खुदरा पारदर्शिता के भविष्य का अनुभव करें।"
    },
    "verified": { en: "Verified", hi: "सत्यापित" },
    "image pending": { en: "Image Pending", hi: "चित्र अनुपलब्ध है" },
    "limited": { en: "Limited", hi: "सीमित" },
    "essential": { en: "Essential", hi: "आवश्यक सामान" },
    "premium industrial-grade quality assets, inspected and verified for platform standards.": {
        en: "Premium industrial-grade quality assets, inspected and verified for platform standards.",
        hi: "प्रीमियम गुणवत्ता का सामान, प्लेटफ़ॉर्म मानकों के लिए जाँचा और सत्यापित किया गया है।"
    },
    "units syncing": { en: "Units Syncing", hi: "यूनिट्स सिंक हो रही हैं" },
    "depleted": { en: "Depleted", hi: "स्टॉक समाप्त" },
    "vault empty": { en: "Vault Empty", hi: "कोई सामान नहीं मिला" },
    "no assets matched your current category filter. try broadening your search.": {
        en: "No assets matched your current category filter. Try broadening your search.",
        hi: "आपकी वर्तमान श्रेणी फ़िल्टर से कोई उत्पाद मेल नहीं खाता। अपनी खोज का विस्तार करने का प्रयास करें।"
    },
    "professional retail distribution network powered by stocksaathi os. authenticity and real-time synchronization guaranteed.": {
        en: "Professional retail distribution network powered by StockSaathi OS. Authenticity and real-time synchronization guaranteed.",
        hi: "StockSaathi OS द्वारा संचालित पेशेवर खुदरा वितरण नेटवर्क। प्रामाणिकता और वास्तविक समय सिंक्रनाइज़ेशन की गारंटी।"
    },
    "contact protocol": { en: "Contact Protocol", hi: "सम्पर्क सूत्र" },
    "global distribution center": { en: "Global Distribution Center", hi: "वैश्विक वितरण केंद्र" },
    "infrastructure": { en: "Infrastructure", hi: "बुनियादी ढांचा / इन्फ्रास्ट्रक्चर" },
    "stocksaathi retail os": { en: "StockSaathi Retail OS", hi: "स्टॉकसाथी रिटेल ओएस" },
    "verified digital asset": { en: "Verified Digital Asset", hi: "सत्यापित डिजिटल उत्पाद" },
    "integrity": { en: "Integrity", hi: "सर्च / सच्चाई" },
    "protocol": { en: "Protocol", hi: "प्रोटोकॉल" },
    "privacy": { en: "Privacy", hi: "गोपनीयता" },
    "intelligent retail matrix": { en: "Intelligent Retail Matrix", hi: "इंटेलिजेंट रिटेल मैट्रिक्स" },

    // Shifts Page Specific
    "syncing sessions": { en: "Syncing Sessions", hi: "सत्र सिंक हो रहे हैं" },
    "shift control": { en: "Shift Control", hi: "शिफ्ट कंट्रोल" },
    "daily cash registry & audit": { en: "Daily Cash Registry & Audit", hi: "दैनिक नकद रजिस्टर और ऑडिट" },
    "open drawer": { en: "Open Drawer", hi: "गल्ला खोलें" },
    "active session terminal": { en: "Active Session Terminal", hi: "सक्रिय सत्र टर्मिनल" },
    "opening cash": { en: "Opening Cash", hi: "शुरुआती नकद" },
    "pos sales": { en: "POS Sales", hi: "पीओएस बिक्री (POS)" },
    "expected cash": { en: "Expected Cash", hi: "अपेक्षित नकद" },
    "drawer health": { en: "Drawer Health", hi: "गल्ले की स्थिति" },
    "stable": { en: "Stable", hi: "स्थिर है" },
    "staff": { en: "Staff", hi: "स्टाफ" },
    "login": { en: "Login", hi: "लॉगिन" },
    "merchant": { en: "Merchant", hi: "व्यापारी" },
    "reconcile now": { en: "Reconcile Now", hi: "अभी मिलान करें" },
    "verify physical drawer contents to finalize session audit.": {
        en: "Verify physical drawer contents to finalize session audit.",
        hi: "सत्र ऑडिट को अंतिम रूप देने के लिए भौतिक गल्ले की सामग्री को सत्यापित करें।"
    },
    "close & finalize shift": { en: "Close & Finalize Shift", hi: "शिफ्ट बंद करें और अंतिम रूप दें" },
    "registry reconciliation audit": { en: "Registry Reconciliation Audit", hi: "रजिस्ट्री मिलान ऑडिट" },
    "sessions logged": { en: "Sessions Logged", hi: "सत्र दर्ज किए गए" },
    "date & session info": { en: "Date & Session Info", hi: "दिनांक और सत्र की जानकारी" },
    "opening": { en: "Opening", hi: "शुरुआती राशि" },
    "closing": { en: "Closing", hi: "अंतिम राशि" },
    "net settlement": { en: "Net Settlement", hi: "शुद्ध निपटान" },
    "net profit/loss": { en: "Net Profit/Loss", hi: "शुद्ध लाभ/हानि" },
    "balanced": { en: "Balanced", hi: "संतुलित" },
    "pending": { en: "Pending", hi: "लंबित है" },
    "user": { en: "User", hi: "उपयोगकर्ता" },
    "set your starting cash balance": { en: "Set your starting cash balance", hi: "अपनी शुरुआती नकदी निर्धारित करें" },
    "physical opening cash (₹)": { en: "Physical Opening Cash (₹)", hi: "भौतिक शुरुआती नकद (₹)" },
    "initialize shift registry": { en: "Initialize Shift Registry", hi: "शिफ्ट रजिस्ट्री प्रारंभ करें" },
    "discard & close": { en: "Discard & Close", hi: "रद्द करें और बंद करें" },
    "audit drawer": { en: "Audit Drawer", hi: "गल्ले का ऑडिट करें" },
    "verify total physical cash present": { en: "Verify total physical cash present", hi: "मौजूद कुल भौतिक नकदी का सत्यापन करें" },
    "actual cash in hand (₹)": { en: "Actual Cash In Hand (₹)", hi: "वास्तविक उपलब्ध नकदी (₹)" },
    "audit notes (optional)": { en: "Audit Notes (Optional)", hi: "ऑडिट नोट्स (वैकल्पिक)" },
    "any discrepancies or reasons for shortage/excess?": {
        en: "Any discrepancies or reasons for shortage/excess?",
        hi: "कमी या अधिकता का कोई कारण?"
    },
    "finalize audit & close": { en: "Finalize Audit & Close", hi: "ऑडिट पूरा करें और बंद करें" },
    "abort & return": { en: "Abort & Return", hi: "रद्द करें और वापस जाएं" },
    "verified": { en: "Verified", hi: "सत्यापित है" },
    "in-progress": { en: "In-Progress", hi: "प्रगति पर है" },
    "active": { en: "Active", hi: "सक्रिय" },
    "failed to load shift data": { en: "Failed to load shift data", hi: "शिफ्ट डेटा लोड करने में विफल" },
    "shift opened successfully!": { en: "Shift opened successfully!", hi: "शिफ्ट सफलतापूर्वक खोल दी गई!" },
    "shift closed and reconciled!": { en: "Shift closed and reconciled!", hi: "शिफ्ट बंद कर दी गई और मिलान पूरा हुआ!" },
    "failed to open shift": { en: "Failed to open shift", hi: "शिफ्ट खोलने में विफल" },
    "failed to close shift": { en: "Failed to close shift", hi: "शिफ्ट बंद करने में विफल" },
    "total revenue": { en: "Total Revenue", hi: "कुल राजस्व / कुल बिक्री" },
    
    // Customers Page Specific
    "syncing crm registry...": { en: "Syncing CRM Registry...", hi: "CRM रजिस्ट्री सिंक हो रही है..." },
    "customer registry": { en: "Customer Registry", hi: "ग्राहक सूची / रजिस्ट्री" },
    "loyalty management & vip tracking": { en: "Loyalty Management & VIP Tracking", hi: "लॉयल्टी प्रबंधन और वीआईपी ट्रैकिंग" },
    "register customer": { en: "Register Customer", hi: "ग्राहक पंजीकृत करें" },
    "total base": { en: "Total Base", hi: "कुल ग्राहक" },
    "lifetime value": { en: "Lifetime Value", hi: "लाइफटाइम वैल्यू" },
    "vip members": { en: "VIP Members", hi: "वीआईपी सदस्य (VIP)" },
    "search by name or mobile number...": { en: "Search by name or mobile number...", hi: "नाम या मोबाइल नंबर से खोजें..." },
    "all": { en: "All", hi: "सभी" },
    "vip": { en: "VIP", hi: "वीआईपी (VIP)" },
    "new": { en: "New", hi: "नए" },
    "customer identity": { en: "Customer Identity", hi: "ग्राहक पहचान" },
    "lifetime spending": { en: "Lifetime Spending", hi: "कुल खर्च / लाइफटाइम" },
    "visits": { en: "Visits", hi: "दुकान यात्राएं / विज़िट" },
    "tier status": { en: "Tier Status", hi: "टियर स्थिति" },
    "vip star": { en: "VIP Star", hi: "वीआईपी स्टार" },
    "regular": { en: "Regular", hi: "नियमित" },
    "view history": { en: "View History", hi: "इतिहास देखें" },
    "send promo": { en: "Send Promo", hi: "प्रोमो भेजें" },
    "lifetime": { en: "Lifetime", hi: "लाइफटाइम" },
    "last seen": { en: "Last Seen", hi: "आखरी बार देखा गया" },
    "never": { en: "Never", hi: "कभी नहीं" },
    "recent transactions": { en: "Recent Transactions", hi: "हालिया लेनदेन" },
    "retrieving logs...": { en: "Retrieving Logs...", hi: "लॉग्स प्राप्त किए जा रहे हैं..." },
    "send whatsapp promo": { en: "Send WhatsApp Promo", hi: "व्हाट्सएप प्रोमो भेजें" },
    "register client": { en: "Register Client", hi: "ग्राहक दर्ज करें" },
    "add to your loyalty database": { en: "Add to your loyalty database", hi: "अपने लॉयल्टी डेटाबेस में जोड़ें" },
    "customer name": { en: "Customer Name", hi: "ग्राहक का नाम" },
    "mobile number": { en: "Mobile Number", hi: "मोबाइल नंबर" },
    "locality/address (optional)": { en: "Locality/Address (Optional)", hi: "इलाका/पता (वैकल्पिक)" },
    "area, city...": { en: "Area, City...", hi: "क्षेत्र, शहर..." },
    "register & enroll": { en: "Register & Enroll", hi: "दर्ज और नामांकित करें" },
    "failed to load customers": { en: "Failed to load customers", hi: "ग्राहकों को लोड करने में विफल" },
    "customer registered successfully!": { en: "Customer registered successfully!", hi: "ग्राहक सफलतापूर्वक पंजीकृत हुआ!" },
    "registration failed": { en: "Registration failed", hi: "पंजीकरण विफल रहा" },
    "failed to load purchase history": { en: "Failed to load purchase history", hi: "खरीद इतिहास लोड करने में विफल" },
    
    // AdminRevenue Specific
    "initializing financial core...": { en: "Initializing Financial Core...", hi: "वित्तीय कोर प्रारंभ किया जा रहा है..." },
    "financial hub": { en: "Financial Hub", hi: "वित्तीय हब" },
    "revenue reconciliation": { en: "Revenue Reconciliation", hi: "राजस्व समाधान / मिलान" },
    "real-time audit of platform revenue, subscription performance, and growth metrics.": {
        en: "Real-time audit of platform revenue, subscription performance, and growth metrics.",
        hi: "प्लेटफ़ॉर्म राजस्व, सदस्यता प्रदर्शन और विकास मेट्रिक्स का वास्तविक समय ऑडिट।"
    },
    "total lifetime platform earnings": { en: "Total lifetime platform earnings", hi: "कुल लाइफटाइम प्लेटफ़ॉर्म कमाई" },
    "active subscriptions": { en: "Active Subscriptions", hi: "सक्रिय सदस्यताएँ" },
    "pro & enterprise accounts": { en: "Pro & Enterprise accounts", hi: "प्रो और एंटरप्राइज खाते" },
    "total merchants": { en: "Total Merchants", hi: "कुल व्यापारी" },
    "global shop network": { en: "Global shop network", hi: "वैश्विक दुकान नेटवर्क" },
    "live data": { en: "Live Data", hi: "लाइव डेटा" },
    "plan distribution": { en: "Plan Distribution", hi: "प्लान वितरण" },
    "growth momentum": { en: "Growth Momentum", hi: "विकास की गति" },
    "retention rate of pro users": { en: "Retention rate of Pro users", hi: "प्रो उपयोगकर्ताओं की प्रतिधारण दर / रिटेंशन" },
    "avg. revenue": { en: "Avg. Revenue", hi: "औसत राजस्व" },
    "churn rate": { en: "Churn Rate", hi: "मंथन दर / चर्न रेट" },

    // Return Features
    "registry adjustment": { en: "Registry Adjustment", hi: "रजिस्ट्री मिलान / वापसी" },
    "initiate return?": { en: "Initiate Return?", hi: "वापसी शुरू करें?" },
    "this will restock inventory and record a refund.": { en: "This will restock inventory and record a refund.", hi: "यह स्टॉक को दोबारा भर देगा और रिफंड दर्ज करेगा।" },
    "reason for return": { en: "Reason for Return", hi: "वापसी का कारण" },
    "damage, expiry, exchange...": { en: "Damage, Expiry, Exchange...", hi: "नुकसान, एक्सपायरी, एक्सचेंज..." },
    "abort": { en: "Abort", hi: "रद्द करें" },
    "process return": { en: "Process Return", hi: "वापसी दर्ज करें" },
    "returned": { en: "Returned", hi: "वापस किया गया" },
    "return": { en: "Return", hi: "वापस करें" },
    "settlement mode": { en: "Settlement Mode", hi: "भुगतान का प्रकार" },
    "total settlement": { en: "Total Settlement", hi: "कुल भुगतान राशि" },
    "physical bill": { en: "Physical Bill", hi: "प्रिंट रसीद" },
    "digital bill": { en: "Digital Bill", hi: "डिजिटल रसीद" }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key) => {
        if (!key) return '';
        const trimmed = key.toString().trim();
        const lowerKey = trimmed.toLowerCase();
        
        const translation = dictionary[lowerKey];
        if (translation && translation[language]) {
            return translation[language];
        }
        
        // Exact match fallback
        if (dictionary[trimmed] && dictionary[trimmed][language]) {
            return dictionary[trimmed][language];
        }

        return trimmed;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
