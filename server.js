const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────────────
//  설정 — 환경변수 또는 기본값
//  배포 시 반드시 ADMIN_PASSWORD를 변경하세요!
// ──────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'eduplay1234';
const DATA_FILE      = path.join(__dirname, 'data', 'courses.json');
const PUBLIC         = path.join(__dirname, 'public');

// ── 세션 토큰 저장 (메모리, 재시작하면 초기화됨)
const activeSessions = new Set();

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ──────────────────────────────────────────────────────
//  미들웨어
// ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// 보안 헤더
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// 관리자 인증 미들웨어
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && activeSessions.has(token)) return next();
  res.status(401).json({ error: '인증이 필요합니다', needLogin: true });
}

// ──────────────────────────────────────────────────────
//  정적 파일 (player.html, videos/, pdfs/ 등)
//  admin.html은 별도로 보호
// ──────────────────────────────────────────────────────
// admin.html 직접 접근 차단 — login.html 통해서만
app.get('/admin.html', (req, res) => {
  const token = req.query.token;
  if (token && activeSessions.has(token)) {
    res.sendFile(path.join(PUBLIC, 'admin.html'));
  } else {
    res.redirect('/login.html');
  }
});

// 나머지 정적 파일 (player.html, login.html, videos/, pdfs/)
app.use(express.static(PUBLIC));

// ──────────────────────────────────────────────────────
//  인증 API
// ──────────────────────────────────────────────────────
// 로그인
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = makeToken();
    activeSessions.add(token);
    // 24시간 후 자동 만료
    setTimeout(() => activeSessions.delete(token), 24 * 60 * 60 * 1000);
    res.json({ ok: true, token });
  } else {
    res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
  }
});

// 로그아웃
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) activeSessions.delete(token);
  res.json({ ok: true });
});

// 토큰 검증
app.get('/api/auth/check', (req, res) => {
  const token = req.headers['x-admin-token'];
  res.json({ valid: token ? activeSessions.has(token) : false });
});

// ──────────────────────────────────────────────────────
//  강의 데이터 API
// ──────────────────────────────────────────────────────
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return []; }
}
function writeData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 전체 조회 — 누구나 읽기 가능 (플레이어용)
app.get('/api/courses', (req, res) => {
  res.json(readData());
});

// 저장 — 관리자만
app.post('/api/courses', requireAdmin, (req, res) => {
  try {
    const data = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ error: '배열 형식이어야 합니다' });
    writeData(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────
//  파일 목록 API — 관리자만
// ──────────────────────────────────────────────────────
app.get('/api/files/videos', requireAdmin, (req, res) => {
  try {
    const exts = ['.mp4', '.webm', '.ogg', '.mov'];
    const files = fs.readdirSync(path.join(PUBLIC, 'videos'))
      .filter(f => exts.includes(path.extname(f).toLowerCase()))
      .map(f => ({ name: f, path: 'videos/' + f }));
    res.json(files);
  } catch { res.json([]); }
});

app.get('/api/files/pdfs', requireAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(path.join(PUBLIC, 'pdfs'))
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => ({ name: f, path: 'pdfs/' + f }));
    res.json(files);
  } catch { res.json([]); }
});

// ──────────────────────────────────────────────────────
//  라우트
// ──────────────────────────────────────────────────────
app.get('/', (_, res) => res.redirect('/player.html'));
app.get('/admin', (req, res) => res.redirect('/login.html'));

// ──────────────────────────────────────────────────────
//  초기 데이터
// ──────────────────────────────────────────────────────
if (!fs.existsSync(DATA_FILE)) {
  writeData([{
    id: 'cat_demo', label: '1. 예시 강의', icon: '🎬', color: '#4f8cff',
    subcategories: [{
      id: 'sub_demo', label: '1-1. 시작하기',
      videos: [{
        id: 'vid_demo', title: '샘플 강의',
        src: '', duration: '',
        desc: '관리 페이지에서 영상 경로와 PDF 자료를 설정하세요.',
        pdfs: []
      }]
    }]
  }]);
}

// ──────────────────────────────────────────────────────
//  서버 시작
// ──────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips  = [];
  for (const ifaces of Object.values(nets))
    for (const iface of ifaces)
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ▶  eduPLAY v2 시작됨');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  로컬:     http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  네트워크: http://${ip}:${PORT}`));
  console.log('');
  console.log(`  플레이어: http://localhost:${PORT}/player.html`);
  console.log(`  관리자:   http://localhost:${PORT}/login.html`);
  console.log('');
  console.log(`  관리자 비밀번호: ${ADMIN_PASSWORD}`);
  console.log('  (ADMIN_PASSWORD 환경변수로 변경 권장)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
