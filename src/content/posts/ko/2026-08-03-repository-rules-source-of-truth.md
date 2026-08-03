---
title: 규칙은 기억이 아니라 저장소에 남긴다
description: 메모리 인증 실패 뒤, 에이전트가 매 작업마다 저장소의 규칙 원문을 다시 읽도록 바꾼 과정의 기록.
pubDate: 2026-08-03
tags: [자동화, 에이전트, 운영]
draft: true
evidence:
  - type: code
    ref: openclaw/RULES.md
    note: 매 작업 시작 시 저장소 원문을 다시 읽도록 정한 실제 운영 규칙.
  - type: code
    ref: openclaw/HEARTBEAT.md
    note: 원격 실행 환경의 접근 경계와 질문 기반 작업 흐름을 반영한 실제 스케줄 정의.
sources:
  - https://github.com/hyunshagain/hyeon-blog/blob/main/openclaw/RULES.md
  - https://github.com/hyunshagain/hyeon-blog/blob/main/openclaw/HEARTBEAT.md
  - https://github.com/hyunshagain/hyeon-blog/commit/4e61ece91fc1561200af048e0eeec5ad2bec76ee
---

## 401이 드러낸 단일 실패 지점

## 캐시와 원본의 경계를 어디에 그었나

<!-- analysis:start -->
<!-- analysis:end -->

## 매번 다시 읽는 비용을 받아들인 이유

## 다음 실행에서 확인할 것
