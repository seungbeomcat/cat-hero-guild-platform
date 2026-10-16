# V4.1.6 Firestore Data Model

## guilds/{guildId}
- name: string
- server: string
- active: boolean
- memberCount: number
- appVersion: string
- accessHash: string — 길드 전용주소 secret의 SHA-256. secret 원문은 저장하지 않음.
- accessUpdatedAt: timestamp
- createdAt / updatedAt: timestamp

## guilds/{guildId}/admins/{uid}
- role: `admin`
- active: boolean
- inviteId: string
- createdAt: timestamp

## guildInvites/{inviteId}
- guildId
- used
- createdAt
- expiresAtMs
- issuerRole: `platform` | `guild-admin`
- usedAt

## guildAccess/{accessHash}
문서 ID 자체가 `SHA-256(secret)` hex 값입니다.
- guildId: string
- active: true
- createdAt: timestamp

## guilds/{guildId}/data/roster
- members: object
- aliases: object
- updatedAt

## guilds/{guildId}/data/rewards
- records: array
- updatedAt

## guilds/{guildId}/data/opsResourceDefaults
회차와 독립된 길드원 OPS 시작 자원 기본값입니다.
- schemaVersion: 1
- members.{nickname}.initialSeconds: number — 1200~1320초
- updatedAtClient: ISO string
- updatedAtServer: timestamp

현재 회차가 없어도 관리자 저장이 가능하며, 새 균열·은하 회차의 길드원별 시작 시간 기본값으로 사용합니다.

## guilds/{guildId}/data/journal
수동 일지/관리 기록 보조 데이터.

## guilds/{guildId}/bossTimers/*
해당 길드의 보스 팝업/다음 등장시간 자료.

## guilds/{guildId}/bossHistory/*
해당 길드의 보스 처치 및 참여 기록.

## guilds/{guildId}/ops/*
현재 균열·은하 운영 상태.

## guilds/{guildId}/rounds/*
진행/완료 회차 및 결과 스냅샷.

## guilds/{guildId}/audit/*
- kind: 동적 활동 유형
- name: 대상
- text: 요약/세부내용
- uid: 실행 관리자 UID
- at: timestamp

## platformAudit/{auditId}
중앙관리자 수준의 위험 작업 완료 이력입니다.


## V4.1.6 행운 룰렛
- `roulette.html`은 현재 길드 roster를 읽기만 하는 공용 미니게임입니다.
- 관리자 인증 및 Firestore 쓰기/활동기록 저장을 사용하지 않습니다.
- 통합 라우터의 `roulette` 경로로 진입하며 은하 OPS 데이터 구조와 분리됩니다.
