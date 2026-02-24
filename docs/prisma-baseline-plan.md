# Prisma Baseline Plan (실행 금지 — 운영/공유 DB 의심)

## 전제
- 현재 DB: Supabase PostgreSQL (원격, host에 dev/test 표시 없음)
- `_prisma_migrations` 테이블: **없음** (`scripts/inspect-db.mjs` 확인)
- `npx prisma migrate deploy` 시 **P3005** (database schema not empty) 발생
- **판단:** prod/공유 DB 가능성 있음 → baseline 관련 명령은 **실행하지 않고** 아래 plan만 참고용으로 사용

---

## 목표
- Prisma 마이그레이션 히스토리와 실제 DB 상태를 맞춰, 향후 `migrate deploy`가 정상 동작하도록 준비

---

## 단계별 Plan (팀/DBA 합의 후에만 실행)

### 1. 현재 DB 스키마와 migrations 폴더 상태 확인
- `npx prisma migrate diff --from-config-datasource --to-migrations prisma/migrations --script`
  - 출력이 비어 있으면: DB가 이미 모든 migration 적용된 상태와 동일
  - 출력이 있으면: diff 내용 검토 후, “기존 DB에 수동 적용된 변경”인지 “아직 적용 안 된 migration”인지 구분

### 2. _prisma_migrations 테이블 생성 (Prisma가 생성하도록)
- Prisma는 `migrate deploy` 또는 `migrate resolve` 시 테이블이 없으면 생성할 수 있음
- 수동 생성 시:
  ```sql
  -- Prisma 문서/버전에 맞는 정확한 DDL은 공식 문서 참고
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMPTZ,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  );
  ```
- 실제 스키마는 `npx prisma migrate diff` 또는 Prisma 소스에서 확인 권장

### 3. 기존 migration을 “이미 적용됨”으로 표시 (resolve --applied)
- **조건:** DB에 이미 해당 migration의 변경(컬럼/테이블)이 반영되어 있을 때만
- `prisma/migrations` 폴더 내 migration 이름을 **시간순**으로 나열한 뒤, 각각:
  ```bash
  npx prisma migrate resolve --applied "<migration_name>"
  ```
  예: `20260214153905_init`, `20260222000200_listing_title_i18n`, … 순서대로 실행
- **주의:** 실제 DB에 해당 migration이 적용되어 있지 않은데 resolve 하면, 이후 deploy 시 해당 migration이 스킵되어 스키마 불일치 발생 가능

### 4. 적용 여부 검증
- `npx prisma migrate deploy` 실행
- “No pending migrations” 또는 “Already in sync” 등으로 끝나면 성공
- 여전히 P3005 등이 나오면, Prisma 문서의 “Baseline an existing production database” 절차를 다시 확인

### 5. 롤백/중단
- 위 단계 중 **prod/공유 DB**라고 판단되면 즉시 중단
- `_prisma_migrations`에 잘못 넣은 레코드는 수동 삭제 가능하나, Prisma 버전별 스키마가 다를 수 있으므로 주의

---

## 참고
- [Prisma: Baseline an existing production database](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baseline-an-existing-production-database)
- 현재 프로젝트 migrations 목록: `prisma/migrations/` 하위 폴더명이 migration name
