# Markdown Image Smart Paste - 개발 가이드

## 프로젝트 구조

---
markdown-image-smart-paste/
├── .vscode/
│   ├── launch.json          # 디버그 설정
│   ├── settings.json        # 워크스페이스 설정
│   └── tasks.json           # 빌드 태스크
├── src/
│   ├── extension.ts         # 확장 진입점
│   ├── config.ts            # 설정 로딩 및 검증
│   ├── namePolicy.ts        # 파일명/경로 생성 규칙
│   ├── uploader.ts          # S3 업로드 구현
│   ├── pasteInterceptor.ts  # 붙여넣기 이벤트 처리
│   └── test/
│       ├── runTest.ts       # 테스트 러너
│       └── suite/
│           ├── index.ts     # 테스트 스위트 로더
│           └── extension.test.ts  # 단위 테스트
├── dist/                    # 빌드 출력 (번들)
├── out/                     # 테스트 컴파일 출력
├── package.json             # 확장 메타데이터
├── tsconfig.json            # TypeScript 설정
├── esbuild.js               # 번들러 스크립트
├── .vscodeignore            # 패키징 제외 파일
├── .gitignore
├── README.md                # 설계 문서
├── USAGE.md                 # 사용자 가이드
└── keybindings-example.json # 키바인딩 예시
---

## 시작하기

### 1. 의존성 설치

---
$ pnpm install
---

### 2. 개발 모드 실행

Watch 모드로 TypeScript 컴파일:

---
$ pnpm run watch
---

### 3. 디버깅

1. VS Code에서 `F5` 키 누르기
2. Extension Development Host 창이 열림
3. 새 창에서 마크다운 파일 열고 테스트

## 주요 모듈 설명

### config.ts

VS Code 설정을 읽고 검증합니다.

- `getConfig()`: 현재 설정 값 읽기
- `validateConfig()`: 필수 설정 검증

### namePolicy.ts

S3 키 생성 규칙을 구현합니다.

- `generateNames()`: 타임스탬프 기반 파일명 및 S3 키 생성
- `getMimeType()`: 파일 확장자에서 MIME 타입 추출
- 템플릿 변수 지원: `${yyyy}`, `${MM}`, `${dd}`

### uploader.ts

AWS SDK v3를 사용하여 S3에 파일을 업로드합니다.

- `S3Uploader` 클래스
- `upload()`: 파일을 S3에 업로드하고 URL 생성
- 자격증명은 AWS SDK의 기본 credential chain 사용

### pasteInterceptor.ts

클립보드 이미지 처리 및 마크다운 삽입 로직을 구현합니다.

- `handlePaste()`: 붙여넣기 이벤트 핸들러
- `checkIfImageInClipboard()`: 클립보드에 이미지가 있는지 감지 (플랫폼별)
- 클립보드에서 이미지 파일 읽기 (macOS, Linux, Windows 지원)
- 업로드 진행 상태 표시
- 마크다운 스니펫 생성 및 삽입

### extension.ts

VS Code 확장의 진입점입니다.

- `activate()`: 확장 활성화 시 호출
- 명령 등록: `pasteImage`, `toggleOnPaste`, `smartPaste`
- 상태바 아이템 관리
- Output 채널 생성
- `handleSmartPaste()`: 스마트 붙여넣기 로직 (텍스트/이미지 자동 감지)

## 빌드

### 개발 빌드

---
$ pnpm run compile
---

### 프로덕션 빌드 (최적화)

---
$ pnpm run package
---

### Watch 모드

---
$ pnpm run watch
---

## 테스트

### 테스트 실행

---
$ pnpm test
---

### 테스트 컴파일만

---
$ pnpm run compile-tests
---

### 테스트 작성

`src/test/suite/` 디렉토리에 `*.test.ts` 파일을 추가하세요.

## 패키징 & 배포

### 1. 사전 준비

#### Visual Studio Code Marketplace 계정 생성

1. [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage) 접속
2. Azure DevOps 계정으로 로그인 (Microsoft 계정)
3. Publisher 생성 (한 번만 필요)
   - Publisher 이름은 영문 소문자로 구성 (예: `epikem`)

#### Personal Access Token (PAT) 생성

1. [Azure DevOps](https://dev.azure.com/) 접속
2. User Settings > Personal Access Tokens
3. "New Token" 클릭
4. 설정:
   - Name: `VSCode Extension Publish`
   - Organization: `All accessible organizations`
   - Scopes: `Full access` 또는 `Custom defined > Marketplace (Manage)`
5. 토큰 생성 후 **반드시 복사 저장** (다시 볼 수 없음)

### 2. VSIX 패키지 생성

#### 패키징 도구 설치

---
$ pnpm install -g @vscode/vsce
또는
$ npm install -g @vscode/vsce
---

#### VSIX 파일 생성

---
$ vsce package
---

이 명령은 다음을 수행합니다:
- `vscode:prepublish` 스크립트 자동 실행 (production 빌드)
- `.vscodeignore` 파일에 지정된 파일 제외
- `markdown-image-smart-paste-0.0.1.vsix` 파일 생성

### 3. 로컬 테스트

생성된 VSIX 파일을 로컬에 설치하여 테스트:

---
$ code --install-extension markdown-image-smart-paste-0.0.1.vsix
---

### 4. Marketplace에 게시

#### 로그인

---
$ vsce login epikem
---

프롬프트가 나오면 아까 생성한 Personal Access Token을 입력합니다.

#### 게시

**수동 버전 업데이트 (권장):**

`package.json`의 `version` 필드를 업데이트:
```json
"version": "0.0.2"
```

그리고 다시 패키징:

---
$ vsce package
$ vsce publish
---

**자동 버전 업데이트:**

---
$ vsce publish patch   # 0.0.1 -> 0.0.2
$ vsce publish minor   # 0.0.1 -> 0.1.0
$ vsce publish major   # 0.0.1 -> 1.0.0
---

이 명령들은 자동으로 `package.json`의 버전을 업데이트하고 패키징/게시까지 수행합니다.

### 5. 게시 확인

- [Marketplace 페이지](https://marketplace.visualstudio.com/)에서 검색
- 일반적으로 몇 분 안에 검색 가능
- 업데이트는 5-10분 내 반영

### 6. 배포 체크리스트

배포 전 확인사항:

- [ ] `package.json`의 `version` 업데이트
- [ ] `README.md` 최신 내용 반영
- [ ] 주요 기능 테스트 완료
- [ ] `.vscodeignore` 파일 확인 (불필요한 파일 제외)
- [ ] 브라우저에서 읽을 수 있는 README.md 작성

### 트러블슈팅

#### "publisher not found" 오류

Publisher 이름이 `package.json`의 `publisher` 필드와 일치하는지 확인

#### "Personal Access Token expired"

Azure DevOps에서 새로운 토큰 생성 후 `vsce login` 다시 실행

#### 패키지 크기 제한

VS Code 확장은 10MB 제한이 있습니다. 필요없는 의존성은 `.vscodeignore`에 추가:

---
# Exclude large test files
src/test/**
out/**
*.vsix
---

## 디버깅 팁

### Output 채널 확인

View > Output > "S3 Image Uploader" 선택하여 로그 확인

### 로깅 레벨 설정

settings.json에서 로깅 레벨 조정:

---
{
  "markdownImageSmartPaste.logging": "debug"
}
---

### 브레이크포인트 사용

1. 소스 코드에 브레이크포인트 설정
2. `F5`로 디버깅 시작
3. Extension Development Host에서 명령 실행
4. 브레이크포인트에서 정지하여 변수 검사

## 코드 스타일

- TypeScript strict mode 사용
- 2 spaces 들여쓰기
- ESModule import/export 사용
- async/await 사용

## 주의사항

### 클립보드 API

VS Code의 클립보드 API는 텍스트만 지원합니다 (`readText()`, `writeText()`).
이미지 데이터를 읽으려면 플랫폼별 시스템 명령을 사용합니다:

- **macOS**: `osascript`를 사용하여 AppleScript로 클립보드 이미지 추출
- **Linux**: `xclip` 명령어 사용 (설치 필요)
- **Windows**: PowerShell을 사용하여 클립보드 이미지 저장

클립보드에 이미지가 없으면 기본 붙여넣기 동작을 유지합니다.

### AWS SDK

- AWS SDK v3 사용 (모듈화된 패키지)
- `@aws-sdk/client-s3`만 의존성에 포함
- 자격증명은 환경변수 또는 credentials 파일에서 자동 로딩

### 번들링

- esbuild 사용으로 빠른 빌드
- `vscode` 모듈은 external로 처리
- production 빌드 시 minify 적용

## 문제 해결

### TypeScript 에러

---
$ pnpm run compile
---

명령으로 컴파일 에러 확인

### 테스트 실패

---
$ pnpm run compile-tests
---

먼저 컴파일 에러 확인

### Extension 로딩 실패

`package.json`의 `activationEvents`와 `main` 경로 확인

## 기여

1. 이슈 생성하여 기능/버그 논의
2. 브랜치 생성 및 코드 작성
3. 테스트 추가
4. Pull Request 생성

