# V4.1.12 검증

Build date: 2026-10-16

## PASS — 기준 및 비반영 범위
- V4.1.11 full ZIP을 직접 베이스로 사용
- V3 운영 코드 재활성화 없음
- 미완성 은하 격전지 개편안 미반영
- Firestore Rules V4.1.11과 바이트 동일
- OPS/BOSS는 버전 표기 외 기능 로직 변경 없음

## PASS — 행운 룰렛 결과 UX
- 최종 결과 제목과 상태가 가장 먼저 보이는 새 결과 구조 적용
- 회차 결과 카드는 동일 높이 계열과 큰 글자 사용
- 전체 참여 명단 항상 표시 및 당첨자 강조 유지
- 시작/완료 시각, 추첨 ID는 한 개의 검증 정보 영역으로 재배치
- 추첨 완료 후 sticky 헤더 높이를 보정해 결과 섹션 최상단으로 자동 이동
- 최초/재추첨 판별은 기존과 동일하게 브라우저 세션 기준
- 결과 자체는 Firestore/audit에 저장하지 않음

## PASS — 룰렛 단톡방 결과 이미지
- 1080×1350 PNG 유지
- 길드명/행운 룰렛 결과 대형 타이틀 유지
- 최초 추첨/재추첨 상태 우측 상단 표시
- 회차별 결과와 전체 참여 명단을 크게 표시
- 시작/완료 시각을 27px 계열, 추첨 ID를 21px 계열로 확대
- 공유 payload는 `files`만 포함하며 title/text를 전달하지 않음

## PASS — 길드 보상 분배 입력
- 수량 입력에 `inputmode=numeric` 유지/추가
- 모바일 수량 입력 폰트 16px 강제 적용
- reward-entry 및 관리자 reward editor 모두 iOS 자동 확대 방지 규칙 적용
- 사용자 수동 확대 기능은 차단하지 않음

## PASS — 반응형/다기기 원칙
- 320px 이하 초소형 화면 별도 규칙 적용
- Chromium 합성 viewport 320 / 375 / 430 / 768px에서 룰렛 결과 화면 가로 overflow 0 확인
- 330/350/390/700/820px 구간에서 결과/입력 레이아웃 보강
- 고정 가로폭 대신 `minmax`, `clamp`, `auto-fit` 사용
- safe-area 및 viewport-fit 기존 구조 유지
- 텍스트 자동 확대 보정은 100%로 통일

## 정적 검사
- 외부/module JS `node --check` PASS
- HTML inline script 구문 검사 PASS
- 로컬 src/href 참조 검사 PASS
- 신규 보상 5종 catalog→asset 참조 확인
- Firestore Rules 동일성 검사 PASS
- OPS/BOSS version-only diff 검사 PASS
- BUILD_MANIFEST SHA-256 재생성 PASS
- 최종 ZIP CRC 검사 PASS
