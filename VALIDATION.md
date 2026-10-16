# V4.1.5 검증 상태

Build date: 2026-10-16

## PASS — 회차 미진행 차공 시간 저장
- 회차가 없는 `draft` 상태에서는 `persistRound()`를 호출하지 않고 `data/opsResourceDefaults`에 길드원별 시작 시간을 저장하도록 분리했습니다.
- 회차 미진행 시작 시간은 20:00~22:00, 20초 단위만 허용합니다.
- 저장 후 draft 자원표를 새 기본값으로 다시 생성합니다.
- 로컬 OPS 캐시에도 시작시간 기본값을 함께 보존합니다.
- 다음 새 회차 생성 시 저장된 기본값이 길드원 `initialSeconds`에 반영됩니다.

## PASS — null round 방어
- `persistRound()`는 `round.id`가 없거나 draft이면 Firestore 회차 저장을 실행하지 않습니다.
- Firebase `saveRound()`의 공통 payload 생성기에서도 `round.id`를 재검증합니다.
- 따라서 `doc(..., round.id)`에 null이 전달되는 경로를 차단했습니다.

## PASS — 진행 중 회차 호환
- 기존 칼/시간 사용량 계산은 유지합니다.
- 진행 중 회차에서 기존 시작시간보다 큰 차공 한도가 필요한 경우 현재 회차와 `opsResourceDefaults`를 batch로 함께 저장합니다.
- 기존 기본값보다 작은 현재 잔여시간 조정은 향후 기본 시작시간을 감소시키지 않습니다.
- 최대 시간 22:00 규칙은 그대로 유지합니다.

## PASS — Firestore Rules 검토
- 새 문서는 `guilds/{guildId}/data/opsResourceDefaults`를 사용합니다.
- 현재 Rules의 `match /data/{docId}`에서 `guildAdmin(guildId)`에게 create/update가 이미 허용되어 있습니다.
- 따라서 Rules 수정이나 재배포가 필요하지 않습니다.

## PASS — 관리자 로그인 유지
- V4.1.4의 `browserLocalPersistence` 우선 인증과 명시적 로그아웃 전 로그인 유지 구조를 변경하지 않았습니다.

## 정적 검증
- JavaScript/inline script 구문 검사.
- 로컬 정적 참조 누락 검사.
- `rounds/null` 방지 불변조건 검사.
- `opsResourceDefaults` 저장/로드/구독 경로 검사.
- BUILD_MANIFEST SHA-256 재생성 및 ZIP CRC 검사.

실제 iPhone + GitHub Pages + Firestore 네트워크 환경의 최종 저장 동작은 배포 후 한 번 확인해야 합니다.
