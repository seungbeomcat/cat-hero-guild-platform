# Cat Hero Guild Platform V4.2.6

- V4.2.4 전체본 기반, 관리자 활동 기록 개별 삭제·일괄삭제 추가.
- GitHub에 ZIP 내부 폴더의 **내용 전체**를 배포합니다.
- **필수:** Firestore Rules도 `firestore.multiguild.rules` 기준으로 업데이트해야 길드 관리자의 삭제가 동작합니다.
- 변경 내역: `RELEASE_NOTES_V4.2.6.md`.

---

# Cat Hero Guild Platform V4.2.4

- V4.2.3 전체본을 기반으로, 보상 선택과 당첨 결과 및 공유 이미지 개선.
- GitHub에는 ZIP 내부 최상위 폴더 내용 전체를 기존 리포지토리 루트에 업로드하세요.
- Firebase 설정, Rules, 기존 운영용 페이지/길드 데이터는 유지합니다.
- 자세한 변경 내용: `RELEASE_NOTES_V4.2.4.md`.
- 보상 아이콘 추가: `assets/roulette-rewards/`에 PNG 파일을 두고 `shared/roulette-reward-catalog.js`에 항목을 등록합니다.
- 이전 릴리스 기록은 기존 `RELEASE_NOTES_V4.2.3.md` 등에 보존했습니다.

---

# Cat Hero Guild Platform V4.2.3

Build date: 2026-10-16
Baseline: V4.2.2 complete archive (assets/shared and Firestore Rules preserved)

### What changed after V4.2.2
- 결과 제목 아래 1줄만 표기하고, 시간 카드의 이중 구분선처럼 보이는 외곽 테두리 제거
- 당첨 카드 아래에 두 번째 구분선 1줄, `이미지 공유 | 재추첨` 버튼 위 배치
- 시작·완료 시각 박스 높이를 축소하고 텍스트 중앙 정렬 유지
- 전체 참여 명단 및 당첨 결과 카드의 불필요한 세로 크기 축소
- 참여 명단 자동 배열: 1 중앙, 2 중앙, 3 가로, 4명 2×2, 5명 3+2, 6명 3×2, 7명 이상 3열 단위 마지막 행 가운데 정렬
- 명단 칩은 인원에 따라 콘텐츠 폭 중심으로 축소, 글씨 확대, 긴 닉네임은 가능한 범위에서 축소 또는 줄바꿈
- 당첨 결과 카드: 기존 밝은 퍼플/핑크/블루 그라데이션 및 골드 외곽선 폐기; 밝은 연녹색 단색 바탕·검정 글씨·차분한 녹색 테두리
- 결과 카드 너비 약 35% 중심, 1개 중앙, 2개 중앙 2열, 3개 이상 2열 + 마지막 한 개 중앙
- `이미지 공유`, `재추첨` 동등한 크기/간격, 남색 바탕 + 하늘색 3px 외곽선 유지
- 실제 카카오톡 공유용 PNG도 같은 배열/색상/폰트 크기와 컴팩트한 박스로 그리며, 버튼/푸터/캡션 제외

### Unchanged
- V3 운영 퇴역, 은하 미완성 개편안 미반영
- Firestore Rules 및 shared/, assets/ 데이터 자산 미변경
- 길드 보상 5종, 길드전 카테고리, 계산기/룰렛 경로 및 관련 기능 유지
