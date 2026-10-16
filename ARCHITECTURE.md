# Cat Hero Guild Platform V4.1.11 Architecture

## 분리 원칙
- V3.0 계열은 도살장 전용 기준본이며 수정하지 않습니다.
- V4.x 계열은 별도 멀티길드 플랫폼입니다.
- 하나의 앱 코드를 여러 길드가 사용하되 Firestore 경로는 `guildId`로 분리합니다.

## 화면 구조
- `index.html` / `index-module.mjs`: 최상위 shell, Firebase Auth, 관리자 인증, 길드 주소 해석, main/boss/ops/roulette iframe 라우팅.
- `main.html`: 격전지 계산기, 길드원 조회/관리, 보상 조회/관리, 관리자 관리.
- `boss.html`: 상층 2구역 보스 시간/처치/기록.
- `ops.html`: 균열·은하 회차/초대형/참여/결과.
- `roulette.html`: 일반 길드원 포함 공용 행운 룰렛. Firestore 쓰기/추첨 기록 저장 없음.

## 관리자 인증
- Firebase Auth 세션은 최상위 shell이 로컬 영속성으로 초기화합니다.
- 동일 브라우저에서 명시적 로그아웃 전까지 인증 상태를 유지하는 것이 원칙입니다.
- child 페이지는 별도의 로그인 화면을 열지 않고 부모 shell의 권한 상태를 사용합니다.
- 일반 관리 동작은 관리자 인증창을 호출하지 않고 권한 없음 안내만 표시합니다.
- 관리자 등록/로그인 시작점은 메인 `관리자` 메뉴 하나입니다.

## 관리자 등록
- 최초 관리자: 중앙관리자가 발급한 1회성 코드 사용.
- 추가 관리자: 기존 길드관리자가 발급한 1회성 코드 사용.
- 등록 성공 시 `guilds/{guildId}/admins/{uid}`가 생성됩니다.
- 코드 없이 스스로 관리자 권한을 만들 수 없습니다.

## 길드 전용주소
1. 중앙관리자는 길드와 최초 관리자 설정용 임시 링크를 생성합니다.
2. 최초 관리자가 등록 후 자기 브라우저에서 공유용 비밀키를 생성하거나 붙여넣습니다.
3. 브라우저가 비밀키를 SHA-256으로 해시합니다.
4. Firestore에는 `guildAccess/{hash}` → `guildId` 매핑과 `guilds/{guildId}.accessHash`만 저장합니다.
5. 길드원 공유 주소는 `#k=<secret>` 형태이며 secret 원문은 중앙 DB에 저장하지 않습니다.
6. 주소 변경 시 새 해시 매핑을 만들고 이전 매핑을 삭제합니다.

## 데이터 경로
- `guilds/{guildId}`: 길드 기본정보, active, memberCount, accessHash.
- `guilds/{guildId}/data/roster`: 길드원/격추/별칭.
- `guilds/{guildId}/data/rewards`: 보상분배 기록.
- `guilds/{guildId}/bossTimers/*`: 보스 시간.
- `guilds/{guildId}/bossHistory/*`: 보스 처치기록.
- `guilds/{guildId}/ops/*`: 현재 OPS.
- `guilds/{guildId}/rounds/*`: 회차/보관 기록.
- `guilds/{guildId}/admins/{uid}`: 길드 관리자.
- `guilds/{guildId}/audit/*`: 관리자 활동기록.
- `guildInvites/{code}`: 1회성 관리자 등록코드.
- `guildAccess/{sha256(secret)}`: 전용주소 검증용 매핑.
- `platformAudit/*`: 중앙관리자의 길드 완전 삭제 등 위험 작업 완료 이력.

## 일반 길드원 권한
- 계산기: 길드원 선택, 서버격추, 지역/보스 선택 및 계산 사용 가능.
- 길드원/보스/보상/OPS 결과: 조회·참고 가능.
- 행운 룰렛: 참여자·추첨 항목 설정, 자동 순차 추첨, 결과 이미지 생성/공유 가능.
- 추가/수정/삭제/회차 시작·종료 등 쓰기: 불가.

## 관리자 활동기록
활동 유형은 고정 목록이 아니라 실제 저장된 `kind`를 기반으로 자동 확장합니다. 균열·은하는 세부 조작을 모두 기록하지 않고 새 회차 시작과 이번 회차 종료 정도만 기록합니다.


## 중앙관리자 길드 완전 삭제
- 중앙관리자 화면에서만 실행합니다.
- 오삭제 방지를 위해 길드명을 직접 입력하고 최종 확인을 거칩니다.
- 현재 V4 스키마의 `data`, `bossTimers`, `bossHistory`, `ops`, `rounds`, `admins`, `audit`를 먼저 정리합니다.
- 연결된 `guildInvites` 및 현재 `guildAccess` 매핑을 정리합니다.
- 길드 기본 문서 `guilds/{guildId}`는 가장 마지막에 삭제합니다.
- 삭제 직후 같은 경로를 다시 조회하여 잔여 데이터가 없는지 확인합니다.
- 완료 이력은 `platformAudit`에 남깁니다.


## OPS persistent resource defaults
- `guilds/{guildId}/data/opsResourceDefaults` stores per-member starting time independently from active rounds.
- Draft/no-round edits never write to `rounds/{roundId}`.
- A new round copies these defaults into its member resource snapshot.


## V4.1.8 행운 룰렛
- `roulette.html`은 현재 길드 roster를 읽기만 하는 공용 미니게임입니다.
- 관리자 인증 및 Firestore 쓰기/활동기록 저장을 사용하지 않습니다.
- 통합 라우터의 `roulette` 경로로 진입하며 은하 OPS 데이터 구조와 분리됩니다.


## V4.1.8
- 룰렛 참여자는 최대 16명 4×4 직접 선택 후 확인합니다.
- 최초/재추첨 표시는 결과 저장 없이 구성 해시 회차 숫자만 sessionStorage에 임시 저장합니다.
- 보상 분배 유형에 길드전을 추가하되 전용 보상 아이템은 아직 정의하지 않습니다.


## V4.1.10 룰렛 결과 신뢰성/공유 UI
- 룰렛 포인터는 상단 고정 포인터의 꼭짓점이 원판을 향하도록 수정.
- 최종 결과 메타 정보는 최초/재추첨 상태, 시작/완료 시각, 추첨 ID를 계층형 카드로 표시.
- 최종 결과와 단톡방 결과 이미지에 추첨 시작 당시 전체 참여 명단을 표시.
- 단톡방 결과 이미지는 1080×1350 안에서 핵심 결과와 참여 명단의 가독성을 우선해 재배치.
- 결과 자체는 Firestore/활동기록에 저장하지 않으며 세션 기반 최초/재추첨 판별 방식은 유지.

## V4.1.10 계산기 → 보상 분배 룰렛
- 계산 결과의 `보상 분배 룰렛`은 현재 참여자 이름만 `sessionStorage`의 일회성 payload로 전달합니다.
- 룰렛 페이지는 payload를 읽은 즉시 삭제하고 현재 길드 roster와 이름을 재검증합니다.
- 2명 이상 유효하면 참여자 선택 단계를 완료 상태로 처리하고 추첨 항목 설정부터 시작합니다.
- 이 전달은 Firestore, audit, 결과 기록에 쓰지 않습니다.

## V4.1.10 계산 결과 이미지 공유
- 계산기 화면 DOM 자체를 저장하지 않고, 현재 핵심 결과값을 1080px 폭 Canvas PNG로 재렌더링합니다.
- 시스템이 파일 공유를 지원하면 Web Share API를 직접 호출하며, 미지원 환경은 파일 저장으로 대체합니다.
- 기존 계산식/분배 계산 로직과 공유 렌더러는 분리되어 있습니다.


## V4.1.11 공유/보상 변경
- 계산 결과 공유는 Canvas PNG를 즉시 만들고 Web Share API에는 파일만 전달합니다.
- 계산기→룰렛 전달은 V4.1.10의 one-shot sessionStorage 구조를 그대로 사용합니다.
- 신규 보상 아이콘은 `assets/rewards/*.webp` 로컬 자산으로 관리하며 `REWARD_IMAGE_MAP` catalog에 연결합니다.
- 룰렛 공유 이미지는 데이터 저장 없이 현재 결과를 Canvas에만 렌더링합니다.
