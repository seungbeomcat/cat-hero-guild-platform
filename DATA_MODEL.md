# V4.0.6 Firestore Data Model

## guilds/{guildId}
- name: string
- server: string
- active: boolean
- memberCount: number
- appVersion: string
- accessHash: string — 길드 전용주소 secret의 SHA-256. secret 원문은 저장하지 않음.
- accessUpdatedAt: timestamp (주소 설정 후)
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
- usedAt (사용 후)

## guildAccess/{accessHash}
문서 ID 자체가 `SHA-256(secret)` hex 값입니다.
- guildId: string
- active: true
- createdAt: timestamp

원문 secret 및 완성된 공유 URL은 Firestore에 저장하지 않습니다.

## guilds/{guildId}/data/roster
- members: object
- aliases: object
- updatedAt

## guilds/{guildId}/data/rewards
- records: array
- updatedAt

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
