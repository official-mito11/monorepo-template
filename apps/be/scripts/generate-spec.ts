// generate_spec.ts (새로운 파일 생성)

import { app } from "../src/index"; // 여러분의 Elysia 인스턴스를 export 한 파일
import { writeFile } from "fs/promises";
import path from "path";

async function generateSpec() {
  // 1. /openapi/json 경로로 요청을 처리합니다.
  const response = await app.handle(new Request("http://localhost/openapi/json"));

  if (response.status !== 200) {
    console.error("Failed to get OpenAPI spec:", response.statusText);
    return;
  }

  // 2. 응답 본문(JSON)을 텍스트로 읽습니다.
  const specText = await response.text();

  // 3. 로컬 파일로 저장합니다.
  await writeFile(
    path.join(process.cwd(), "../../packages/api-client", "openapi-spec.json"),
    specText
  );
  console.log("✅ OpenAPI spec saved to openapi-spec.json");
  process.exit(0);
}

generateSpec();
