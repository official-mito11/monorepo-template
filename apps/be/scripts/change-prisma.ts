#!/usr/bin/env bun

/**
 * Prisma schema provider 변경 스크립트
 * Usage:
 *   bun scripts/change-prisma.ts postgresql  # PostgreSQL로 변경
 *   bun scripts/change-prisma.ts sqlite      # SQLite로 변경
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const SCHEMA_PATH = resolve(__dirname, "../prisma/schema.prisma");

type Provider = "sqlite" | "postgresql";

const VALID_PROVIDERS: Provider[] = ["sqlite", "postgresql"];

function changeProvider(targetProvider: Provider) {
  const schema = readFileSync(SCHEMA_PATH, "utf-8");

  // provider = "sqlite" 또는 provider = "postgresql" 패턴 찾기
  const providerRegex = /provider\s*=\s*["'](sqlite|postgresql)["']/;
  const match = schema.match(providerRegex);

  if (!match) {
    console.error("❌ schema.prisma에서 provider를 찾을 수 없습니다.");
    process.exit(1);
  }

  const currentProvider = match[1] as Provider;

  if (currentProvider === targetProvider) {
    console.log(`✅ 이미 ${targetProvider}로 설정되어 있습니다.`);
    return;
  }

  const newSchema = schema.replace(providerRegex, `provider = "${targetProvider}"`);

  writeFileSync(SCHEMA_PATH, newSchema, "utf-8");
  console.log(`✅ provider를 ${currentProvider} → ${targetProvider}로 변경했습니다.`);
}

// Main
const targetProvider = process.argv[2] as Provider;

if (!targetProvider || !VALID_PROVIDERS.includes(targetProvider)) {
  console.log(`
Usage: bun scripts/change-prisma.ts <provider>

Providers:
  sqlite      - 개발 환경 (로컬)
  postgresql  - 프로덕션 환경
  
Examples:
  bun scripts/change-prisma.ts postgresql
  bun scripts/change-prisma.ts sqlite
`);
  process.exit(1);
}

changeProvider(targetProvider);
