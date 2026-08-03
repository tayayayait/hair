# 아이디헤어 신규 고객 설문 프로토타입

`상세서.md`의 전체 시스템 가운데 지원·발표 시연에 필요한 핵심 사용자 흐름을 구현한 웹 프로토타입입니다.

- 관리자 로그인 → 매장·디자이너 선택 → 고객 설문 링크 발급
- 개인정보 동의 → 기본 정보 → 방문·상담 정보 → 모발·두피 정보 → 검토 → 제출
- 관리자 대시보드 → 응답 검색 → 개인정보 마스킹 상세 확인

범위, 합성 데모 데이터, 발표 순서, 원격 활성화 절차는 [PROTOTYPE.md](./PROTOTYPE.md)를 따릅니다. 프로토타입에는 실제 고객 개인정보를 입력하지 마세요.

## 로컬 실행

Node.js와 npm이 필요합니다.

```sh
npm install
npm run dev
```

환경 변수는 `.env.example`을 참고해 설정합니다.

```text
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## 품질 검사

```sh
npm run check
```

위 명령은 ESLint, TypeScript 타입 검사, Vitest, 프로덕션 빌드를 순서대로 실행합니다.

## 주요 경로

| 경로               | 역할                                      |
| ------------------ | ----------------------------------------- |
| `/`                | 프로토타입 안내                           |
| `/login`           | 데모 관리자 로그인                        |
| `/admin/kiosk`     | 매장·디자이너 선택 및 고객 설문 링크 발급 |
| `/s/:session`      | 고객 설문 시작                            |
| `/admin/dashboard` | 제출 현황과 요약 차트                     |
| `/admin/responses` | 응답 검색·필터·상세 조회                  |

## 배포 전 확인

배포 전에 Supabase 마이그레이션과 데모 관리자 계정이 같은 대상 프로젝트에 활성화되어 있어야 합니다. 자세한 순서는 [PROTOTYPE.md](./PROTOTYPE.md)의 원격 활성화 절차를 확인하세요.
