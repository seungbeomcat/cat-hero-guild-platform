# Cat Hero Guild Platform V4.0.9

Build date: 2026-10-15

## Fixed
- 길드원 삭제가 성공 메시지 후에도 Firestore roster에 남던 문제 수정.
- 원인: `members` 중첩 map을 `set(..., { merge:true })`로 저장하여, 새 map에서 빠진 닉네임 키가 서버에 보존될 수 있었음.
- 길드원 저장/닉네임 변경도 동일 원인으로 이전 닉네임이 남을 수 있어 함께 수정.
- roster의 `members`와 `aliases` map을 batch `update`로 통째로 교체하도록 변경.
- 길드원 삭제 시 해당 닉네임을 가리키는 alias도 함께 정리.

## Unchanged
- V4.0.8 길드원 편집 UI 및 반응형 디자인 유지.
- 관리자 인증/로그인 유지, 길드 전용 주소, 보스/보상/균열·은하 기능 유지.
- Firestore Rules 변경 없음.
