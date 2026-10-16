# V4.1.11 검증

Build date: 2026-10-16

## PASS — 기준/비반영 범위
- V4.1.10 full ZIP을 직접 베이스로 사용
- V3 운영 코드 재활성화 없음
- 미완성 은하 격전지 개편안 미반영
- Firestore Rules V4.1.10과 바이트 동일
- OPS/BOSS는 버전 표기 외 기능 소스 변경 없음

## PASS — 계산 결과 `이미지 바로 공유`
- 버튼 텍스트 `이미지 바로 공유` 확인
- 두 버튼은 독립 카드형이며 중앙 간격/좌우 여백 유지
- 버튼 높이 44px, 3px 보라색 테두리 적용
- Web Share API 호출 payload가 `files`만 포함하도록 변경
- 계산 결과 행 수에 따라 PNG 높이를 동적으로 산정
- 불필요한 하단 빈 공간 최소화
- `이탈 기준` 열을 표 렌더 완료 후 6px 파란 외곽선으로 재강조

## PASS — 룰렛 단톡방 결과 이미지
- 1080×1350 PNG 유지
- 길드명/결과 제목 동일 48px 계열 적용
- 최초/재추첨 배지 우측 상단 배치
- 요약 3분할 동일 높이
- 회차 결과 카드 동일 높이 규칙 적용
- 전체 참여자 명단 항상 포함, 당첨자 금색 강조
- 참여자 칩 동일 높이, 하단 메타 3칸 동일 높이

## PASS — 신규 보상 5종
- `검은 보석`
- `스타 펀치 장갑`
- `스타 펀치 모자`
- `스타 펀치 목도리`
- `스타 펀치 신발`
- 보상 catalog에 5개 이름 모두 포함
- 각 catalog 항목이 로컬 WebP 자산에 연결됨
- 자산 5개 모두 512×512, 로컬 파일 존재 확인

## 정적 검사
- 외부 JS / module JS `node --check` PASS
- HTML inline script 구문 검사 PASS
- 로컬 src/href 존재 검사 PASS
- reward catalog→asset 참조 검사 PASS
- Firestore Rules 동일성 검사 PASS
- OPS/BOSS version-only diff 검사 PASS
- BUILD_MANIFEST SHA-256 재생성 PASS
- 최종 ZIP CRC 검사 PASS

실기기에서는 iPhone Safari/카카오 인앱브라우저의 파일 전용 공유 동작과 카카오톡 축소 미리보기 가독성을 마지막으로 확인하면 됩니다.
