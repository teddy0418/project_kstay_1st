/**
 * One-command host listings E2E diagnostics.
 * Opens the diagnostics page with ?autostart=1 so that after login the run starts automatically.
 * Do not print env values, only key names.
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, "utf8")) : {};
const devScript = pkg.scripts?.dev ?? "";

// Infer port: -p 3001 or --port 3001 from dev script, else 3000, fallback 3001
let port = 3000;
const portMatch = devScript.match(/-p\s+(\d+)|--port\s+(\d+)/);
if (portMatch) {
  port = parseInt(portMatch[1] || portMatch[2], 10) || 3000;
} else if (devScript.includes("3001")) {
  port = 3001;
}

const url = `http://localhost:${port}/host/tools/listings-e2e?autostart=1`;

console.log("");
console.log("호스트 리스팅 E2E 진단");
console.log("------------------------");
console.log("진단 페이지를 사용하려면 다음 환경 변수 중 하나를 true로 설정하세요 (키 이름만 안내):");
console.log("  - ENABLE_HOST_LISTINGS_DIAGNOSTICS");
console.log("  - NEXT_PUBLIC_ENABLE_HOST_LISTINGS_DIAGNOSTICS");
console.log("");
console.log("dev 서버가 이미 실행 중인지 확인하세요. 없으면 다른 터미널에서 npm run dev 를 실행한 뒤 다시 시도하세요.");
console.log("");
console.log(`브라우저를 엽니다: ${url}`);
console.log("");

function openBrowser(targetUrl) {
  const platform = process.platform;
  let cmd;
  let args;
  if (platform === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", targetUrl];
  } else if (platform === "darwin") {
    cmd = "open";
    args = [targetUrl];
  } else {
    cmd = "xdg-open";
    args = [targetUrl];
  }
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true });
  } catch (err) {
    console.error("브라우저를 열 수 없습니다. 아래 URL을 직접 열어주세요:");
    console.error(targetUrl);
  }
}

openBrowser(url);

console.log("로그인만 하면 자동으로 진단이 실행됩니다.");
console.log("");
