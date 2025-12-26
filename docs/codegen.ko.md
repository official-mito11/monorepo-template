# 코드 생성(Prisma + OpenAPI 클라이언트)

## 개요

이 템플릿은 코드 생성을 통해 백엔드 계약(스펙)과 프론트엔드 클라이언트를 동기화합니다.

## 명령어

리포 루트에서:

```bash
bun run generate
```

위 명령은 다음을 수행합니다.

- `generate:prisma` -> Prisma generate(백엔드)
- `generate:client` -> OpenAPI 스펙 생성 + OpenAPI 클라이언트 생성(백엔드)

## OpenAPI 생성 파이프라인

백엔드 스크립트:

- `apps/be/scripts/generate-spec.ts`
  - `app.handle(new Request("http://localhost/openapi/json"))` 호출
  - `packages/api-client/openapi-spec.json` 저장

- `apps/be` 스크립트 `generate:openapi`
  - `openapi-typescript-codegen`으로 `packages/api-client/generated` 생성

- `apps/be/scripts/postprocess-openapi.ts`
  - 생성된 결과를 브라우저 환경에서 동작하도록 후처리(Node 전용 `form-data` import 제거)

## 참고

- OpenAPI endpoint는 기본 설정상 dev 환경에서 활성화됩니다.
- 백엔드 라우트/스키마 변경 후에는 `bun run generate`를 다시 실행하세요.
