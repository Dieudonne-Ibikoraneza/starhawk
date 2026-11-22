import { spawn } from "node:child_process";
import {
  writeFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { build } from "esbuild";
import assert from "node:assert/strict";
const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const output = join(root, "node_modules/.cache/government-browser");
const screenshots = join(output, "screenshots");
const downloads = join(output, "downloads");
for (const dir of [output, screenshots, downloads])
  mkdirSync(dir, { recursive: true });
if (!existsSync("dist/assets"))
  throw Error("Run npm run build before browser verification.");
await build({
  entryPoints: ["tests/government.browser.fixture.tsx"],
  outfile: join(output, "fixture.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  alias: { "@": resolve("src") },
  define: {
    "import.meta.env": JSON.stringify({
      VITE_API_URL: "http://localhost:3000",
    }),
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "silent",
  loader: { ".png": "dataurl" },
});
const css = readFileSync(
  "dist/assets/" + readdirSync("dist/assets").find((n) => n.endsWith(".css")),
  "utf8",
);
const jsSource = readFileSync(join(output, "fixture.js"), "utf8").replaceAll(
  "</script",
  "<\\/script",
);
const fixture = join(output, "fixture.html");
writeFileSync(
  fixture,
  `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${jsSource}</script></body></html>`,
);
const chrome = spawn(
  process.env.CHROME_BIN || "/usr/bin/google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-pipe",
    `--user-data-dir=${join(output, `chrome-${process.pid}`)}`,
  ],
  { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] },
);
let seq = 0,
  buffer = "",
  session;
const pending = new Map();
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d.toString()));
chrome.stdio[4].on("data", (d) => {
  buffer += d.toString();
  let end;
  while ((end = buffer.indexOf("\0")) !== -1) {
    const message = JSON.parse(buffer.slice(0, end));
    buffer = buffer.slice(end + 1);
    if (message.id) {
      const p = pending.get(message.id);
      pending.delete(message.id);
      message.error
        ? p?.reject(Error(JSON.stringify(message.error)))
        : p?.resolve(message.result);
    }
  }
});
function call(method, params = {}, sid = session) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    chrome.stdio[3].write(
      JSON.stringify({
        id,
        method,
        params,
        ...(sid ? { sessionId: sid } : {}),
      }) + "\0",
    );
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(Error(`Timeout ${method}: ${chromeErr.slice(-300)}`));
      }
    }, 20000).unref();
  });
}
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function js(expression) {
  const r = await call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 70; i++) {
    if (await js(`Boolean(document.body) && Boolean(${expression})`)) return;
    await delay(100);
  }
  throw Error("Missing: " + expression);
}
async function click(selector) {
  const rect = await js(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing selector');el.scrollIntoView({block:'center',inline:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`,
  );
  await call("Input.dispatchMouseEvent", {
    type: "mousePressed",
    ...rect,
    button: "left",
    clickCount: 1,
  });
  await call("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    ...rect,
    button: "left",
    clickCount: 1,
  });
  await delay(220);
}
async function pick(index, text) {
  await js(`document.querySelectorAll('[role=combobox]')[${index}].click()`);
  await delay(180);
  await js(
    `(()=>{const el=[...document.querySelectorAll('[role=option]')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing option '+${JSON.stringify(text)});el.click()})()`,
  );
  await delay(300);
}
async function shot(name) {
  const r = await call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  writeFileSync(
    join(screenshots, `${name}.png`),
    Buffer.from(r.data, "base64"),
  );
}
async function size(width, height = 1000) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(500);
}
async function mount(path, expected) {
  await js(`window.__mount(${JSON.stringify(path)})`);
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(expected)})`,
  );
  await delay(1800);
}
const results = [];
try {
  const target = await call(
    "Target.createTarget",
    { url: "about:blank" },
    undefined,
  );
  session = (
    await call(
      "Target.attachToTarget",
      { targetId: target.targetId, flatten: true },
      undefined,
    )
  ).sessionId;
  await call("Runtime.enable");
  await call("Page.enable");
  await size(1920);
  await call("Page.navigate", { url: `file://${fixture}` });
  await waitFor(`document.body.innerText.includes('Side A')`);
  if (process.env.GOVERNMENT_BROWSER_INTERACTIONS_ONLY !== "1") {
    // Header season, Side A region/season, then Side B.
    const combo = await js(
      `[...document.querySelectorAll('[role=combobox]')].map(el=>el.textContent)`,
    );
    console.log(JSON.stringify({ stage: "compare-pickers", combo }));
    await pick(1, "Kayonza");
    await pick(3, "Eastern (all)");
    await waitFor(
      `document.body.innerText.includes('2,430 ha')&&document.body.innerText.includes('4,488 ha')`,
    );
    await delay(1800);
    await shot("compare-desktop");
    assert.equal(
      await js(
        `document.querySelectorAll('[aria-label="Season comparison metrics"]').length`,
      ),
      1,
    );
    for (const width of [320, 375, 768, 1440, 1920]) {
      await size(width);
      results.push({
        page: "comparison-two",
        width,
        ...(await js(
          `({width:innerWidth,scroll:document.documentElement.scrollWidth,errors:window.__errors})`,
        )),
      });
      if (width === 375) await shot("compare-mobile");
    }
    await size(1920);
    await js(
      `([...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Add comparison')).click()`,
    );
    await delay(250);
    await pick(5, "Rwanda");
    await delay(1800);
    await click('button[aria-label="Move Side B left"]');
    assert.equal(
      await js(
        `document.querySelectorAll('[role=combobox]')[1].textContent.trim()`,
      ),
      "Eastern (all)",
    );
    assert.ok(
      await js(
        `document.querySelector('[aria-label="Season comparison metrics"]').innerText.includes('46%')`,
      ),
    );
    await shot("compare-three-desktop");
    for (const width of [320, 375, 768, 1440]) {
      await size(width);
      results.push({
        page: "comparison-three",
        width,
        ...(await js(
          `({scroll:document.documentElement.scrollWidth,errors:window.__errors})`,
        )),
      });
      if (width === 375) await shot("compare-three-mobile");
    }
    const pages = [
      ["/government/dashboard", "NDVI Trajectory", "overview"],
      ["/government/leaderboard", "Eastern", "leaderboard"],
      ["/government/leaderboard?region=east", "Districts", "province"],
      ["/government/leaderboard?region=kayonza", "Sectors", "district"],
      ["/government/leaderboard?region=rukara", "Cells", "sector"],
      ["/government/leaderboard?region=kawangire", "Villages", "cell"],
      [
        "/government/leaderboard?region=nyabubare",
        "Registered farmers",
        "village",
      ],
      [
        "/government/leaderboard?region=nyabubare&farmer=farmer-one",
        "Crop Portfolio",
        "farmer",
      ],
      ["/government/policies", "Policy Registry", "policies"],
      ["/government/claims", "Claim Tracking", "claims"],
      ["/government/invoicing", "Aggregated Invoices", "subsidies"],
      ["invoice", "Payment Overview", "invoice"],
    ];
    for (const [path, expected, name] of pages) {
      await size(1920);
      await mount(path, expected);
      await shot(`${name}-desktop`);
      for (const width of [320, 375, 768, 1440]) {
        await size(width);
        results.push({
          page: name,
          width,
          ...(await js(
            `({scroll:document.documentElement.scrollWidth,errors:window.__errors,tables:[...document.querySelectorAll('table')].map(t=>({width:t.getBoundingClientRect().width,parent:t.parentElement.clientWidth,overflow:getComputedStyle(t.parentElement).overflowX}))})`,
          )),
        });
        if (width === 375) await shot(`${name}-mobile`);
      }
    }
  }
  // Filters, pagination, navigation and audited mutations run only against this fixture.
  const clickText = async (text) => {
    await js(
      `(()=>{const el=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing button '+${JSON.stringify(text)});el.click()})()`,
    );
    await delay(250);
  };
  const inputText = async (selector, text) => {
    await js(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await call("Input.insertText", { text });
    await delay(150);
  };
  await size(1440);
  await mount("/government/policies", "Policy Registry");
  await clickText("Next");
  await waitFor(
    `window.__requests.some(r=>r.path.startsWith('policy-registry/')&&r.query.includes('page=2'))`,
  );
  await js(
    `document.querySelector('select').value='ACTIVE';document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await waitFor(
    `window.__requests.some(r=>r.path.startsWith('policy-registry/')&&r.query.includes('status=ACTIVE')&&r.query.includes('page=1'))`,
  );
  await js(
    `([...document.querySelectorAll('th button')].find(el=>el.textContent.includes('Holder'))).click()`,
  );
  await waitFor(
    `window.__requests.some(r=>r.path.startsWith('policy-registry/')&&r.query.includes('sort=holder'))`,
  );
  await pick(0, "Season A 2026");
  await waitFor(
    `window.__requests.some(r=>r.path.startsWith('policy-registry/')&&new URLSearchParams(r.query).get('season')==='Season A 2026'&&r.query.includes('page=1'))`,
  );
  await mount("/government/claims", "Claim Tracking");
  await pick(1, "Maize");
  await waitFor(
    `window.__requests.some(r=>r.path.startsWith('claims-registry/')&&r.query.includes('crop=MAIZE'))`,
  );
  await clickText("By Claims");
  await js(`document.querySelector('tbody tr').click()`);
  await waitFor(
    `document.body.innerText.includes('Field inspection requested')`,
  );
  await delay(1800);
  await shot("claim-detail-desktop");
  for (const width of [320, 375, 768]) {
    await size(width);
    results.push({
      page: "claim-detail",
      width,
      ...(await js(
        `({scroll:document.documentElement.scrollWidth,errors:window.__errors})`,
      )),
    });
  }
  await size(375);
  await shot("claim-detail-mobile");
  await click('[role=tab][id$="-reports"]');
  await waitFor(`document.body.innerText.includes('Attached Reports')`);
  assert.ok(
    await js(`document.querySelector('a[href$="test-report.pdf"]')!==null`),
  );
  for (const width of [320, 375, 768, 1440]) {
    await size(width);
    results.push({
      page: "claim-reports",
      width,
      ...(await js(
        `({scroll:document.documentElement.scrollWidth,errors:window.__errors})`,
      )),
    });
    if (width === 375) await shot("claim-reports-mobile");
  }

  await click('[role=tab][id$="-weather"]');
  await waitFor(
    `document.body.innerText.includes('Accumulated Statistics')&&window.__requests.some(r=>r.path.includes('/weather/historical'))`,
  );
  await delay(1800);
  for (const width of [320, 375, 768, 1440]) {
    await size(width);
    results.push({
      page: "claim-weather",
      width,
      ...(await js(
        `({scroll:document.documentElement.scrollWidth,errors:window.__errors})`,
      )),
    });
    if (width === 375) await shot("claim-weather-mobile");
  }

  await size(1920);
  await delay(600);
  await shot("claim-weather-desktop");

  await size(375);
  await mount("/government/leaderboard?region=nyabubare", "Registered farmers");
  assert.ok(
    await js(
      `([...document.querySelectorAll('div.group')].find(el=>el.textContent.startsWith('Insured'))).innerText.replace(/\\s/g,'').includes('100%')`,
    ),
  );
  assert.equal(
    await js(
      `document.querySelector('table[aria-label="Registered farmers"] tbody tr').children[10].textContent.trim()`,
    ),
    "Yes",
  );
  await js(`document.querySelector('a[href*="farmer=farmer-one"]').click()`);
  await waitFor(`document.body.innerText.includes('Crop Portfolio')`);
  assert.ok(
    await js(
      `([...document.querySelectorAll('div.group')].find(el=>el.textContent.startsWith('Insured Plantings'))).innerText.replace(/\\s/g,'').includes('33%')`,
    ),
  );
  const coverageStatuses = await js(
    `(()=>{const table=[...document.querySelectorAll('table')].find(t=>t.querySelector('th')?.textContent.trim()==='Policy ID');return [...table.querySelectorAll('tbody tr')].map(row=>row.lastElementChild.textContent.trim())})()`,
  );
  assert.deepEqual(coverageStatuses, ["Active", "Expired", "Expired"]);
  await shot("insured-profile-mobile");
  await mount("/government/leaderboard?region=nyabubare", "Registered farmers");
  await click('button[aria-label="Show parent regions"]');
  assert.ok(
    await js(
      `[...document.querySelectorAll('[role=menuitem]')].some(el=>el.textContent.includes('Rukara'))`,
    ),
  );
  await js(
    `([...document.querySelectorAll('[role=menuitem]')].find(el=>el.textContent.includes('Rukara'))).click()`,
  );
  await waitFor(`document.body.innerText.includes('Rukara Sector')`);
  const scrollable = await js(
    `(()=>{const el=document.querySelector('[aria-label="Farmer table, horizontally scrollable"]');el.scrollLeft=200;return {scrolled:el.scrollLeft,columns:el.querySelectorAll('th').length}})()`,
  );
  assert.ok(scrollable.scrolled > 0);
  assert.equal(scrollable.columns, 15);
  await size(1440);
  await mount("/government/leaderboard", "Eastern");
  await pick(1, "Village");
  await waitFor(
    `window.__requests.some(r=>r.path==='leaderboard/rwanda'&&r.query.includes('level=VILLAGE'))`,
  );
  await mount("/government/dashboard", "NDVI Trajectory");
  await js(
    `([...document.querySelectorAll('button')].find(el=>el.textContent.includes('NDVI decline'))).click()`,
  );
  await waitFor(`document.querySelector('[role=dialog]')`);
  assert.ok(
    await js(
      `document.querySelector('[role=dialog]').innerText.includes('Review the latest observation')`,
    ),
  );
  await js(`document.querySelector('[role=dialog] button').click()`);
  console.log(
    JSON.stringify({ stage: "registry-hierarchy-claim-interactions-passed" }),
  );
  await size(375);
  await mount("/government/dashboard", "NDVI Trajectory");
  await click("button:has(svg.lucide-align-left)");
  await waitFor(
    `document.querySelector('aside').getBoundingClientRect().left>=0`,
  );
  await clickText("Policies");
  await waitFor(`document.body.innerText.includes('Policy Registry')`);
  await waitFor(
    `document.querySelector('aside').getBoundingClientRect().right<=0`,
  );
  await size(1440);
  await click("button:has(svg.lucide-align-left)");
  await delay(350);
  assert.ok(
    await js(
      `document.querySelector('aside').getBoundingClientRect().width<100`,
    ),
  );
  await click("button:has(svg.lucide-align-left)");
  await delay(350);
  await mount("draft", "Prepare Invoice");
  await clickText("Prepare Invoice");
  await waitFor(`document.body.innerText.includes('Process Payment')`);
  assert.ok(
    await js(
      `window.__requests.some(r=>r.path==='subsidy-invoices/rwanda'&&r.method==='POST')`,
    ),
  );
  await mount("invoice", "Payment Overview");
  await click('button[aria-label="Zoom in invoice"]');
  assert.equal(
    await js(
      `document.querySelector('[aria-label="Invoice zoom"]').textContent`,
    ),
    "125%",
  );
  await click('button[aria-label="Zoom out invoice"]');
  await call(
    "Browser.setDownloadBehavior",
    { behavior: "allow", downloadPath: downloads },
    undefined,
  );
  const downloadStart = Date.now();
  await click('button[aria-label="Download invoice PDF"]');
  for (
    let i = 0;
    i < 50 &&
    !readdirSync(downloads).some(
      (n) =>
        n.endsWith(".pdf") &&
        statSync(join(downloads, n)).mtimeMs >= downloadStart,
    );
    i++
  )
    await delay(100);
  assert.ok(
    readdirSync(downloads).some(
      (n) =>
        n.endsWith(".pdf") &&
        statSync(join(downloads, n)).mtimeMs >= downloadStart,
    ),
    "Invoice PDF was downloaded",
  );
  await clickText("Process Payment");
  await waitFor(`document.querySelector('[role=dialog]')`);
  await inputText("[role=dialog] input:not([type=date])", "BANK-UI-001");
  await clickText("Record payment");
  await waitFor(`document.body.innerText.includes('Already Paid')`);
  await mount("invoice", "Process Payment");
  await clickText("Reject");
  await inputText("[role=dialog] textarea", "Incorrect premium details");
  await clickText("Reject invoice");
  await waitFor(`document.body.innerText.includes('Rejected')`);
  assert.ok(
    await js(
      `window.__requests.some(r=>r.path.endsWith('/payment')&&r.method==='POST')`,
    ),
  );
  assert.ok(
    await js(
      `window.__requests.some(r=>r.path.endsWith('/reject')&&r.method==='POST')`,
    ),
  );
  writeFileSync(
    join(
      output,
      process.env.GOVERNMENT_BROWSER_INTERACTIONS_ONLY === "1"
        ? "interaction-results.json"
        : "results.json",
    ),
    JSON.stringify(results, null, 2),
  );
  const overflow = results.filter((r) => r.scroll > r.width);
  const errors = [
    ...new Set(
      results.flatMap((r) => r.errors).concat(await js("window.__errors")),
    ),
  ];
  console.log(
    JSON.stringify({
      stage: "complete",
      layoutChecks: results.length,
      overflow,
      errors,
      screenshots,
      interactions: "passed",
    }),
  );
  assert.deepEqual(overflow, []);
  assert.deepEqual(errors, []);
} catch (error) {
  console.error(error);
  console.log(
    JSON.stringify({
      body: await js("document.body.innerText").catch(() => ""),
      errors: await js("window.__errors").catch(() => []),
    }),
  );
  process.exitCode = 1;
} finally {
  await call("Browser.close", {}, undefined).catch(() => {});
  chrome.kill();
}
