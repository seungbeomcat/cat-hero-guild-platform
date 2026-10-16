# Source baseline

- 기준 원본: Cat Hero Guild Platform V4.1.8 full (V4.1.5 lineage)
- 산출물: V4.1.9
- 변경: 룰렛 포인터 방향 수정, 결과 신뢰 정보 UI 재설계, 전체 참여 명단 표시, 단톡방 결과 이미지 가독성/참여명단 개선
- V4.1.8의 4×4 직접 참여자 선택, 세션 최초/재추첨 판별, 길드 보상 분배 `길드전` 카테고리 유지
- 룰렛 결과 저장: Firestore/audit 저장 없음
- 세션 표시용 저장: 결과가 아닌 구성 해시별 회차 숫자만 sessionStorage에 임시 저장
- 은하 격전지 미완성 개편안: 미반영
- Firestore Rules: 변경 없음
- V3: 퇴역 상태 유지
