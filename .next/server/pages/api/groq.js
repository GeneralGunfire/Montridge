"use strict";(()=>{var e={};e.id=121,e.ids=[121],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},9648:e=>{e.exports=import("axios")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,n){return n in t?t[n]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,n)):"function"==typeof t&&"default"===n?t:void 0}}})},4808:(e,t,n)=>{n.a(e,async(e,a)=>{try{n.r(t),n.d(t,{config:()=>u,default:()=>c,routeModule:()=>p});var r=n(1802),o=n(7153),i=n(6249),s=n(4191),l=e([s]);s=(l.then?(await l)():l)[0];let c=(0,i.l)(s,"default"),u=(0,i.l)(s,"config"),p=new r.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/groq",pathname:"/api/groq",bundlePath:"",filename:""},userland:s});a()}catch(e){a(e)}})},4191:(e,t,n)=>{n.a(e,async(e,a)=>{try{n.r(t),n.d(t,{callGroqApi:()=>i,default:()=>s});var r=n(9648),o=e([r]);r=(o.then?(await o)():o)[0];let l=[process.env.GROQ_API_KEY||"placeholder",process.env.GROQ_API_KEY_2||"placeholder"],c=0;async function i(e,t){let n=`Analyze this news article and return a structured JSON response.

Article Title: ${e}
Article Summary: ${t||"No summary available"}

Return ONLY valid JSON with NO markdown formatting, NO code fences, NO explanation text. Just pure JSON.

{
  "summary": "2-3 sentences",
  "why_it_matters": "2-3 sentences",
  "categories": ["Politics", "Business", "Technology"],
  "entities": {
    "people": ["Name1", "Name2"],
    "organizations": ["Org1"],
    "places": ["Place1"]
  },
  "key_facts": ["Fact with number/name/date"],
  "sentiment": "positive OR negative OR neutral",
  "signal_score": 75,
  "importance": "high OR medium OR low",
  "related_context": "1-2 sentences",
  "bias_indicators": {
    "emotional_language": true,
    "one_sided": false,
    "has_quotes": true,
    "has_data": false
  }
}`;try{let e=(await r.default.post("https://api.groq.com/openai/v1/chat/completions",{model:"llama-3.3-70b-versatile",messages:[{role:"user",content:n}],temperature:.7,max_tokens:2e3},{headers:function(){let e=l[c];if(!e||"placeholder"===e)throw Error("Groq API keys not configured. Configure them in environment variables.");return{Authorization:`Bearer ${e}`,"Content-Type":"application/json"}}(),timeout:3e4})).data.choices[0].message.content.match(/\{[\s\S]*\}/);if(e)return JSON.parse(e[0]);return null}catch(n){if(n.response?.status===429)return console.log("Rate limit hit, switching API key"),c=(c+1)%l.length,i(e,t);return console.error("Groq API error:",n.message),null}}async function s(e,t){t.status(200).json({status:"Groq integration ready"})}a()}catch(e){a(e)}})},7153:(e,t)=>{var n;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return n}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(n||(n={}))},1802:(e,t,n)=>{e.exports=n(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var n=t(t.s=4808);module.exports=n})();