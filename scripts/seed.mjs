import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jonzdfunqpenwmvygexk.supabase.co",
  "sb_secret_btVL9N_JEDEmHuSfP5DvAQ_yk2IjDUJ"
);

// ─── SERVICES ────────────────────────────────────────────────────────────────
const services = [
  {
    title: "Equity Advisory",
    description: "Build a high-conviction, research-backed direct equity portfolio tailored to your risk profile and return expectations. Our advisors identify opportunities across large-cap, mid-cap, and small-cap segments - with continuous monitoring, timely entry/exit guidance, and disciplined portfolio reviews to keep your equity investments performing.",
    icon_name: "faArrowTrendUp",
    icon_img: null,
    category: "growth",
    features: ["Large, mid & small-cap coverage", "Timely entry/exit guidance", "Disciplined portfolio reviews"],
    sort_order: 1,
  },
  {
    title: "Mutual Funds",
    description: "Build wealth systematically with expertly curated mutual fund portfolios. We align fund selection across equity, debt, hybrid, ELSS, and international categories to your specific goals, risk profile, and tax situation - backed by disciplined SIP structuring and regular portfolio reviews.",
    icon_name: "faSeedling",
    icon_img: null,
    category: "growth",
    features: ["Systematic Investment Plans (SIP)", "Regular portfolio performance auditing", "Direct and regular fund reviews"],
    sort_order: 2,
  },
  {
    title: "Portfolio Management Services (PMS)",
    description: "For investors seeking a more sophisticated, professionally managed equity portfolio, our PMS offering delivers customized strategies built around your wealth objectives. With a dedicated portfolio manager, higher concentration bets, and direct stock ownership, PMS goes beyond mutual funds to deliver a truly personalized investment experience.",
    icon_name: "faBriefcase",
    icon_img: null,
    category: "pinnacle",
    features: ["Dedicated portfolio manager", "Direct stock ownership", "Truly personalized strategy"],
    sort_order: 3,
  },
  {
    title: "Capital Shield",
    description: "Capital Shield Product lets you capture market-linked upside tied to your chosen underlying instrument — Nifty, Gold, or Bonds — with the comfort of capital protection built in. Designed for investors who want to participate in market growth without taking on full market risk, this is a smarter way to stay invested across asset classes.",
    icon_name: "faShieldHalved",
    icon_img: null,
    category: "growth",
    features: ["Capital protection built in", "Upside linked to chosen underlying (Nifty / Gold / Bonds)", "Reduced full market risk exposure"],
    sort_order: 4,
  },
  {
    title: "Specialised Investment Funds (SIF)",
    description: "A new, SEBI-regulated investment category bridging the gap between mutual funds and PMS. SIFs offer flexible, higher-conviction strategies with lower entry thresholds than PMS - ideal for experienced investors seeking differentiated portfolio exposure with professional oversight.",
    icon_name: "faHandHoldingDollar",
    icon_img: null,
    category: "pinnacle",
    features: ["SEBI-regulated category", "Higher-conviction strategies", "Lower entry threshold than PMS"],
    sort_order: 5,
  },
  {
    title: "Alternative Investment Funds (AIF)",
    description: "Access institutional-grade investment opportunities beyond traditional asset classes. Our AIF solutions span private equity, venture capital, hedge funds, and real estate strategies - designed for sophisticated investors looking to diversify and enhance portfolio returns with carefully managed risk.",
    icon_name: "faCoins",
    icon_img: null,
    category: "pinnacle",
    features: ["Private equity & venture capital", "Hedge funds & real estate", "Institutional-grade opportunities"],
    sort_order: 6,
  },
  {
    title: "Loan Against Shares & Mutual Funds",
    description: "Unlock liquidity without liquidating your long-term investments. Our LAS/LAMF facility lets you access funds at competitive interest rates, using your existing portfolio as collateral - so your wealth keeps growing while you meet immediate requirements.",
    icon_name: "faPercent",
    icon_img: null,
    category: "anchor",
    features: ["Competitive interest rates", "Portfolio stays intact & growing", "Quick access to liquidity"],
    sort_order: 7,
  },
  {
    title: "Bonds & NCDs",
    description: "Invest in government securities, corporate bonds, and non-convertible debentures for stable, predictable income. Our fixed-income specialists curate bond portfolios aligned to your yield expectations, credit risk appetite, and investment tenure - balancing return with capital safety.",
    icon_name: "faBuildingColumns",
    icon_img: null,
    category: "anchor",
    features: ["Government & corporate bonds", "Non-convertible debentures (NCDs)", "Yield-aligned portfolio curation"],
    sort_order: 8,
  },
  {
    title: "Corporate Fixed Deposits",
    description: "Earn higher, stable returns with Corporate Fixed Deposits - a reliable fixed-income option backed by reputed companies and NBFCs. Ideal for investors seeking predictable returns and capital preservation, with flexible tenures to match your financial goals.",
    icon_name: "faVault",
    icon_img: null,
    category: "anchor",
    features: ["Backed by reputed companies & NBFCs", "Flexible tenures available", "Capital preservation focus"],
    sort_order: 9,
  },
  {
    title: "All-in-One Access — Self-Directed Investing",
    description: "A Self-Directed Investing account that complements your advised portfolio — offering ETFs, Equity Mutual Funds, and Options trading, with research, tools, and automation to manage your investments with confidence.",
    icon_name: "custom",
    icon_img: "/aio.png",
    category: "suite",
    features: ["ETFs, Equity MFs & Options trading", "Automated trading via API integration", "Research & tools access", "Complements your advised portfolio"],
    sort_order: 10,
  },
];

// ─── FAQS ────────────────────────────────────────────────────────────────────
const faqs = [
  { question: "Who can invest with Phoenix Financial Services?", answer: "We work with individuals, families, business owners, and institutions across all investment stages — from first-time investors to seasoned HNIs looking for sophisticated wealth strategies.", category: "general", sort_order: 1 },
  { question: "How do I get started?", answer: "Simply reach out through our Contact page or WhatsApp. Our advisors will schedule a free consultation to understand your goals and recommend the right solutions.", category: "general", sort_order: 2 },
  { question: "Is there a minimum investment amount?", answer: "Minimums vary by product — SIPs can start as low as ₹500, while PMS requires a minimum of ₹50 lakhs as per SEBI guidelines. Our advisors will guide you to the right entry point.", category: "general", sort_order: 3 },
  { question: "What products does Phoenix Financial Services offer?", answer: "We offer a complete suite across Mutual Funds, Equity Advisory, PMS, AIF, SIF, Capital Shield, Bonds & NCDs, Corporate Fixed Deposits, Loan Against Shares & Mutual Funds, and a Self-Directed Investing platform.", category: "products", sort_order: 1 },
  { question: "What is a Structured Capital Protection Plan?", answer: "It is a market-linked investment product that gives you participation in NIFTY's upside while protecting your principal — ideal for investors who want equity exposure without full market risk.", category: "products", sort_order: 2 },
  { question: "What is the difference between PMS and Mutual Funds?", answer: "Mutual Funds pool money from multiple investors into a diversified portfolio. PMS offers a directly owned, customised equity portfolio managed by a dedicated portfolio manager — suited for investors with higher capital and sophisticated requirements.", category: "products", sort_order: 3 },
  { question: "Can I take a loan against my existing investments?", answer: "Yes. Our Loan Against Shares & Mutual Funds (LAS/LAMF) facility lets you unlock liquidity from your existing portfolio at competitive rates — without having to sell your investments.", category: "products", sort_order: 4 },
  { question: "How does Phoenix Financial Services select investments?", answer: "Every recommendation is research-driven and aligned to your specific goals, risk appetite, and time horizon. We do not follow a one-size-fits-all approach.", category: "fees", sort_order: 1 },
  { question: "How often will my portfolio be reviewed?", answer: "We conduct periodic portfolio reviews and proactive rebalancing as market conditions evolve — ensuring your investments stay aligned to your goals at every stage.", category: "fees", sort_order: 2 },
  { question: "Are your advisors SEBI registered?", answer: "Yes. Phoenix Financial Services operates in full compliance with SEBI and AMFI guidelines across all distribution and broking activities as an authorised Sharekhan partner.", category: "fees", sort_order: 3 },
  { question: "Is my money safe with Phoenix Financial Services?", answer: "Your investments are held directly in your name with SEBI-registered custodians, AMCs, and depositories — Phoenix Financial Services acts as your advisor, not a custodian of your funds.", category: "loans", sort_order: 1 },
  { question: "How is Phoenix Financial Services regulated?", answer: "We are a SEBI and AMFI compliant firm and an authorised Sharekhan partner, operating under the full regulatory framework governing financial advisory and distribution in India.", category: "loans", sort_order: 2 },
];

// ─── SITE CONTENT ─────────────────────────────────────────────────────────────
const siteContent = [
  {
    id: "hero",
    content: {
      title: "Investing for the Future",
      subtitle: "At Phoenix Financial Services, wealth creation is research-backed, client-first, and built around you. Our deep market expertise spans advisory, asset management, fixed income. From highly-customized guidance to easy, accessible investing — invest however suits you best.",
      tagline: "Your wealth deserves expert hands.",
      cta_primary: "Explore Our Services",
      cta_secondary: "Speak to an Advisor",
      image_url: "/hero.png",
    },
  },
  {
    id: "about_home",
    content: {
      heading: "Building Wealth with Integrity",
      lead: "At Phoenix Financial Services, wealth management isn't one-size-fits-all.",
      body: "Every investor has different goals, risk appetites, and timelines — so we built our firm around comprehensive, tailored solutions under one roof. Whether you're chasing aggressive equity growth or seeking stable fixed-income returns, our expert team is equipped to guide you there.",
      image_url: "/meeting.png",
      badge_value: "100%",
      badge_label: "Client Focus",
    },
  },
  {
    id: "about_page",
    content: {
      hero_title: "About Phoenix Financial Services",
      hero_subtitle: "Most financial firms offer products. We build plans. Phoenix Financial Services was established on the belief that lasting wealth demands structure, discipline, and expertise — not generic advice. Since inception, we have partnered with families, business owners, and institutions to build financial legacies that endure beyond market cycles.",
      section_heading: "Building Wealth With Integrity & Clarity",
      lead: "We understand that every investor brings a unique set of goals, risk appetites, and timelines to the table.",
      body_1: "Phoenix Financial Services was built around one founding belief — that comprehensive, tailored wealth solutions should be available under one roof, without compromise. Whether you are pursuing aggressive equity growth, building a stable fixed-income portfolio, or seeking sophisticated alternative strategies, our expert team is equipped to guide you at every stage.",
      body_2: "We take a disciplined, compliance-first approach — helping clients optimise portfolios, eliminate inefficiencies, and rebalance assets with precision — ensuring every decision is built around long-term net returns, not short-term noise.",
      why_invest_heading: "Why Invest With Us?",
      why_invest_body: "Together, we can help define your priorities for today and help you build a better tomorrow for you and your family. Our team combines research-driven insight with genuine, one-on-one guidance — so every recommendation is built around your goals, not a generic playbook.",
      image_url: "/meeting.png",
    },
  },
  {
    id: "home_services",
    content: {
      section_heading: "Our Core Services",
      section_subtitle: "Comprehensive wealth solutions built on expertise, compliance, and a client-first approach.",
      cards: [
        { title: "Advisory", desc: "Strategic, research-driven guidance to help you navigate equity markets and make informed investment decisions.", icon_name: "faArrowTrendUp" },
        { title: "Asset Management", desc: "Professionally managed portfolios — including mutual funds, PMS, and alternate investments — tailored to your wealth goals.", icon_name: "faBriefcase" },
        { title: "Fixed Income", desc: "Stable, predictable returns through government bonds, corporate bonds, and fixed deposits — with a focus on capital preservation.", icon_name: "faBuildingColumns" },
      ],
    },
  },
  {
    id: "process_steps",
    content: {
      section_heading: "Our Investment Process",
      section_subheading: "A systematic, disciplined approach to building and protecting your wealth.",
      steps: [
        { step_number: 1, title: "1. Discovery", description: "We understand your financial goals, current portfolio, and risk tolerance through a detailed consultation." },
        { step_number: 2, title: "2. Strategy", description: "Our experts design a personalized asset allocation plan aligned to your financial goals and risk appetite, ensuring your capital is positioned for sustained growth." },
        { step_number: 3, title: "3. Execution", description: "Seamless implementation of your allocation plan, translating strategy into action with precision and discipline." },
        { step_number: 4, title: "4. Review", description: "Continuous monitoring and proactive rebalancing as market conditions evolve, keeping your portfolio aligned with your goals." },
      ],
    },
  },
  {
    id: "goals",
    content: {
      section_heading: "What Are Your Goals?",
      section_subheading: "Together, we can help define your priorities for today and help you build a better tomorrow for you and your family. Our team combines research-driven insight with genuine, one-on-one guidance — so every recommendation is built around your goals, not a generic playbook.",
      goals: [
        { title: "Prepare for Retirement", description: "Build a retirement corpus that lets you live life on your own terms. We help you plan a disciplined investment strategy across equity, fixed income, and structured products to ensure financial independence in your golden years.", image: "/goal_retirement.png" },
        { title: "Invest for Education", description: "Give your child's future the head start it deserves. Whether it's higher education in India or abroad, we help you plan and invest systematically to meet rising education costs without compromising your other financial goals.", image: "/goal_education.png" },
        { title: "Anticipate Milestones", description: "From buying a home to planning a wedding or a dream vacation, life's big moments deserve careful financial planning. We help you build a portfolio that's ready when your milestones arrive.", image: "/goal_milestones.png" },
      ],
    },
  },
  {
    id: "home_faq",
    content: {
      section_heading: "Frequently Asked Questions",
      section_subheading: "Clarity before commitment. Find answers to the questions that matter most about investing with Phoenix Financial Services.",
    },
  },
  {
    id: "home_contact",
    content: {
      section_heading: "Get in Touch",
      section_subheading: "Speak with our expert advisors today — and take the first step toward structured, long-term wealth management",
    },
  },
  {
    id: "contact_info",
    content: {
      phone_landline: "020 6689 3715",
      phone_mobile: "+91 70212 10788",
      whatsapp: "917021210788",
      email: "phoenixcfe@gmail.com",
      pune_address: "708, Global Business Hub, Kharadi, Pune 411014",
      mumbai_address: "11, Brahamsiddhi, Century Bazar Lane, Worli, Mumbai 400025",
    },
  },
  {
    id: "site_settings",
    content: {
      footer_about: "Dedicated to providing transparent, expert-driven wealth management and financial advisory services for a secure tomorrow.",
      disclaimer: "Phoenix Financial Services is an AMFI-registered Mutual Fund Distributor and an authorised Sharekhan partner. Investments in securities markets are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future returns. This website is for informational purposes only and does not constitute investment advice.",
      whatsapp_channel: "https://www.whatsapp.com/channel/0029VbCzSKm9RZAZ8MBQCS3I",
      compliance: {
        amfi: { label: "AMFI", reg: null },
        bse: { label: "BSE", reg: "AP0107480100941" },
        nse: { label: "NSE", reg: "AP206911451" },
        mcx: { label: "MCX", reg: "AP33944" },
      },
    },
  },
];

// ─── SEED ─────────────────────────────────────────────────────────────────────
async function seed() {
  // Services — delete all then re-insert
  console.log("Seeding services...");
  await supabase.from("services").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: sErr } = await supabase.from("services").insert(services);
  if (sErr) { console.error("Services error:", sErr.message); } else { console.log(`✓ ${services.length} services inserted`); }

  // FAQs — delete all then re-insert
  console.log("Seeding FAQs...");
  await supabase.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: fErr } = await supabase.from("faqs").insert(faqs);
  if (fErr) { console.error("FAQs error:", fErr.message); } else { console.log(`✓ ${faqs.length} FAQs inserted`); }

  // Site content — upsert by id
  console.log("Seeding site content...");
  const { error: cErr } = await supabase.from("site_content").upsert(siteContent, { onConflict: "id" });
  if (cErr) { console.error("Site content error:", cErr.message); } else { console.log(`✓ ${siteContent.length} content sections upserted`); }

  console.log("\nDone! Database is seeded.");
}

seed();
