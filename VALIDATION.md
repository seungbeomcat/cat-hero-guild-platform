# V4.1.1 검증 상태

Build date: 2026-10-15

## PASS — JavaScript / 파일 구조
- `index-module.mjs` Node 구문 검사 통과.
- `index.html`, `main.html`, `boss.html`, `ops.html`의 inline script 34개 구문 검사 통과.
- 명시적 로컬 `src`/`href` 48건 확인, 누락 0건. 템플릿 문자열 동적 참조 14건은 별도 제외.
- `shared/*` 및 전체 `assets/*`는 V4.1.0과 SHA-256 동일 확인.
- 메인/보스/OPS/진입 페이지 및 `firebase-config.js` V4.1.1 표기와 `v=411` 캐시 키 확인.

## PASS — 중앙관리자 버튼 UI
- 길드 카드 액션 영역을 2열 grid로 변경.
- `관리자 설정 링크`, `코드 발급·복사`, `활성화/비활성화`, `완전 삭제`에 `white-space: nowrap` 적용.
- Chromium 렌더링으로 320 / 360 / 375 / 390 / 430 / 560px 폭 검증.
- 전 폭에서 버튼 텍스트 줄바꿈·잘림·페이지 가로 overflow 0건 확인.

## PASS — 길드 완전 삭제 로직
- 삭제 대상 현재 V4 경로: `data`, `bossTimers`, `bossHistory`, `ops`, `rounds`, `admins`, `audit`.
- `guildInvites`는 `guildId` 기준으로 함께 삭제.
- 현재 `guildAccess` 해시 매핑도 함께 삭제.
- 500-write 제한 여유를 위해 400건 단위 batch 삭제.
- 실제 삭제 전에 모든 대상 경로 조회 권한을 사전확인하도록 구성. Rules 미게시 등으로 권한이 부족하면 삭제 시작 전에 중단.
- 길드명 직접 입력 + 최종 확인의 2단계 오삭제 방지 확인.
- 길드 기본 문서는 모든 하위/연결 데이터 삭제 이후 마지막에 삭제.
- 삭제 후 길드 기본 문서, 7개 하위 컬렉션, 초대코드, 전용주소 매핑 잔존 여부 재검증.
- 완료 시 `platformAudit`에 길드 ID/서버/길드명/삭제 건수/실행 중앙관리자를 기록.
- Mock Firestore 시뮬레이션에서 사전조회 → 하위 batch 삭제 → access/invite 정리 → 루트 마지막 삭제 → 잔여검증 순서 PASS.
- `permission-denied` 사전확인 실패 시 commit/delete 0건으로 중단되는 fail-safe 시뮬레이션 PASS.

## PASS — Firestore Rules 구조
- 중앙관리자의 완전 삭제에 필요한 하위 컬렉션 조회·삭제 권한 확인.
- `admins`/`audit`의 중앙관리자 삭제 권한 확인.
- `guildInvites` 목록 조회는 중앙관리자에게만 허용.
- `guildAccess` 삭제는 기존 길드관리자 또는 중앙관리자만 허용.
- `platformAudit`은 중앙관리자만 조회·생성 가능하며 수정·삭제 불가.
- Rules 중괄호/괄호 구조 균형 검사 통과.

## PASS — 기존 기능 보존
- V4.0.9 길드원 삭제/닉네임 변경 시 `members`/`aliases` 전체 map 갱신 로직 유지.
- V4.0.7 OPS 개인 최대 잔여시간 `22 * 60` 유지.
- 결과표 담당체력 한 줄 고정 규칙 유지.
- V4.1.0 상단 `v410HeaderShimmer` 효과 및 reduced-motion 대응 유지.

## PASS — 패키지
- `BUILD_MANIFEST.json`을 V4.1.1 기준으로 재생성하고 전체 파일 bytes/SHA-256 재검증.
- ZIP CRC 무결성 검사 통과.

## 배포 후 확인 필요
실제 Firebase 권한 검증은 사용 중인 프로젝트에 V4.1.1 `firestore.multiguild.rules`를 게시한 뒤 중앙관리자 화면에서 테스트 길드 1개를 완전 삭제하여 최종 확인합니다. 실제 운영용 `879 · 도살장`은 삭제 테스트 대상으로 사용하지 않습니다.
