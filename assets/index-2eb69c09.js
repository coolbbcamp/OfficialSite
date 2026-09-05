(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function e(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(r){if(r.ep)return;r.ep=!0;const i=e(r);fetch(r.href,i)}})();const dt="modulepreload",ht=function(t){return"/"+t},T={},mt=function(n,e,o){if(!e||e.length===0)return n();const r=document.getElementsByTagName("link");return Promise.all(e.map(i=>{if(i=ht(i),i in T)return;T[i]=!0;const c=i.endsWith(".css"),f=c?'[rel="stylesheet"]':"";if(!!o)for(let l=r.length-1;l>=0;l--){const a=r[l];if(a.href===i&&(!c||a.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${i}"]${f}`))return;const s=document.createElement("link");if(s.rel=c?"stylesheet":dt,c||(s.as="script",s.crossOrigin=""),s.href=i,document.head.appendChild(s),c)return new Promise((l,a)=>{s.addEventListener("load",l),s.addEventListener("error",()=>a(new Error(`Unable to preload CSS for ${i}`)))})})).then(()=>n()).catch(i=>{const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=i,window.dispatchEvent(c),!c.defaultPrevented)throw i})},pt=`html{text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}html,html body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background-color:var(--bgColor);touch-action:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}html body .click{cursor:pointer}html body #app{display:block;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;overflow:hidden}body .tp-dfwv{max-height:calc(100vh - 16px)}body .tp-dfwv::-webkit-scrollbar{width:5px}body .tp-dfwv::-webkit-scrollbar-track{background-color:#4c4f53}body .tp-dfwv::-webkit-scrollbar-thumb{background-color:#777c81}@font-face{font-family:IBMPlexMono-Medium;src:url(/assets/IBMPlexMono-Medium-897c8c30.woff2) format("woff2"),url(/assets/IBMPlexMono-Medium-1e253194.woff) format("woff");font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:IBMPlexMono-Regular;src:url(/assets/IBMPlexMono-Regular-d3034935.woff2) format("woff2"),url(/assets/IBMPlexMono-Regular-419d45f6.woff) format("woff");font-weight:400;font-style:normal;font-display:swap}html{--default-font: sans-serif;--bgColor: #05080A}
`;function k(){}const Z=t=>t;function tt(t){return t()}function F(){return Object.create(null)}function b(t){t.forEach(tt)}function q(t){return typeof t=="function"}function gt(t,n){return t!=t?n==n:t!==n||t&&typeof t=="object"||typeof t=="function"}function _t(t){return Object.keys(t).length===0}const nt=typeof window<"u";let wt=nt?()=>window.performance.now():()=>Date.now(),D=nt?t=>requestAnimationFrame(t):k;const y=new Set;function et(t){y.forEach(n=>{n.c(t)||(y.delete(n),n.f())}),y.size!==0&&D(et)}function yt(t){let n;return y.size===0&&D(et),{promise:new Promise(e=>{y.add(n={c:t,f:e})}),abort(){y.delete(n)}}}function C(t,n){t.appendChild(n)}function ot(t){if(!t)return document;const n=t.getRootNode?t.getRootNode():t.ownerDocument;return n&&n.host?n:t.ownerDocument}function $t(t){const n=L("style");return bt(ot(t),n),n.sheet}function bt(t,n){return C(t.head||t,n),n.sheet}function rt(t,n,e){t.insertBefore(n,e||null)}function j(t){t.parentNode&&t.parentNode.removeChild(t)}function L(t){return document.createElement(t)}function it(t){return document.createTextNode(t)}function vt(){return it(" ")}function xt(){return it("")}function Et(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function U(t,n,e){e==null?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function kt(t){return Array.from(t.childNodes)}function ct(t,n,{bubbles:e=!1,cancelable:o=!1}={}){const r=document.createEvent("CustomEvent");return r.initCustomEvent(t,e,o,n),r}const N=new Map;let R=0;function Pt(t){let n=5381,e=t.length;for(;e--;)n=(n<<5)-n^t.charCodeAt(e);return n>>>0}function Mt(t,n){const e={stylesheet:$t(n),rules:{}};return N.set(t,e),e}function Ct(t,n,e,o,r,i,c,f=0){const u=16.666/o;let s=`{
`;for(let p=0;p<=1;p+=u){const v=n+(e-n)*i(p);s+=p*100+`%{${c(v,1-v)}}
`}const l=s+`100% {${c(e,1-e)}}
}`,a=`__svelte_${Pt(l)}_${f}`,h=ot(t),{stylesheet:m,rules:d}=N.get(h)||Mt(h,t);d[a]||(d[a]=!0,m.insertRule(`@keyframes ${a} ${l}`,m.cssRules.length));const M=t.style.animation||"";return t.style.animation=`${M?`${M}, `:""}${a} ${o}ms linear ${r}ms 1 both`,R+=1,a}function Lt(t,n){const e=(t.style.animation||"").split(", "),o=e.filter(n?i=>i.indexOf(n)<0:i=>i.indexOf("__svelte")===-1),r=e.length-o.length;r&&(t.style.animation=o.join(", "),R-=r,R||Ot())}function Ot(){D(()=>{R||(N.forEach(t=>{const{ownerNode:n}=t.stylesheet;n&&j(n)}),N.clear())})}let P;function E(t){P=t}function st(){if(!P)throw new Error("Function called outside component initialization");return P}function Kt(t){st().$$.on_mount.push(t)}function St(){const t=st();return(n,e,{cancelable:o=!1}={})=>{const r=t.$$.callbacks[n];if(r){const i=ct(n,e,{cancelable:o});return r.slice().forEach(c=>{c.call(t,i)}),!i.defaultPrevented}return!0}}const w=[],I=[];let $=[];const V=[],at=Promise.resolve();let z=!1;function lt(){z||(z=!0,at.then(ft))}function Wt(){return lt(),at}function A(t){$.push(t)}const B=new Set;let _=0;function ft(){if(_!==0)return;const t=P;do{try{for(;_<w.length;){const n=w[_];_++,E(n),Nt(n.$$)}}catch(n){throw w.length=0,_=0,n}for(E(null),w.length=0,_=0;I.length;)I.pop()();for(let n=0;n<$.length;n+=1){const e=$[n];B.has(e)||(B.add(e),e())}$.length=0}while(w.length);for(;V.length;)V.pop()();z=!1,B.clear(),E(t)}function Nt(t){if(t.fragment!==null){t.update(),b(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(A)}}function Rt(t){const n=[],e=[];$.forEach(o=>t.indexOf(o)===-1?n.push(o):e.push(o)),e.forEach(o=>o()),$=n}let x;function At(){return x||(x=Promise.resolve(),x.then(()=>{x=null})),x}function H(t,n,e){t.dispatchEvent(ct(`${n?"intro":"outro"}${e}`))}const O=new Set;let g;function jt(){g={r:0,c:[],p:g}}function Bt(){g.r||b(g.c),g=g.p}function S(t,n){t&&t.i&&(O.delete(t),t.i(n))}function K(t,n,e,o){if(t&&t.o){if(O.has(t))return;O.add(t),g.c.push(()=>{O.delete(t),o&&(e&&t.d(1),o())}),t.o(n)}else o&&o()}const It={duration:0};function W(t,n,e){const o={direction:"out"};let r=n(t,e,o),i=!0,c;const f=g;f.r+=1;function u(){const{delay:s=0,duration:l=300,easing:a=Z,tick:h=k,css:m}=r||It;m&&(c=Ct(t,1,0,l,s,a,m));const d=wt()+s,M=d+l;A(()=>H(t,!1,"start")),yt(p=>{if(i){if(p>=M)return h(0,1),H(t,!1,"end"),--f.r||b(f.c),!1;if(p>=d){const v=a((p-d)/l);h(1-v,v)}}return i})}return q(r)?At().then(()=>{r=r(o),u()}):u(),{end(s){s&&r.tick&&r.tick(1,0),i&&(c&&Lt(t,c),i=!1)}}}function Gt(t){t&&t.c()}function zt(t,n,e,o){const{fragment:r,after_update:i}=t.$$;r&&r.m(n,e),o||A(()=>{const c=t.$$.on_mount.map(tt).filter(q);t.$$.on_destroy?t.$$.on_destroy.push(...c):b(c),t.$$.on_mount=[]}),i.forEach(A)}function qt(t,n){const e=t.$$;e.fragment!==null&&(Rt(e.after_update),b(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function Dt(t,n){t.$$.dirty[0]===-1&&(w.push(t),lt(),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function Tt(t,n,e,o,r,i,c,f=[-1]){const u=P;E(t);const s=t.$$={fragment:null,ctx:[],props:i,update:k,not_equal:r,bound:F(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(u?u.$$.context:[])),callbacks:F(),dirty:f,skip_bound:!1,root:n.target||u.$$.root};c&&c(s.root);let l=!1;if(s.ctx=e?e(t,n.props||{},(a,h,...m)=>{const d=m.length?m[0]:h;return s.ctx&&r(s.ctx[a],s.ctx[a]=d)&&(!s.skip_bound&&s.bound[a]&&s.bound[a](d),l&&Dt(t,a)),h}):[],s.update(),l=!0,b(s.before_update),s.fragment=o?o(s.ctx):!1,n.target){if(n.hydrate){const a=kt(n.target);s.fragment&&s.fragment.l(a),a.forEach(j)}else s.fragment&&s.fragment.c();n.intro&&S(t.$$.fragment),zt(t,n.target,n.anchor,n.customElement),ft()}E(u)}class Ft{$destroy(){qt(this,1),this.$destroy=k}$on(n,e){if(!q(e))return k;const o=this.$$.callbacks[n]||(this.$$.callbacks[n]=[]);return o.push(e),()=>{const r=o.indexOf(e);r!==-1&&o.splice(r,1)}}$set(n){this.$$set&&!_t(n)&&(this.$$.skip_bound=!0,this.$$set(n),this.$$.skip_bound=!1)}}function G(t){return t<.5?4*t*t*t:.5*Math.pow(2*t-2,3)+1}function J(t,{delay:n=0,duration:e=400,easing:o=Z}={}){const r=+getComputedStyle(t).opacity;return{delay:n,duration:e,easing:o,css:i=>`opacity: ${i*r}`}}function Q(t){let n,e,o,r,i,c,f,u,s;return{c(){n=L("div"),e=L("div"),r=vt(),i=L("style"),i.textContent=`/* js */
            div#loader {
                display: flex;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;

                background-color: var(--bgColor);
                will-change: opacity;

                flex-direction: column;
                flex-wrap: nowrap;
                justify-content: center;
                align-items: center;
                align-content: center;

                pointer-events: none;
            }

            .ascii {

                position: relative;

                overflow: hidden;

                width: min(94vw, 28em);

                height: 1.5em;

                -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);

                mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);

            }



            .ascii:before {

                display: inline-block;

                white-space: nowrap;

                color: #00E5FF;

                content: 'CoolBB Base Camp    CoolBB Base Camp    CoolBB Base Camp    CoolBB Base Camp';

                font-size: 15px;

                font-family: IBMPlexMono-Medium, IBMPlexMono, monospace;

                font-weight: 500;

                letter-spacing: 0.1em;

                text-shadow: 0px 0px 10px rgba(0,229,255,0.55), 0px 0px 20px rgba(0,229,255,0.2);

                animation: coolbb-flow 16s linear infinite, coolbb-breathe 5s ease-in-out infinite;

                will-change: transform, opacity;

            }



            @keyframes coolbb-flow {

                0% { transform: translateX(0); }

                100% { transform: translateX(-50%); }

            }



            @keyframes coolbb-breathe {

                0%, 100% { opacity: 0.82; }

                50% { opacity: 1; }

            }}`,U(e,"class","ascii"),U(n,"id","loader")},m(l,a){rt(l,n,a),C(n,e),C(n,r),C(n,i),t[6](n),f=!0,u||(s=Et(n,"outroend",t[7]),u=!0)},p(l,a){t=l},i(l){f||(o&&o.end(1),c&&c.end(1),f=!0)},o(l){o=W(e,J,{duration:500,easing:G}),c=W(n,J,{duration:1200,easing:G}),f=!1},d(l){l&&j(n),l&&o&&o.end(),t[6](null),l&&c&&c.end(),u=!1,s()}}}function Ut(t){let n,e,o=t[1]&&Q(t);return{c(){o&&o.c(),n=xt()},m(r,i){o&&o.m(r,i),rt(r,n,i),e=!0},p(r,[i]){r[1]?o?(o.p(r,i),i&2&&S(o,1)):(o=Q(r),o.c(),S(o,1),o.m(n.parentNode,n)):o&&(jt(),K(o,1,1,()=>{o=null}),Bt())},i(r){e||(S(o),e=!0)},o(r){K(o),e=!1},d(r){o&&o.d(r),r&&j(n)}}}function Vt(t,n,e){const o=St();let r=null,i=!1;const c=()=>r,f=()=>{e(1,i=!0)},u=()=>{e(1,i=!1)};function s(a){I[a?"unshift":"push"](()=>{r=a,e(0,r)})}return[r,i,o,c,f,u,s,()=>{o("hidden")}]}class Ht extends Ft{constructor(n){super(),Tt(this,n,Vt,Ut,gt,{getEl:3,show:4,hide:5})}get getEl(){return this.$$.ctx[3]}get show(){return this.$$.ctx[4]}get hide(){return this.$$.ctx[5]}}const ut=document.createElement("style");ut.textContent=pt;document.head.append(ut);const X="width=device-width, initial-scale=1.0, shrink-to-fit=no, minimal-ui, viewport-fit=cover",Y=document.querySelector("meta[viewport]");Y?Y.setAttribute("content",X):document.head.insertAdjacentHTML("beforeend",`<meta name="viewport" content="${X}">`);(async t=>{if(window.__coolbbBoot)return;window.__coolbbBoot=1;let n=null;t!=null&&t.cnt?n=t.cnt:(n=document.createElement("div"),n.id="app",document.body.prepend(n)),new Proxy(new URLSearchParams(window.location.search),{get:(c,f)=>c.get(f)});const e=new Ht({target:n});e==null||e.show();const o=(await mt(()=>import("./App3D-coolbb.js?v=1788598589368"),[])).default;console.log("[boot] waiting App3D.ready");const i=await new o({target:n,props:{interactionNode:t==null?void 0:t.interactionNode,relativePath:t==null?void 0:t.relativePath},...e?{anchor:e.getEl()}:{}}).ready;console.log("[boot] App3D.ready done",i);return e&&await new Promise(c=>{const h=setTimeout(()=>{console.warn("[boot] loader hide timeout — forcing");e.$destroy();c()},30000);e.$on("hidden",()=>{clearTimeout(h);e.$destroy();c()}),e.hide()}),i==null?void 0:i()})();export{Ft as S,rt as a,vt as b,xt as c,j as d,L as e,K as f,Bt as g,Gt as h,Tt as i,qt as j,U as k,jt as l,zt as m,k as n,Kt as o,Wt as p,I as q,gt as s,S as t};
