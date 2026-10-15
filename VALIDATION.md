# V4.1.0 검증 상태

Build date: 2026-10-15

## PASS — 정적/구조 검증
- 외부 JavaScript/MJS 및 HTML inline script 구문 검사: 오류 0건.
- 명시적 로컬 `src`/`href` 파일 참조: 누락 0건. (템플릿 문자열 동적 참조 제외)
- V4.0.9 길드원 삭제/닉네임 변경 수정 코드(`members`/`aliases` 전체 map update): 그대로 유지 확인.
- `firestore.multiguild.rules`, `shared/*.js`, 전체 `assets/`는 V4.0.9와 바이트 동일 확인.
- 메인/보스/OPS/진입 페이지 및 firebase-config의 V4.1.0 표기/캐시 키 갱신 확인.

## PASS — 상단 헤더 디자인 검증
- 좌측 `서버 | 길드명 | 인원수`의 기존 저투명도 해제 및 우측 제목과 동일 계열의 밝은 라벤더 적용.
- 좌측/우측 모두 `v410HeaderShimmer` 애니메이션 적용 확인.
- 렌더링 엔진에서 background-position이 시간 경과에 따라 `175% → 음수 영역`으로 실제 이동하는 것 확인.
- `prefers-reduced-motion: reduce`에서는 애니메이션이 `none`이고 정적 `#f0e8ff` 텍스트로 복귀 확인.
- 320 / 360 / 375 / 390 / 430 / 560px 폭에서 좌우 상단 텍스트 겹침·가로 overflow 없음 확인.

## PASS — 패키지 검증
- BUILD_MANIFEST SHA-256/bytes 재생성 및 재검증.
- ZIP CRC 무결성 검사 통과.

## Live validation
- 실제 GitHub Pages 캐시 반영 및 iPhone/Android 실기기 애니메이션 체감은 배포 후 최종 확인이 필요합니다.
