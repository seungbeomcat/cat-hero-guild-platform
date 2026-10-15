# Cat Hero Guild Platform V4.0.0 Full Port RC3

V3.0 보존 기준본의 3개 운영 화면과 자산을 기반으로, 길드 고정 데이터만 제거하고 Firebase 데이터 계층을 `guildId` 단위로 분리한 V4 멀티길드 후보본입니다.

## 핵심
- 새 길드는 길드원 0명으로 시작합니다.
- 기존 단일길드의 길드명/서버/닉네임/격추/완료기록을 초기값으로 포함하지 않습니다.
- 길드 관리자가 자기 길드명·서버·길드원·격추 수치를 관리합니다.
- 메인/상층 2구역/균열·은하 OPS가 같은 현재 roster를 사용합니다.
- 운영 데이터와 브라우저 캐시는 guildId별로 분리합니다.
- V3 원본은 수정하지 않습니다.

## 포함 화면
- `index.html` — 플랫폼 진입/중앙관리/길드 라우터
- `main.html` — V3 메인 계산기/길드원/보상/관리자 Full Port
- `boss.html` — V3 상층 2구역 Full Port
- `ops.html` — V3 균열·은하 OPS Full Port

## 현재 상태
Firestore Rules는 현재 `cat-hero-guild-platform`에 게시한 규칙과 동일한 파일을 포함합니다. RC3는 GitHub Pages 첫 실배포 후보이며, 실제 A/B 길드 권한 및 iPhone Safari 검증 전에는 Final로 간주하지 않습니다.

자세한 내용은 `ARCHITECTURE.md`, `DATA_MODEL.md`, `VALIDATION.md`를 확인하세요.
