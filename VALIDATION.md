# V4.1.6 검증 상태

Build date: 2026-10-16

## PASS — V4.1.5 베이스라인 보존
- V4.1.5 전체 패키지를 기준으로 수정했습니다.
- 기존 `firestore.multiguild.rules`는 변경하지 않았습니다.
- V4.1.5 OPS 자원 기본값 저장과 `round.id` null/draft 방어 로직을 유지했습니다.
- V4.1.4 관리자 로그인 영구 유지 경로와 명시적 로그아웃 경로를 수정하지 않았습니다.
- 은하 격전지 개편 논의 내용은 구현하지 않았습니다.

## PASS — 메인 5개 메뉴
- 길드원 / 균열·은하 / 행운룰렛 / 보상분배 / 관리자 순서입니다.
- 기존 카드 테두리/아이콘 언어를 유지하고 5개가 한 줄에 들어가도록 폭과 아이콘 크기만 조정했습니다.
- 행운룰렛은 통합 라우터의 `roulette` 경로로 이동합니다.

## PASS — 행운 룰렛 권한·저장 정책
- 관리자 인증을 요구하는 코드가 없습니다. 일반 길드원도 동일하게 사용할 수 있습니다.
- Firestore write, 관리자 audit write, localStorage/sessionStorage write를 사용하지 않습니다.
- 현재 길드의 roster는 V4 context/guild-core에서 읽기만 합니다.

## PASS — 추첨 흐름
- 참여 인원 2~16명 선택 후 같은 수의 길드원을 선택해야 다음 단계가 열립니다.
- 추첨 항목 수를 먼저 선택하고 항목명 입력칸을 동적으로 생성합니다.
- 모든 입력이 완료되어야 시작 버튼이 활성화됩니다.
- `crypto.getRandomValues()` 기반으로 당첨 계획을 먼저 확정하고 룰렛 애니메이션은 확정 결과에 맞춰 회전합니다.
- 한 회차 당첨자는 다음 회차 pool에서 제거되어 중복 당첨이 발생하지 않습니다.
- 시작 버튼 한 번으로 모든 회차가 자동 진행되고 최종 결과는 전체 회차 종료 뒤 출력됩니다.

## PASS — 단톡방 결과 이미지
- 결과 화면의 `단톡방 결과 이미지` 버튼에서 1080×1350 PNG를 생성합니다.
- 결과 미리보기, Web Share API 파일 공유, PNG 저장 fallback을 제공합니다.
- 공유 이미지 생성은 메모리/Blob URL만 사용하며 기록을 저장하지 않습니다.

## 정적 검증
- `index-module.mjs` 및 `shared/*.js` Node 구문 검사.
- `main.html`, `boss.html`, `ops.html`, `roulette.html` inline script 구문 검사.
- 로컬 정적 참조 누락 검사.
- 라우팅 `main/boss/ops/roulette` 연결 검사.
- BUILD_MANIFEST SHA-256 재생성 및 ZIP CRC 검사.

실제 iPhone + GitHub Pages 환경에서는 룰렛 애니메이션, iOS 시스템 공유 시트, 기존 관리자 로그인 영구 유지, Firestore 실시간 roster 갱신을 최종 확인하는 것을 권장합니다.
