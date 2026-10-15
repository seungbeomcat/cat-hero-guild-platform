# Cat Hero Guild Platform V4.1.1 Architecture

## 분리 원칙
- V3.0 계열은 도살장 전용 기준본이며 수정하지 않습니다.
- V4.x 계열은 별도 멀티길드 플랫폼입니다.
- 하나의 앱 코드를 여러 길드가 사용하되 Firestore 경로는 `guildId`로 분리합니다.

## 화면 구조
- `index.html` / `index-module.mjs`: 최상위 shell, Firebase Auth, 관리자 인증, 길드 주소 해석, main/boss/ops iframe 라우팅.
- `main.html`: 격전지 계산기, 길드원 조회/관리, 보상 조회/관리, 관리자 관리.
- `boss.html`: 상층 2구역 보스 시간/처치/기록.
- `ops.html`: 균열·은하 회차/초대형/참여/결과.

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
