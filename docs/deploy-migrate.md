# 프로덕션 DB 마이그레이션 — 쉽게 하는 방법

배포한 서버의 DB에 "새로 추가한 항목(예: 취소 주체 컬럼)"을 반영하는 걸 **마이그레이션**이라고 해요.  
아래 **3단계**만 하면 됩니다.

---

## 1단계: 프로덕션 DB 주소 복사

1. [vercel.com](https://vercel.com) 로그인 → **우리 프로젝트** 클릭
2. 위쪽 메뉴에서 **Settings** 클릭
3. 왼쪽에서 **Environment Variables** 클릭
4. 목록에서 **DATABASE_URL** 찾기 → **Production** 줄에 있는 **값**(연결 주소) 옆 **복사 버튼** 눌러서 복사  
   (또는 값 칸 클릭해서 전체 선택 후 Ctrl+C)

---

## 2단계: 터미널 열기

- VS Code / Cursor 사용 중이면: **터미널** 탭 열기 (또는 `` Ctrl+` ``)
- 프로젝트 폴더가 아니라면 먼저:
  ```text
  cd c:\project_kstay_1st
  ```

---

## 3단계: 두 줄 입력

**첫 번째 줄** (아래 한 줄 통째로 쓰고, `여기` 부분만 아까 복사한 주소로 바꿔서 붙여넣기):

```powershell
$env:DATABASE_URL="여기에_복사한_DATABASE_URL_붙여넣기"
```

예시 (실제로는 본인 DB 주소가 들어감):

```powershell
$env:DATABASE_URL="postgresql://postgres.xxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

**Enter** 친 다음, **두 번째 줄**:

```powershell
npx prisma migrate deploy
```

**Enter** 치면 끝입니다.

---

## 끝났을 때

- **잘 된 경우:**  
  `X migration(s) have been applied` 비슷한 문구가 나오면 성공입니다. 아무것도 더 안 해도 됩니다.
- **에러가 나온 경우:**  
  - `DATABASE_URL`을 다시 확인 (따옴표 `"` 로 감싸기, 앞뒤 공백 없이)
  - 인터넷 연결 확인
  - 그래도 안 되면 에러 메시지 그대로 복사해서 알려주시면 됩니다.

---

**한 줄 요약:**  
Vercel에서 `DATABASE_URL` 복사 → 터미널에서 `$env:DATABASE_URL="복사한값"` 입력 → `npx prisma migrate deploy` 입력.
