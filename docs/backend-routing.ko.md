# 백엔드 라우팅(폴더 트리 기반)

이 백엔드는 간단한 파일 트리 기반 라우터를 사용합니다.

## 라우트 위치

- `apps/be/src/routes/**`

## 파일 경로 -> URL 경로 매핑

- `routes/index.ts` -> `/`
- `routes/health.ts` -> `/health`
- `routes/users/index.ts` -> `/users`
- `routes/users/[id].ts` -> `/users/:id`

참고:

- `_`로 시작하는 파일은 라우트로 로드되지 않습니다(예: `_loader.ts`).

## 디렉터리 스코프 미들웨어

`jwt()`, `cookie()` 같은 미들웨어/플러그인을 특정 라우트 하위 트리에만 적용하려면 아래 파일을 추가하면 됩니다.

- `apps/be/src/routes/**/_middleware.ts`

해당 디렉터리(및 하위 디렉터리)의 라우트들에만 미들웨어가 적용됩니다.

모듈 형태:

```ts
export default (app: any) => app.use(/* plugin */);
// 또는
export const middleware = (app: any) => app.use(/* plugin */);
```

## 라우트 모듈 형태

각 라우트 파일은 아래를 export 합니다.

- `method` (선택): HTTP 메서드 (기본값: `get`)
- `handler` (필수): Elysia handler 함수
- `options` (선택): route options/schema

예시:

```ts
export const method = "get";

export const handler = () => "OK";
```

## 구현 위치

- 로더: `apps/be/src/routes/_loader.ts`
- 등록 엔트리: `apps/be/src/routes.ts`, `apps/be/src/index.ts`
