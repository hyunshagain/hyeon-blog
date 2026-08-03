# 리서치 노트 — 에이전트 규칙의 원본을 저장소에 둔 이유

## 확인된 사실

- `openclaw/RULES.md`에는 매 작업 시작 시 영구 메모리 대신 저장소 원문을 다시 읽으라는 규칙이 있다.
- 같은 파일은 검사 결과나 수치를 지어내지 말고, 실제 게이트 또는 CI 출력만 인용하도록 요구한다.
- `openclaw/HEARTBEAT.md`는 작업용 컴퓨터의 로컬 폴더를 볼 수 없다는 실행 환경의 경계를 명시한다.

## 사람이 확인할 것

- 메모리 의미 검색 HTTP 401이 발생한 정확한 시점과 사용자에게 공개해도 되는 오류 범위.
- 규칙 원본화 전후에 실제로 달라진 작업 흐름.
- 반복해서 원문을 읽는 비용을 감수하기로 한 최종 판단.

## 출처 URL

- https://github.com/hyunshagain/hyeon-blog/blob/main/openclaw/RULES.md
- https://github.com/hyunshagain/hyeon-blog/blob/main/openclaw/HEARTBEAT.md
- https://github.com/hyunshagain/hyeon-blog/commit/4e61ece91fc1561200af048e0eeec5ad2bec76ee
