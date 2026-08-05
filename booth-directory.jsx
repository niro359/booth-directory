import React, { useState, useMemo, useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   BOOTH — vendor opportunity directory for working artists
   Visual direction: risograph / spot-color screenprint
   Signature element: the Deadline Rail (two-way coupled to the grid)
   All event data below is PLACEHOLDER. Names are real; dates, fees,
   and jury details are invented for layout purposes only.
------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=DM+Mono:wght@400;500&family=Public+Sans:wght@400;500;600;700&display=swap');

.bth {
  --stock:#E7E7E1;
  --stock-2:#F3F3EF;
  --ink:#16182B;
  --ink-70:rgba(22,24,43,.70);
  --ink-45:rgba(22,24,43,.45);
  --ink-15:rgba(22,24,43,.15);
  --ink-08:rgba(22,24,43,.08);
  --pink:#FF4B7D;
  --aqua:#00A0AE;
  --yellow:#FFC42E;
  --grass:#3E8E5A;

  --f-display:'Archivo', 'Helvetica Neue', Arial, sans-serif;
  --f-body:'Public Sans', system-ui, -apple-system, sans-serif;
  --f-data:'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  --ease-pop:cubic-bezier(.2,1.5,.4,1);
  --ease-out:cubic-bezier(.16,1,.3,1);

  background:var(--stock);
  color:var(--ink);
  font-family:var(--f-body);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
.bth *,.bth *::before,.bth *::after{box-sizing:border-box;}
.bth button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;}
.bth input,.bth select{font:inherit;color:inherit;}
.bth ::selection{background:var(--yellow);color:var(--ink);}
.bth :focus-visible{outline:3px solid var(--aqua);outline-offset:2px;}

/* ---------- paper texture ---------- */
.bth-grain{
  position:fixed;inset:0;pointer-events:none;z-index:60;opacity:.35;
  background-image:radial-gradient(var(--ink-08) .5px, transparent .5px);
  background-size:3px 3px;
}

/* ---------- shell ---------- */
.bth-wrap{max-width:1240px;margin:0 auto;padding:0 20px 80px;}

/* ---------- top bar ---------- */
.bth-top{
  display:flex;align-items:center;gap:16px;
  padding:14px 0;border-bottom:2px solid var(--ink);
  position:sticky;top:0;background:var(--stock);z-index:40;
}
.bth-mark{
  font-family:var(--f-display);font-weight:900;font-stretch:125%;
  font-size:24px;letter-spacing:-.02em;line-height:1;text-transform:uppercase;
  display:flex;align-items:center;gap:8px;
}
.bth-mark i{
  display:inline-block;width:11px;height:22px;background:var(--pink);
  box-shadow:4px 0 0 var(--aqua);font-style:normal;
}
.bth-demo{
  font-family:var(--f-data);font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  border:1px solid var(--ink-15);padding:3px 7px;color:var(--ink-45);
}
.bth-top-spacer{flex:1;}
.bth-savedbtn{
  font-family:var(--f-data);font-size:12px;letter-spacing:.04em;
  border:2px solid var(--ink);padding:6px 12px;background:var(--stock-2);
  display:flex;align-items:center;gap:8px;transition:transform .18s var(--ease-pop);
}
.bth-savedbtn:active{transform:scale(.94);}
.bth-savedbtn.on{background:var(--yellow);}
.bth-savedbtn b{font-family:var(--f-data);}

/* ---------- hero / search slab ---------- */
.bth-hero{padding:34px 0 22px;}
.bth-kicker{
  font-family:var(--f-data);font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ink-45);margin-bottom:12px;
}
.bth-h1{
  font-family:var(--f-display);font-weight:900;font-stretch:125%;
  font-size:clamp(38px,7.2vw,74px);line-height:.92;letter-spacing:-.035em;
  text-transform:uppercase;margin:0 0 14px;max-width:16ch;
}
.bth-h1 em{font-style:normal;color:var(--pink);}
.bth-sub{max-width:52ch;font-size:15.5px;line-height:1.5;color:var(--ink-70);margin:0 0 26px;}

.bth-slab{
  border:2.5px solid var(--ink);background:var(--stock-2);
  box-shadow:7px 7px 0 var(--aqua), 14px 14px 0 var(--pink);
  padding:16px;
}
.bth-searchrow{display:flex;gap:10px;align-items:stretch;}
.bth-searchbox{
  flex:1;display:flex;align-items:center;gap:10px;
  border:2px solid var(--ink);background:var(--stock);padding:0 12px;min-height:52px;
}
.bth-searchbox svg{flex:none;}
.bth-searchbox input{
  flex:1;border:none;background:none;outline:none;min-width:0;
  font-family:var(--f-display);font-weight:600;font-size:17px;letter-spacing:-.01em;
}
.bth-searchbox input::placeholder{color:var(--ink-45);font-weight:500;}
.bth-clear{
  font-family:var(--f-data);font-size:11px;letter-spacing:.06em;color:var(--ink-45);
  border:1px solid var(--ink-15);padding:4px 8px;
}
.bth-clear:hover{color:var(--ink);border-color:var(--ink);}

.bth-hint{
  font-family:var(--f-data);font-size:11.5px;color:var(--ink-45);
  margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;
}
.bth-hint button{
  border-bottom:1.5px dotted var(--ink-45);color:var(--ink-70);
  transition:color .15s;
}
.bth-hint button:hover{color:var(--pink);border-color:var(--pink);}

/* ---------- filter chips ---------- */
.bth-filters{margin-top:16px;border-top:1.5px solid var(--ink-15);padding-top:14px;}
.bth-frow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}
.bth-flabel{
  font-family:var(--f-data);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-45);width:74px;flex:none;
}
.bth-chip{
  font-family:var(--f-data);font-size:12px;letter-spacing:.02em;
  border:1.5px solid var(--ink);padding:5px 11px;background:transparent;
  transition:transform .2s var(--ease-pop), background .12s, color .12s;
  display:inline-flex;align-items:center;gap:6px;
}
.bth-chip:hover{background:var(--ink-08);}
.bth-chip:active{transform:scale(.93);}
.bth-chip.on{background:var(--ink);color:var(--stock-2);}
.bth-chip.on.c-pink{background:var(--pink);border-color:var(--pink);color:#fff;}
.bth-chip.on.c-aqua{background:var(--aqua);border-color:var(--aqua);color:#fff;}
.bth-chip.on.c-yellow{background:var(--yellow);border-color:var(--ink);color:var(--ink);}
.bth-chip .dot{width:7px;height:7px;flex:none;}

.bth-dates{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.bth-date{
  font-family:var(--f-data);font-size:12px;border:1.5px solid var(--ink);
  background:var(--stock);padding:5px 8px;
}
.bth-range{display:flex;align-items:center;gap:10px;font-family:var(--f-data);font-size:12px;}
.bth-range input[type=range]{width:150px;accent-color:var(--pink);}

/* ---------- deadline rail (signature) ---------- */
.bth-rail{
  margin-top:34px;border:2.5px solid var(--ink);background:var(--stock-2);
  padding:14px 16px 8px;position:relative;overflow:hidden;
}
.bth-railhead{
  display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px;
}
.bth-railtitle{
  font-family:var(--f-display);font-weight:800;font-stretch:118%;
  font-size:15px;letter-spacing:-.01em;text-transform:uppercase;
}
.bth-railnote{font-family:var(--f-data);font-size:11px;color:var(--ink-45);}
.bth-railbody{position:relative;height:86px;margin-top:4px;}
.bth-railline{
  position:absolute;left:0;right:0;bottom:26px;height:2px;background:var(--ink);
}
.bth-tick{
  position:absolute;bottom:26px;width:3px;transform-origin:bottom center;
  background:var(--aqua);cursor:pointer;
  animation:tickIn .5s var(--ease-pop) both;
  transition:transform .22s var(--ease-pop), width .22s var(--ease-pop);
}
.bth-tick.u-soon{background:var(--pink);}
.bth-tick.u-mid{background:var(--yellow);}
.bth-tick.u-far{background:var(--aqua);}
.bth-tick:hover,.bth-tick.hot{width:7px;transform:scaleY(1.18);}
.bth-tick.hot{box-shadow:0 0 0 2px var(--stock-2), 0 0 0 4px var(--ink);}
@keyframes tickIn{
  0%{transform:scaleY(0);opacity:0;}
  60%{transform:scaleY(1.2);opacity:1;}
  100%{transform:scaleY(1);opacity:1;}
}
.bth-month{
  position:absolute;bottom:0;font-family:var(--f-data);font-size:10px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--ink-45);
  border-left:1px solid var(--ink-15);padding-left:5px;height:22px;
}
.bth-railtip{
  position:absolute;bottom:64px;transform:translateX(-50%);
  background:var(--ink);color:var(--stock-2);padding:5px 9px;
  font-family:var(--f-data);font-size:11px;white-space:nowrap;pointer-events:none;
  animation:tipIn .18s var(--ease-out) both;z-index:5;
}
@keyframes tipIn{from{opacity:0;transform:translate(-50%,6px);}to{opacity:1;transform:translate(-50%,0);}}
.bth-railempty{
  font-family:var(--f-data);font-size:12px;color:var(--ink-45);
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
}

/* ---------- results bar ---------- */
.bth-resbar{
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  margin:30px 0 16px;padding-bottom:12px;border-bottom:2px solid var(--ink);
}
.bth-count{
  font-family:var(--f-display);font-weight:900;font-stretch:125%;
  font-size:30px;letter-spacing:-.03em;line-height:1;
}
.bth-countlabel{font-family:var(--f-data);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-45);}
.bth-sort{
  margin-left:auto;font-family:var(--f-data);font-size:12px;
  border:1.5px solid var(--ink);background:var(--stock-2);padding:6px 8px;
}
.bth-viewtog{display:flex;border:1.5px solid var(--ink);}
.bth-viewtog button{padding:6px 10px;font-family:var(--f-data);font-size:11px;letter-spacing:.06em;}
.bth-viewtog button.on{background:var(--ink);color:var(--stock-2);}

/* ---------- grid ---------- */
.bth-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.bth-grid.list{grid-template-columns:1fr;gap:12px;}
@media(max-width:960px){.bth-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:640px){.bth-grid{grid-template-columns:1fr;}}

/* ---------- card ---------- */
.bth-card{
  border:2.5px solid var(--ink);background:var(--stock-2);
  display:flex;flex-direction:column;position:relative;
  animation:cardIn .52s var(--ease-out) both;
  animation-delay:calc(var(--i) * 34ms);
  transition:transform .26s var(--ease-pop), box-shadow .26s var(--ease-pop);
  will-change:transform;
}
@keyframes cardIn{
  0%{opacity:0;transform:translateY(24px) scale(.95,1.06);}
  58%{opacity:1;transform:translateY(-5px) scale(1.025,.972);}
  80%{transform:translateY(2px) scale(.994,1.008);}
  100%{opacity:1;transform:translateY(0) scale(1,1);}
}
.bth-card:hover,.bth-card.hot{
  transform:translate(-3px,-4px);
  box-shadow:6px 7px 0 var(--aqua);
}
.bth-card.hot{box-shadow:6px 7px 0 var(--pink);}

.bth-poster{position:relative;aspect-ratio:16/9;overflow:hidden;border-bottom:2.5px solid var(--ink);}
.bth-poster svg{display:block;width:100%;height:100%;}
.bth-grid.list .bth-poster{aspect-ratio:auto;width:170px;flex:none;border-bottom:none;border-right:2.5px solid var(--ink);}
.bth-grid.list .bth-card{flex-direction:row;}
@media(max-width:640px){
  .bth-grid.list .bth-card{flex-direction:column;}
  .bth-grid.list .bth-poster{width:100%;aspect-ratio:16/9;border-right:none;border-bottom:2.5px solid var(--ink);}
}

.bth-typetag{
  position:absolute;top:10px;left:10px;
  font-family:var(--f-data);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--ink);color:var(--stock-2);padding:4px 8px;
}
.bth-pin{
  position:absolute;top:8px;right:8px;width:34px;height:34px;
  display:grid;place-items:center;background:var(--stock-2);
  border:2px solid var(--ink);
}
.bth-pin.on{background:var(--yellow);}
.bth-pin.pop{animation:pinPop .42s var(--ease-pop);}
@keyframes pinPop{
  0%{transform:scale(1,1);}28%{transform:scale(.72,1.3);}
  52%{transform:scale(1.32,.74);}76%{transform:scale(.96,1.04);}100%{transform:scale(1,1);}
}
.bth-burst{position:absolute;top:8px;right:8px;width:34px;height:34px;pointer-events:none;}
.bth-burst span{
  position:absolute;top:50%;left:50%;width:5px;height:5px;background:var(--pink);
  animation:burst .5s var(--ease-out) forwards;
}
@keyframes burst{
  0%{transform:translate(-50%,-50%) scale(1);opacity:1;}
  100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0;}
}

.bth-body{padding:14px 15px 15px;display:flex;flex-direction:column;flex:1;}
.bth-name{
  font-family:var(--f-display);font-weight:800;font-stretch:112%;
  font-size:18.5px;line-height:1.08;letter-spacing:-.022em;margin:0 0 5px;
}
.bth-place{
  font-family:var(--f-data);font-size:11.5px;letter-spacing:.04em;
  color:var(--ink-45);text-transform:uppercase;margin-bottom:9px;
}
.bth-desc{
  font-size:13.2px;line-height:1.45;color:var(--ink-70);margin:0 0 13px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.bth-data{
  border-top:1.5px solid var(--ink-15);padding-top:10px;margin-top:auto;
  display:grid;grid-template-columns:1fr 1fr;gap:9px 12px;
}
.bth-datum dt{
  font-family:var(--f-data);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-45);margin-bottom:2px;
}
.bth-datum dd{font-family:var(--f-data);font-size:12.5px;margin:0;letter-spacing:-.01em;}
.bth-badges{display:flex;flex-wrap:wrap;gap:5px;margin-top:12px;}
.bth-badge{
  font-family:var(--f-data);font-size:10px;letter-spacing:.07em;text-transform:uppercase;
  border:1.5px solid var(--ink);padding:3px 7px;
}
.bth-badge.b-pink{background:var(--pink);color:#fff;border-color:var(--pink);}
.bth-badge.b-yellow{background:var(--yellow);}
.bth-badge.b-aqua{background:var(--aqua);color:#fff;border-color:var(--aqua);}
.bth-badge.b-mute{color:var(--ink-45);border-color:var(--ink-15);}
.bth-badge.b-grass{background:var(--grass);color:#fff;border-color:var(--grass);}

/* ---------- empty ---------- */
.bth-empty{
  border:2.5px dashed var(--ink-15);padding:56px 24px;text-align:center;
}
.bth-empty h3{
  font-family:var(--f-display);font-weight:900;font-stretch:118%;font-size:26px;
  text-transform:uppercase;letter-spacing:-.025em;margin:0 0 8px;
}
.bth-empty p{color:var(--ink-70);margin:0 0 18px;font-size:14.5px;}
.bth-reset{
  border:2px solid var(--ink);background:var(--pink);color:#fff;
  font-family:var(--f-data);font-size:12.5px;letter-spacing:.06em;padding:9px 16px;
  transition:transform .2s var(--ease-pop);
}
.bth-reset:active{transform:scale(.94);}

/* ---------- footnote ---------- */
.bth-foot{
  margin-top:44px;border-top:2px solid var(--ink);padding-top:14px;
  font-family:var(--f-data);font-size:11px;color:var(--ink-45);line-height:1.7;
}

@media(prefers-reduced-motion:reduce){
  .bth *,.bth *::before,.bth *::after{
    animation-duration:.001ms !important;animation-delay:0ms !important;
    transition-duration:.001ms !important;
  }
}
`;

/* ------------------------------------------------------------------
   PLACEHOLDER DATA — event names are real, all figures are invented
------------------------------------------------------------------- */
const TYPES = ["Convention", "Art fair", "Craft fair", "Standing market", "Maker market"];

const EVENTS = [
  { id: 1, name: "Wimberley Market Days", org: "Lions Field", city: "Wimberley", state: "TX", type: "Standing market",
    start: "2026-09-05", end: "2026-09-05", deadline: "2026-08-14", fee: 85, attendance: 9000, juried: false, outdoor: true,
    tags: ["monthly", "first saturday", "vintage", "handmade"],
    desc: "First-Saturday open-air market running March through December. Booth spaces are assigned by seniority, with a rolling waitlist for new vendors." },
  { id: 2, name: "Fredericksburg Trade Days", org: "Sunday Farms", city: "Fredericksburg", state: "TX", type: "Standing market",
    start: "2026-08-21", end: "2026-08-23", deadline: "2026-07-31", fee: 190, attendance: 14000, juried: false, outdoor: true,
    tags: ["monthly", "hill country", "antiques"],
    desc: "Three-day Hill Country market held the third weekend of each month across covered barns and open field lots." },
  { id: 3, name: "Bayou City Art Festival", org: "Art Colony Association", city: "Houston", state: "TX", type: "Art fair",
    start: "2026-10-10", end: "2026-10-11", deadline: "2026-07-30", fee: 675, attendance: 30000, juried: true, outdoor: true,
    tags: ["fine art", "jury", "downtown"],
    desc: "Juried fine art festival drawing a national applicant pool across 19 media categories. Panel review with blind scoring." },
  { id: 4, name: "Comicpalooza", org: "Comicpalooza LLC", city: "Houston", state: "TX", type: "Convention",
    start: "2027-01-15", end: "2027-01-17", deadline: "2026-10-02", fee: 425, attendance: 55000, juried: false, outdoor: false,
    tags: ["artist alley", "comics", "cosplay", "pop culture"],
    desc: "Multi-genre pop culture convention with a dedicated Artist Alley. Tables sell out in tiers; early registration opens to prior-year vendors." },
  { id: 5, name: "Armadillo Christmas Bazaar", org: "Armadillo Bazaar", city: "Austin", state: "TX", type: "Craft fair",
    start: "2026-12-12", end: "2026-12-24", deadline: "2026-08-28", fee: 1250, attendance: 40000, juried: true, outdoor: false,
    tags: ["holiday", "jury", "long run", "music"],
    desc: "Two-week juried holiday art market with live music. Long-run format favors vendors with deep inventory and staffing help." },
  { id: 6, name: "Renegade Craft Fair", org: "Renegade", city: "Austin", state: "TX", type: "Craft fair",
    start: "2026-11-21", end: "2026-11-22", deadline: "2026-09-11", fee: 495, attendance: 12000, juried: true, outdoor: false,
    tags: ["modern craft", "jury", "national circuit"],
    desc: "Curated modern craft fair on a national circuit. Accepted vendors are invited to apply to other cities at a reduced rate." },
  { id: 7, name: "First Monday Trade Days", org: "City of Canton", city: "Canton", state: "TX", type: "Standing market",
    start: "2026-09-03", end: "2026-09-06", deadline: "2026-08-05", fee: 240, attendance: 100000, juried: false, outdoor: true,
    tags: ["monthly", "huge", "flea"],
    desc: "One of the largest recurring open-air markets in the country, spanning several hundred acres over four days each month." },
  { id: 8, name: "Cottonwood Art Festival", org: "City of Richardson", city: "Richardson", state: "TX", type: "Art fair",
    start: "2026-10-03", end: "2026-10-04", deadline: "2026-08-07", fee: 550, attendance: 25000, juried: true, outdoor: true,
    tags: ["fine art", "jury", "dfw"],
    desc: "Twice-yearly juried fine art festival in a shaded park setting. Jury reviews three work images plus one booth shot." },
  { id: 9, name: "Blue Genie Art Bazaar", org: "Blue Genie", city: "Austin", state: "TX", type: "Maker market",
    start: "2026-11-27", end: "2026-12-24", deadline: "2026-09-01", fee: 0, attendance: 60000, juried: true, outdoor: false,
    tags: ["consignment", "holiday", "no booth fee"],
    desc: "Consignment-model holiday bazaar. No booth fee or staffing requirement; the venue takes a percentage of sales instead." },
  { id: 10, name: "Anime Matsuri", org: "Anime Matsuri", city: "Houston", state: "TX", type: "Convention",
    start: "2027-03-26", end: "2027-03-28", deadline: "2026-12-15", fee: 380, attendance: 32000, juried: false, outdoor: false,
    tags: ["artist alley", "anime", "fandom"],
    desc: "Anime and Japanese culture convention with a large artist alley and separate dealer hall. Table assignment by registration order." },
  { id: 11, name: "Main Street Fort Worth Arts Festival", org: "Downtown Fort Worth Inc.", city: "Fort Worth", state: "TX", type: "Art fair",
    start: "2027-04-15", end: "2027-04-18", deadline: "2026-11-06", fee: 720, attendance: 350000, juried: true, outdoor: true,
    tags: ["fine art", "jury", "high traffic"],
    desc: "Four-day juried street festival with very high foot traffic. Booths are on pavement; weights required in place of stakes." },
  { id: 12, name: "Emerald City Comic Con", org: "ReedPop", city: "Seattle", state: "WA", type: "Convention",
    start: "2027-03-04", end: "2027-03-07", deadline: "2026-09-18", fee: 610, attendance: 98000, juried: true, outdoor: false,
    tags: ["artist alley", "lottery", "comics"],
    desc: "Artist Alley placement runs through a curated lottery rather than first-come registration. Portfolio review is part of selection." },
  { id: 13, name: "Round Top Antiques Fair", org: "Round Top Fairs", city: "Round Top", state: "TX", type: "Standing market",
    start: "2026-10-16", end: "2026-10-24", deadline: "2026-08-20", fee: 900, attendance: 130000, juried: false, outdoor: true,
    tags: ["antiques", "long run", "destination"],
    desc: "Nine-day destination market spread across dozens of independent show fields. Space is leased directly from individual field operators." },
  { id: 14, name: "Texas Renaissance Festival", org: "TRF", city: "Todd Mission", state: "TX", type: "Standing market",
    start: "2026-10-03", end: "2026-11-29", deadline: "2026-08-01", fee: 1400, attendance: 500000, juried: true, outdoor: true,
    tags: ["seasonal", "themed", "period appropriate"],
    desc: "Eight-weekend seasonal festival requiring period-appropriate merchandise and shop presentation. Multi-season vendors get renewal priority." },
  { id: 15, name: "Austin Flea", org: "Austin Flea", city: "Austin", state: "TX", type: "Maker market",
    start: "2026-08-15", end: "2026-08-15", deadline: "2026-07-27", fee: 65, attendance: 2500, juried: false, outdoor: false,
    tags: ["indie", "low cost", "recurring"],
    desc: "Recurring indie maker pop-up hosted at rotating bars and venues. Low entry cost makes it a common first market for new vendors." },
  { id: 16, name: "Dallas Fan Expo", org: "Fan Expo HQ", city: "Dallas", state: "TX", type: "Convention",
    start: "2027-05-28", end: "2027-05-30", deadline: "2027-01-20", fee: 520, attendance: 70000, juried: false, outdoor: false,
    tags: ["artist alley", "pop culture", "celebrity"],
    desc: "Large pop culture convention with tiered artist alley pricing by table location and corner access." },
];

/* ------------------------------------------------------------------ */
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const d = (s) => { const x = new Date(s + "T00:00:00"); return x; };
const daysFrom = (s) => Math.round((d(s) - TODAY) / 86400000);
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtRange(a, b) {
  const A = d(a), B = d(b);
  if (a === b) return `${MON[A.getMonth()]} ${A.getDate()}`;
  if (A.getMonth() === B.getMonth()) return `${MON[A.getMonth()]} ${A.getDate()}–${B.getDate()}`;
  return `${MON[A.getMonth()]} ${A.getDate()} – ${MON[B.getMonth()]} ${B.getDate()}`;
}
function fmtShort(s) { const A = d(s); return `${MON[A.getMonth()]} ${A.getDate()}`; }
function urgency(n) { return n < 0 ? "closed" : n <= 21 ? "soon" : n <= 60 ? "mid" : "far"; }

/* ---------- recall-tolerant search ---------- */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
function isSubseq(q, t) { let i = 0; for (const c of t) { if (c === q[i]) i++; if (i === q.length) return true; } return q.length === 0; }
function matchScore(ev, q) {
  if (!q.trim()) return 1;
  const nq = norm(q);
  const name = norm(ev.name);
  const hay = norm([ev.name, ev.org, ev.city, ev.state, ev.type, ...ev.tags].join(" "));
  let s = 0;
  if (name === nq) s += 120;
  if (name.startsWith(nq)) s += 55;
  if (hay.includes(nq)) s += 45;
  for (const t of nq.split(" ")) {
    if (!t) continue;
    if (hay.includes(t)) s += 20;
    else if (isSubseq(t, name)) s += 8;
    else if (t.length > 3 && name.includes(t.slice(0, Math.max(3, t.length - 2)))) s += 6;
  }
  return s;
}

/* ---------- deterministic riso poster ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function Poster({ seed, type }) {
  const uid = `p${seed}`;
  const { shapes, bg } = useMemo(() => {
    const r = rng(seed * 2654435761);
    const inks = ["var(--pink)", "var(--aqua)", "var(--yellow)"];
    const i1 = Math.floor(r() * 3);
    const i2 = (i1 + 1 + Math.floor(r() * 2)) % 3;
    const A = inks[i1], B = inks[i2];
    const out = [];
    const bgTone = ["#F3F3EF", "#EDEDE7", "#F6F4EC"][Math.floor(r() * 3)];

    if (type === "Convention") {
      out.push({ k: "circle", cx: 80 + r() * 60, cy: 130 + r() * 40, rr: 88 + r() * 26, f: A });
      const pts = []; const cx = 250 + r() * 70, cy = 110 + r() * 30, R = 62 + r() * 18;
      for (let i = 0; i < 16; i++) { const ang = (i / 16) * Math.PI * 2; const rad = i % 2 ? R * .55 : R; pts.push(`${cx + Math.cos(ang) * rad},${cy + Math.sin(ang) * rad}`); }
      out.push({ k: "poly", p: pts.join(" "), f: B });
    } else if (type === "Art fair") {
      out.push({ k: "path", d: `M60 230 L60 130 A90 90 0 0 1 240 130 L240 230 Z`, f: A });
      out.push({ k: "circle", cx: 300, cy: 90, rr: 58 + r() * 20, f: B });
    } else if (type === "Craft fair") {
      let p = "M0 200 "; for (let i = 0; i <= 8; i++) p += `L${i * 50} ${i % 2 ? 140 : 210} `;
      out.push({ k: "path", d: p + "L400 260 L0 260 Z", f: A });
      out.push({ k: "circle", cx: 120 + r() * 160, cy: 80, rr: 46 + r() * 22, f: B });
    } else if (type === "Standing market") {
      for (let i = 0; i < 5; i++) out.push({ k: "path", d: `M${i * 84 - 10} 260 L${i * 84 + 32} 96 L${i * 84 + 74} 260 Z`, f: i % 2 ? A : B, o: i % 2 ? 1 : .9 });
    } else {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++)
        out.push({ k: "rect", x: 44 + i * 108, y: 48 + j * 88, w: 78, h: 62, f: (i + j) % 2 ? A : B, rot: -6 + r() * 12 });
    }
    return { shapes: out, bg: bgTone };
  }, [seed, type]);

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={`${uid}h`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="1.15" fill="var(--ink)" opacity=".22" />
        </pattern>
      </defs>
      <rect width="400" height="260" fill={bg} />
      <g style={{ mixBlendMode: "multiply" }}>
        {shapes.map((s, i) => {
          const common = { key: i, fill: s.f, opacity: s.o ?? 0.88 };
          if (s.k === "circle") return <circle {...common} cx={s.cx} cy={s.cy} r={s.rr} />;
          if (s.k === "poly") return <polygon {...common} points={s.p} />;
          if (s.k === "path") return <path {...common} d={s.d} />;
          return <rect {...common} x={s.x} y={s.y} width={s.w} height={s.h} transform={`rotate(${s.rot} ${s.x + s.w / 2} ${s.y + s.h / 2})`} />;
        })}
      </g>
      <rect width="400" height="260" fill={`url(#${uid}h)`} />
    </svg>
  );
}

/* ---------- number that rolls ---------- */
function Rolling({ value }) {
  const [n, setN] = useState(value);
  const ref = useRef(value);
  useEffect(() => {
    const from = ref.current, to = value, t0 = performance.now(), dur = 320;
    if (from === to) return;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(step); else ref.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="bth-count">{String(n).padStart(2, "0")}</span>;
}

/* ---------- icons ---------- */
const IcSearch = () => (<svg width="19" height="19" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="2" /><path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);
const IcPin = ({ on }) => (<svg width="15" height="15" viewBox="0 0 16 16" fill={on ? "currentColor" : "none"}><path d="M8 1.5l1.9 4.1 4.4.6-3.2 3.1.8 4.4L8 11.6 4.1 13.7l.8-4.4L1.7 6.2l4.4-.6L8 1.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>);

/* ================================================================== */
export default function BoothDirectory() {
  const [q, setQ] = useState("");
  const [types, setTypes] = useState([]);
  const [state, setState] = useState("all");
  const [jury, setJury] = useState("any");
  const [openOnly, setOpenOnly] = useState(true);
  const [maxFee, setMaxFee] = useState(1500);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saved, setSaved] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState("deadline");
  const [view, setView] = useState("grid");
  const [hot, setHot] = useState(null);
  const [popped, setPopped] = useState(null);

  const states = useMemo(() => ["all", ...Array.from(new Set(EVENTS.map(e => e.state))).sort()], []);

  const results = useMemo(() => {
    let out = EVENTS.map(e => ({ ...e, _s: matchScore(e, q), _dl: daysFrom(e.deadline) }))
      .filter(e => e._s > 0)
      .filter(e => !types.length || types.includes(e.type))
      .filter(e => state === "all" || e.state === state)
      .filter(e => jury === "any" || (jury === "juried" ? e.juried : !e.juried))
      .filter(e => !openOnly || e._dl >= 0)
      .filter(e => e.fee <= maxFee)
      .filter(e => !savedOnly || saved.includes(e.id))
      .filter(e => !from || d(e.end) >= d(from))
      .filter(e => !to || d(e.start) <= d(to));

    const by = {
      deadline: (a, b) => a._dl - b._dl,
      event: (a, b) => d(a.start) - d(b.start),
      fee: (a, b) => a.fee - b.fee,
      attendance: (a, b) => b.attendance - a.attendance,
      match: (a, b) => b._s - a._s,
    };
    return out.sort(by[q.trim() && sort === "deadline" ? "match" : sort]);
  }, [q, types, state, jury, openOnly, maxFee, savedOnly, saved, from, to, sort]);

  const renderKey = `${q}|${types.join()}|${state}|${jury}|${openOnly}|${maxFee}|${savedOnly}|${from}|${to}|${sort}`;

  /* rail geometry: 210-day window */
  const WINDOW = 210;
  const railItems = results.filter(e => e._dl >= 0 && e._dl <= WINDOW);
  const months = useMemo(() => {
    const out = []; const cur = new Date(TODAY);
    cur.setDate(1);
    for (let i = 0; i < 8; i++) {
      const dt = new Date(cur.getFullYear(), cur.getMonth() + i, 1);
      const off = Math.round((dt - TODAY) / 86400000);
      if (off >= 0 && off <= WINDOW) out.push({ label: MON[dt.getMonth()], pct: (off / WINDOW) * 100 });
    }
    return out;
  }, []);

  const toggleType = (t) => setTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleSave = (id) => {
    setSaved(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    setPopped(id); setTimeout(() => setPopped(null), 520);
  };
  const resetAll = () => { setQ(""); setTypes([]); setState("all"); setJury("any"); setOpenOnly(true); setMaxFee(1500); setFrom(""); setTo(""); setSavedOnly(false); };

  return (
    <div className="bth">
      <style>{CSS}</style>
      <div className="bth-grain" />

      <div className="bth-wrap">
        {/* top bar */}
        <header className="bth-top">
          <div className="bth-mark"><i />Booth</div>
          <span className="bth-demo">Demo data</span>
          <div className="bth-top-spacer" />
          <button className={`bth-savedbtn${savedOnly ? " on" : ""}`} onClick={() => setSavedOnly(v => !v)}>
            <IcPin on={savedOnly} /> Saved <b>{saved.length}</b>
          </button>
        </header>

        {/* hero */}
        <section className="bth-hero">
          <div className="bth-kicker">Vendor opportunities · {EVENTS.length} listings · Updated weekly</div>
          <h1 className="bth-h1">Find the booth<br />before the <em>deadline</em> finds you.</h1>
          <p className="bth-sub">
            Conventions, art fairs, craft fairs, and standing markets in one place — with the application
            window, the booth fee, and the jury requirements on the front of every card.
          </p>

          {/* search slab */}
          <div className="bth-slab">
            <div className="bth-searchrow">
              <div className="bth-searchbox">
                <IcSearch />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search by event, city, or half-remembered name…"
                  aria-label="Search events"
                />
                {q && <button className="bth-clear" onClick={() => setQ("")}>Clear</button>}
              </div>
            </div>
            <div className="bth-hint">
              <span>Try:</span>
              {["wimberley", "renegade", "artist alley", "trade days", "houston"].map(t => (
                <button key={t} onClick={() => setQ(t)}>{t}</button>
              ))}
              <span style={{ marginLeft: "auto" }}>Partial and misspelled names still match.</span>
            </div>

            {/* filters */}
            <div className="bth-filters">
              <div className="bth-frow">
                <span className="bth-flabel">Type</span>
                {TYPES.map(t => (
                  <button key={t} className={`bth-chip${types.includes(t) ? " on" : ""}`} onClick={() => toggleType(t)}>{t}</button>
                ))}
              </div>

              <div className="bth-frow">
                <span className="bth-flabel">Where</span>
                <select className="bth-date" value={state} onChange={e => setState(e.target.value)} aria-label="State">
                  {states.map(s => <option key={s} value={s}>{s === "all" ? "All states" : s}</option>)}
                </select>
                <span className="bth-flabel" style={{ width: "auto", marginLeft: 8 }}>Event dates</span>
                <div className="bth-dates">
                  <input type="date" className="bth-date" value={from} onChange={e => setFrom(e.target.value)} aria-label="From date" />
                  <span style={{ fontFamily: "var(--f-data)", fontSize: 12, color: "var(--ink-45)" }}>to</span>
                  <input type="date" className="bth-date" value={to} onChange={e => setTo(e.target.value)} aria-label="To date" />
                  {(from || to) && <button className="bth-clear" onClick={() => { setFrom(""); setTo(""); }}>Reset dates</button>}
                </div>
              </div>

              <div className="bth-frow">
                <span className="bth-flabel">Entry</span>
                <button className={`bth-chip c-yellow${jury === "juried" ? " on" : ""}`} onClick={() => setJury(j => j === "juried" ? "any" : "juried")}>
                  <span className="dot" style={{ background: "var(--yellow)" }} />Panel review
                </button>
                <button className={`bth-chip c-aqua${jury === "open" ? " on" : ""}`} onClick={() => setJury(j => j === "open" ? "any" : "open")}>
                  <span className="dot" style={{ background: "var(--aqua)" }} />Open registration
                </button>
                <button className={`bth-chip c-pink${openOnly ? " on" : ""}`} onClick={() => setOpenOnly(v => !v)}>
                  Applications still open
                </button>
                <div className="bth-range" style={{ marginLeft: "auto" }}>
                  <span style={{ color: "var(--ink-45)" }}>Booth fee ≤</span>
                  <input type="range" min="0" max="1500" step="25" value={maxFee} onChange={e => setMaxFee(+e.target.value)} aria-label="Maximum booth fee" />
                  <strong>{maxFee >= 1500 ? "any" : `$${maxFee}`}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- SIGNATURE: deadline rail ---------- */}
        <section className="bth-rail">
          <div className="bth-railhead">
            <span className="bth-railtitle">Deadline rail</span>
            <span className="bth-railnote">Next 210 days · one mark per application deadline · hover to link a mark to its card</span>
          </div>
          <div className="bth-railbody">
            <div className="bth-railline" />
            {railItems.length === 0 && <div className="bth-railempty">No open application windows in this filter.</div>}
            {railItems.map((e, i) => {
              const u = urgency(e._dl);
              const pct = (e._dl / WINDOW) * 100;
              const h = 22 + Math.min(38, e.attendance / 3000);
              return (
                <div
                  key={e.id}
                  className={`bth-tick u-${u}${hot === e.id ? " hot" : ""}`}
                  style={{ left: `${pct}%`, height: h, animationDelay: `${i * 40}ms` }}
                  onMouseEnter={() => setHot(e.id)}
                  onMouseLeave={() => setHot(null)}
                  title={`${e.name} — apply by ${fmtShort(e.deadline)}`}
                />
              );
            })}
            {hot && railItems.find(e => e.id === hot) && (() => {
              const e = railItems.find(x => x.id === hot);
              const pct = Math.min(92, Math.max(8, (e._dl / WINDOW) * 100));
              return <div className="bth-railtip" style={{ left: `${pct}%` }}>{e.name} · apply by {fmtShort(e.deadline)} · {e._dl}d</div>;
            })()}
            {months.map((m, i) => <div key={i} className="bth-month" style={{ left: `${m.pct}%` }}>{m.label}</div>)}
          </div>
        </section>

        {/* results bar */}
        <div className="bth-resbar">
          <Rolling value={results.length} />
          <span className="bth-countlabel">
            {q.trim() ? `matches for “${q}”` : "open opportunities"}
          </span>
          <select className="bth-sort" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort by">
            <option value="deadline">Sort: deadline soonest</option>
            <option value="event">Sort: event date</option>
            <option value="fee">Sort: booth fee, low to high</option>
            <option value="attendance">Sort: attendance</option>
            <option value="match">Sort: best match</option>
          </select>
          <div className="bth-viewtog">
            <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>Grid</button>
            <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>List</button>
          </div>
        </div>

        {/* grid */}
        {results.length === 0 ? (
          <div className="bth-empty">
            <h3>Nothing matches yet</h3>
            <p>Widen the fee cap, clear the date range, or drop a filter — most artists find more by searching city than by searching category.</p>
            <button className="bth-reset" onClick={resetAll}>Clear all filters</button>
          </div>
        ) : (
          <div className={`bth-grid${view === "list" ? " list" : ""}`} key={renderKey}>
            {results.map((e, i) => {
              const u = urgency(e._dl);
              const isSaved = saved.includes(e.id);
              return (
                <article
                  key={e.id}
                  className={`bth-card${hot === e.id ? " hot" : ""}`}
                  style={{ "--i": i % 12 }}
                  onMouseEnter={() => setHot(e.id)}
                  onMouseLeave={() => setHot(null)}
                >
                  <div className="bth-poster">
                    <Poster seed={e.id} type={e.type} />
                    <span className="bth-typetag">{e.type}</span>
                    <button
                      className={`bth-pin${isSaved ? " on" : ""}${popped === e.id ? " pop" : ""}`}
                      onClick={() => toggleSave(e.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? `Remove ${e.name} from saved` : `Save ${e.name}`}
                    >
                      <IcPin on={isSaved} />
                    </button>
                    {popped === e.id && isSaved && (
                      <span className="bth-burst">
                        {[...Array(6)].map((_, k) => {
                          const a = (k / 6) * Math.PI * 2;
                          return <span key={k} style={{ "--bx": `${Math.cos(a) * 26 - 2}px`, "--by": `${Math.sin(a) * 26 - 2}px`, animationDelay: `${k * 12}ms` }} />;
                        })}
                      </span>
                    )}
                  </div>

                  <div className="bth-body">
                    <h2 className="bth-name">{e.name}</h2>
                    <div className="bth-place">{e.city}, {e.state} · {e.org}</div>
                    <p className="bth-desc">{e.desc}</p>

                    <dl className="bth-data">
                      <div className="bth-datum"><dt>Event dates</dt><dd>{fmtRange(e.start, e.end)}</dd></div>
                      <div className="bth-datum"><dt>Apply by</dt><dd>{fmtShort(e.deadline)}</dd></div>
                      <div className="bth-datum"><dt>Booth from</dt><dd>{e.fee === 0 ? "No fee" : `$${e.fee.toLocaleString()}`}</dd></div>
                      <div className="bth-datum"><dt>Attendance</dt><dd>~{e.attendance >= 1000 ? `${Math.round(e.attendance / 1000)}k` : e.attendance}</dd></div>
                    </dl>

                    <div className="bth-badges">
                      {u === "closed" && <span className="bth-badge b-mute">Closed</span>}
                      {u === "soon" && <span className="bth-badge b-pink">{e._dl}d left</span>}
                      {u === "mid" && <span className="bth-badge b-yellow">{e._dl}d left</span>}
                      {u === "far" && <span className="bth-badge b-aqua">{e._dl}d left</span>}
                      <span className="bth-badge">{e.juried ? "Panel review" : "Open registration"}</span>
                      {e.outdoor && <span className="bth-badge b-mute">Outdoor</span>}
                      {e.fee === 0 && <span className="bth-badge b-grass">Consignment</span>}
                      {e.tags.includes("monthly") && <span className="bth-badge b-mute">Recurs monthly</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="bth-foot">
          Placeholder listing data — event names are real, but all dates, fees, attendance figures, and
          review requirements shown here are invented for layout purposes. Motion respects
          <span style={{ color: "var(--ink)" }}> prefers-reduced-motion</span>; all animation is transform and opacity only.
        </footer>
      </div>
    </div>
  );
}
