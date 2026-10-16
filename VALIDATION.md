# V4.1.13 검증

Build date: 2026-10-16

## PASS — 기준 및 비반영 범위
- V4.1.12 full ZIP을 직접 베이스로 사용
- V3 운영 코드 재활성화 없음
- 미완성 은하 격전지 개편안 미반영
- Firestore Rules V4.1.12와 바이트 동일
- OPS/BOSS/계산기는 버전 표기·cache-buster 외 기능 로직 변경 없음

## PASS — 행운 룰렛 결과 UX
- 결과 제목 `추첨 결과` 적용 및 기존보다 작은 반응형 폰트 적용
- 결과 구조 순서 `시간/세션 → 전체 참여 명단 → 당첨 결과 → 액션 버튼` 확인
- `추첨 ID`, `현재 브라우저 세션에서...`, `추첨 시작 당시 포함된 길드원` 표시 제거
- 회차 번호(`1차/2차/3차`) 결과 카드에서 제거
- 결과 카드 `품목 / 당첨 길드원` 2줄 중앙 정렬, 동일 폰트 크기 확인
- 결과 카드 2열 배치 및 1개 결과 시 전체 폭 처리
- `이미지 공유` / `재추첨` 동일 폭·동일 높이 확인
- `재추첨` 시 현재 참여자/품목 구성을 유지하고 attempt가 증가하는 흐름 확인
- 추첨 완료 후 결과 패널 상단 자동 스크롤 로직 유지

## PASS — 이미지 공유
- 별도 `단톡방 결과 이미지` 미리보기/모달 제거
- 고해상도 PNG 직접 생성 후 Web Share 파일 공유 사용
- 공유 payload에 `files`만 전달하고 `title`/`text` 미전달
- 파일 공유 미지원 환경은 PNG 저장으로 fallback
- 공유 이미지 정보 순서도 `시간/세션 → 전체 참여 명단 → 당첨 결과` 적용
- 공유 이미지에 추첨 ID/장문 설명/액션 버튼/푸터 미포함
- 합성 실행에서 PNG 생성·다운로드 PASS (1080×동적 높이)

## PASS — 반응형/다기기 원칙
- Chromium 합성 viewport 320 / 375 / 430 / 768px에서 가로 overflow 없음
- 동일 viewport에서 액션 버튼 가로폭/높이 동일 확인
- 320px에서 참여자 2열, 361px 이상에서 3열, 700px 이상에서 4열로 가독성 유지
- 결과 카드 2열 유지, `clamp`/`minmax` 기반 폰트·레이아웃 적용
- safe-area 및 viewport-fit 기존 구조 유지
- 모바일 입력 16px 자동 확대 방지 규칙 유지

## 정적 검사
- roulette inline JS `node --check` PASS
- 모든 JS/MJS `node --check` PASS
- HTML ID 참조 누락 검사 PASS
- 로컬 src/href 참조 검사 PASS
- 신규 보상 5종 catalog→asset 참조 유지 확인
- Firestore Rules 동일성 검사 PASS
- OPS/BOSS/MAIN version-only diff 검사 PASS
- BUILD_MANIFEST SHA-256 재생성 PASS
- ZIP CRC 검사 PASS

## 실제 기기 확인 권장
- 물리 iPhone/Android의 시스템 공유 시트 및 카카오톡 앱 전달은 브라우저/OS 버전에 따라 UI가 달라질 수 있으므로 배포 후 최종 체감 확인 권장.
