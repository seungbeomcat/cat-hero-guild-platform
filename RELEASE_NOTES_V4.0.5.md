# V4.0.5 인증 유지 긴급 수정

- 상층 2구역 등 iframe 화면에서 Firebase Auth persistence를 다시 설정하지 않도록 변경. 로그인 저장소 설정은 최상위 index-module.mjs만 담당합니다.
- 페이지 전환 시 최상위 관리자의 권한 상태를 재확인하고 하위 화면에 다시 전달합니다.
- 동일 UID에 대한 Firestore 조회의 일시적인 오류는 마지막으로 검증된 관리자 표시를 유지합니다. 실제 쓰기는 Firestore 규칙이 계속 보호합니다.
- 명시적 로그아웃 처리 외에 signOut 호출을 추가하지 않았습니다.
- 실제 iOS Safari/Firebase 연동 테스트는 별도 필요합니다.
