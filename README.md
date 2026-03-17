# ▶ eduPLAY v2 — 인터넷 어디서나 접속 가능

---

## 📁 폴더 구조

```
eduplay/
├── server.js           ← Node.js 서버
├── package.json
├── render.yaml         ← Render.com 배포 설정
├── data/
│   └── courses.json    ← 강의 데이터 (자동 생성)
└── public/
    ├── player.html     ← 플레이어 (누구나 접속 가능)
    ├── admin.html      ← 관리자 (비밀번호 필요)
    ├── login.html      ← 관리자 로그인
    ├── videos/         ← 영상 파일
    └── pdfs/           ← PDF 파일
```

---

## 🚀 배포 방법 (무료 · 추천: Render.com)

### 1단계 — GitHub에 코드 올리기

```bash
git init
git add .
git commit -m "eduplay init"
```

GitHub에서 새 repository 만들고:
```bash
git remote add origin https://github.com/내아이디/eduplay.git
git push -u origin main
```

### 2단계 — Render.com 배포

1. https://render.com 가입 (무료)
2. **"New Web Service"** 클릭
3. GitHub repository 연결
4. 설정:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Environment Variables** 추가:
   - `ADMIN_PASSWORD` = `원하는비밀번호`
6. **Deploy** 클릭

배포 완료 후 주소 예시:
```
https://eduplay-xxxx.onrender.com/player.html   ← 플레이어
https://eduplay-xxxx.onrender.com/login.html    ← 관리자 로그인
```

> ✅ 이 주소로 전 세계 어디서나 접속 가능합니다.

---

## 🌐 다른 무료 배포 옵션

| 서비스 | 무료 티어 | 특징 |
|--------|-----------|------|
| **Render.com** | ✅ 무료 | 추천, GitHub 연동 쉬움 |
| **Railway.app** | ✅ $5 크레딧 | 빠른 배포 |
| **Fly.io** | ✅ 무료 | 성능 좋음 |
| **VPS (AWS/GCP/Oracle)** | 일부 무료 | 영상 대용량 저장에 유리 |

---

## ⚠️ 영상 파일 용량 주의사항

Render.com 무료 플랜은 **디스크 저장이 휘발성**입니다.
서버가 재시작되면 `public/videos/`, `public/pdfs/`에 올린 파일이 사라집니다.

### 영상 파일 권장 방법

**방법 1 (간단): Google Drive / Dropbox 직접 링크**
- 파일을 Google Drive에 업로드 → 공유 → 직접 링크 생성
- 관리자 페이지의 "영상 파일 경로"에 URL 입력
  ```
  예: https://drive.google.com/uc?export=download&id=파일ID
  ```

**방법 2 (안정적): AWS S3 / Cloudflare R2**
- 영상/PDF를 S3에 업로드 후 URL 사용
- Cloudflare R2는 무료 티어 10GB 제공

**방법 3 (직접 서버): VPS 사용**
- Oracle Cloud Free Tier (영구 무료 VM) 권장
- 디스크 저장이 영구적

---

## 🔐 관리자 비밀번호 변경

Render.com 대시보드 → Environment Variables:
```
ADMIN_PASSWORD = 새비밀번호
```

또는 로컬에서:
```bash
ADMIN_PASSWORD=새비밀번호 node server.js
```

---

## 💻 로컬 실행

```bash
npm install
node server.js
# → http://localhost:3000
```
