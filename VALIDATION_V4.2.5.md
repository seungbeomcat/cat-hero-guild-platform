# V4.2.5 기능 검증 (2026-10-16)

## 실행 결과
- `shared/admin-audit.js` JavaScript 문법 검사 (`node --check`) 통과.
- Playwright Chromium 가상 관리자/가상 Firestore 데이터 테스트 통과.
  - 관리자 2명 및 활동기록 9개 렌더링.
  - 개별 행의 작은 `삭제` 버튼 9개 표시.
  - 일괄삭제 모드에서 9개 체크박스 표시.
  - 전체 선택/전체 해제, 1건 선택, 건수에 따른 삭제 버튼 활성화.
  - 일괄 삭제 1건 실행 시 해당 길드 Firestore 경로 `guilds/gid123/audit/a2` 지정.
  - 개별 삭제 1건 실행 시 해당 길드 Firestore 경로 `guilds/gid123/audit/a1` 지정.
  - 삭제 후 활동 기록 목록 다시 렌더링.
  - 모바일 390px, 320px 관리자 창 외곽 넘침 없음.
- ZIP 자체 압축 검증 (`unzip -t`) 통과.

## 반드시 배포 환경에서 확인할 항목
- 위 테스트는 **모의 Firestore 기반 UI 테스트**이므로 실제 Firebase Rules의 권한 허용 여부를 검증하지 못합니다.
- 신규 `firestore.multiguild.rules`를 Firebase 콘솔에 게시해야 활성 길드 관리자의 삭제가 가능합니다.
- 실제 운영 기록 대신 **새 시험 기록**을 생성해 개별 삭제 → 일괄삭제 순서로 확인하세요.
- Firebase Rules의 `platformAudit` 변경 없음, 다른 길드 데이터 삭제 권한 부여하지 않음.
- 브라우저/Firestore 삭제 성공 후에도 별도의 백업 데이터까지 자동 삭제되지는 않습니다.
