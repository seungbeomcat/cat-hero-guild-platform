# Cat Hero Guild Platform V4.0 — Full Port RC3 구조

## 1. 절대 원칙
- V3.0 보존 기준본은 수정하지 않는다.
- V4는 V3의 검증된 3개 운영 화면/기능/자산을 복사하여 멀티길드 데이터 계층만 교체한 별도 플랫폼이다.
- V4 초기 데이터에는 기존 단일길드의 길드명, 서버번호, 길드원 닉네임, 격추 수치, 완료기록을 넣지 않는다.
- 새 길드는 빈 roster에서 시작한다.

## 2. 플랫폼과 길드 분리
### 플랫폼 루트 `index.html`
중앙관리자 기능만 담당한다.
- 길드 생성
- 길드 활성/비활성
- 16자리 난수 `guildId` 발급
- 길드 전용 URL 제공
- 최초/추가 관리자용 1회성 등록코드 발급
- 길드 운영 데이터(길드원/격추/보스/OPS/보상/audit)는 중앙관리 화면에 노출하지 않는다.

### 길드 전용 진입
- 주소: `?g={guildId}`
- 일반 길드원: 로그인 없이 활성 길드의 운영 화면 조회
- 길드 관리자: Firebase Authentication + `guilds/{guildId}/admins/{uid}` 확인 후 자기 길드 데이터만 입력/수정
- 다른 길드의 쓰기는 Firestore Rules가 차단한다.

## 3. 세 운영 화면 — V3 Full Port
- `main.html`: 격전지 계산기, 서버격추, 길드원 관리, 기본격추/최소점수/일반지역/상층 격추, 1인·2인 비교, 보상, 관리자 기록
- `boss.html`: 상층 2구역 보스 시간, 참여/처치 등록, 지난주/월간, 주간 보상
- `ops.html`: 균열·은하 회차, 초대형 보스, 참여/자원, 회차 종료, 지난회차/순위/보상

기능 엔진과 UI는 V3 기준을 보존하고 데이터 소스만 현재 `guildId`로 바뀐다.

## 4. Firestore 데이터 모델
```
guilds/{guildId}
  name
  server
  active
  memberCount        # roster에서 자동 계산
  appVersion

  data/roster
    members: {
      "닉네임": {
        base,
        minScore,
        z1r, z2r, z3r,
        field: { wolf, pirate, cat, food, galaxy }
      }
    }
    aliases: { "이전닉네임": "현재닉네임" }

  data/rewards
  data/journal
  bossTimers/{docId}
  bossHistory/{docId}
  ops/active
  rounds/{roundId}
  admins/{uid}
  audit/{auditId}

guildInvites/{inviteId}
```

## 5. 길드원 관리 원칙
- 길드원 수는 고정하지 않는다.
- 길드 관리자가 길드원을 추가/삭제/닉네임 변경한다.
- 길드 관리자가 기본격추, 최소점수, 늑대/해적/고양이/음식/은하, 상층 1/2/3구역 수치를 관리한다.
- `memberCount`는 roster의 실제 길드원 수에서 자동 갱신한다.
- 닉네임 변경 시 alias를 유지하여 현재/과거 기록 연결을 돕는다.
- 연속 닉네임 변경도 alias chain을 따라 현재 닉네임으로 정규화한다.
- 완료된 보스/회차 기록은 당시 스냅샷을 보존하며 현재 roster 변경으로 소급 수정하지 않는다.

## 6. 길드 간 데이터 분리
- 모든 운영 Firestore 경로는 `guilds/{guildId}/...` 하위다.
- 브라우저 캐시는 `cat-hero-v4:{guildId}:...` 네임스페이스를 사용한다.
- A길드 관리자는 A의 관리자 문서로만 쓰기 권한을 얻으며 B길드 쓰기는 거부된다.
- 일반 공개 조회는 전달받은 무작위 길드 URL을 사용하는 현재 제품 원칙을 유지한다. URL이 외부로 전달되면 읽을 수 있으므로 URL 자체를 계정 기반 비밀권한으로 보지는 않는다.

## 7. V3와의 격리
- V4에는 기존 V3 Firebase 프로젝트 문자열/운영 컬렉션 경로를 사용하지 않는다.
- V4는 `cat-hero-guild-platform`만 사용한다.
- V3 localStorage 키를 사용하지 않는다. V4 캐시는 guildId별 키만 사용한다.
- V3 원본 파일은 이 빌드에서 수정하지 않는다.

## 8. 현재 단계
RC3는 GitHub 실배포 전 후보본이다. 정적/로컬 스모크 검증 후에도 실제 Firebase A/B 길드 권한, 최초 관리자 등록, iPhone Safari를 GitHub Pages에서 확인한 뒤 Final로 승격한다.
