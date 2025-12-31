# 아키텍처

## 모노레포 구조

- `apps/fe`: 프론트엔드 (Vite + React + TanStack Router/Query)
- `apps/be`: 백엔드 (Bun + Elysia)
- `packages/shared`: 공용 타입/유틸 (PrismaBox 생성 타입 포함)
- `packages/api-client`: OpenAPI로 생성된 클라이언트(프론트에서 사용)

## 백엔드 프로세스 타입

백엔드는 여러 프로세스 타입을 지원하며, 각각 별도의 Elysia 앱으로 실행됩니다:

| 프로세스 타입 | 포트 | 설명 |
|-------------|------|-------------|
| `main` | 8000 | 메인 API 서버 (기본값) |
| `admin` | 8001 | 별도 라우트를 가진 어드민 서버 |
| `worker` | - | 백그라운드 작업 프로세서 (HTTP 없음) |

### 프로세스 타입별 실행 방법

```bash
# 메인 API 서버 (기본값)
bun run dev

# 어드민 서버
bun run dev:admin

# 동시에 실행
bun run dev & bun run dev:admin
```

### 디렉토리 구조

```
apps/be/src/
├── routes/        # 메인 API 라우트 (포트 8000)
├── routes-admin/  # 어드민 라우트 (포트 8001)
├── config/
│   ├── env.ts     # 환경 설정
│   └── process.ts # 프로세스 타입 설정
├── app.ts         # 앱 팩토리
└── index.ts       # 진입점
```

## 데이터/계약(Contract) 흐름

- 백엔드는 OpenAPI 스펙을 노출합니다(기본은 dev 환경).
- `apps/be/scripts/generate-spec.ts`가 `/openapi/json`을 가져와 `packages/api-client/openapi-spec.json`에 저장합니다.
- `openapi-typescript-codegen`이 `packages/api-client/generated`에 클라이언트를 생성합니다.
- 후처리(postprocess) 단계에서 생성 결과를 브라우저 친화적으로 정규화합니다.

## 환경 변수 & 설정

- 백엔드 env: `apps/be/.env` (`.env.example`에서 복사)
- CORS, 쿠키 동작, DB URL 등은 env로 제어합니다.
- 프로세스 타입은 `PROCESS_TYPE` env 변수로 제어합니다.

## CI

GitHub Actions에서 다음을 수행합니다.

- 포맷 체크
- 린트
- 타입체크
- 테스트(BE/FE)
