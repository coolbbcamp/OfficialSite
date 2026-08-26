const base = "http://127.0.0.1:3000";
const app = await fetch(`${base}/assets/App3D-f554a111.js?v=coolbb2`);
const appText = await app.text();
console.log("App3D", app.status, "coolbb:", appText.includes("coolbb"), "monkey:", appText.includes("innerobject:\"monkey\""));
const m = await fetch(`${base}/assets/geometries/monkey.drc`);
console.log("monkey.drc", m.status, m.headers.get("content-length"));
const h = await fetch(`${base}/`);
console.log("index CoolBB title:", (await h.text()).includes("<title>CoolBB</title>"));
