# Markdown Image Smart Paste - 사용 가이드

## 설치

### 1. 의존성 설치

---
$ cd markdown-image-smart-paste
$ pnpm install
---

### 2. 빌드

---
$ pnpm run compile
---

또는 watch 모드로 실행:

---
$ pnpm run watch
---

## 개발 및 테스트

### 확장 디버깅

1. VS Code에서 `markdown-image-smart-paste` 폴더 열기
2. `F5` 키를 눌러 Extension Development Host 실행
3. 새 창에서 마크다운 파일 열기
4. 이미지를 클립보드에 복사
5. 다음 중 하나의 방법으로 이미지 업로드:
   - **스마트 붙여넣기 (권장)**: 키바인딩 설정 후 마크다운 파일에서 `cmd+v` 누르기
   - **수동 명령**: Command Palette (`Cmd+Shift+P`)에서 `Paste Image to S3` 실행

### 테스트 실행

---
$ pnpm test
---

## 설정

VS Code 설정에서 다음 항목들을 구성하세요:

### 필수 설정

- `markdownImageSmartPaste.bucket`: S3 버킷 이름 (필수)

### 선택 설정

- `markdownImageSmartPaste.region`: AWS 리전 (기본값: `ap-northeast-2`)
- `markdownImageSmartPaste.prefix`: S3 키 접두사 템플릿 (기본값: `images/${yyyy}/${MM}`)
- `markdownImageSmartPaste.publicBaseUrl`: CDN/정적 호스팅 도메인
- `markdownImageSmartPaste.useAclPublicRead`: ACL을 public-read로 설정 (기본값: `false`)
- `markdownImageSmartPaste.altFrom`: alt 텍스트 생성 방식 (`filename`, `timestamp`, `none`)
- `markdownImageSmartPaste.linkMode`: 링크 모드 (`url`, `key`, `name`)
- `markdownImageSmartPaste.enableOnPaste`: 붙여넣기 자동 업로드 활성화 (기본값: `true`)
- `markdownImageSmartPaste.logging`: 로깅 레벨 (`error`, `info`, `debug`)

### 설정 예시 (settings.json)

---
{
  "markdownImageSmartPaste.bucket": "my-image-bucket",
  "markdownImageSmartPaste.region": "ap-northeast-2",
  "markdownImageSmartPaste.prefix": "blog/images/${yyyy}/${MM}",
  "markdownImageSmartPaste.publicBaseUrl": "https://cdn.example.com",
  "markdownImageSmartPaste.useAclPublicRead": true,
  "markdownImageSmartPaste.altFrom": "filename",
  "markdownImageSmartPaste.linkMode": "url",
  "markdownImageSmartPaste.enableOnPaste": true,
  "markdownImageSmartPaste.logging": "info"
}
---

## AWS 자격증명

확장은 다음 우선순위로 AWS 자격증명을 찾습니다:

1. `~/.aws/credentials` 파일
2. 환경변수: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`

### AWS 자격증명 설정 예시

---
$ aws configure
AWS Access Key ID [None]: YOUR_ACCESS_KEY
AWS Secret Access Key [None]: YOUR_SECRET_KEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
---

## 키바인딩 설정

### 스마트 붙여넣기 (권장)

마크다운 파일에서 `cmd+v`를 눌렀을 때, 클립보드가 텍스트인지 이미지인지 자동으로 감지하여 처리합니다:
- **텍스트**: 일반 붙여넣기 실행
- **이미지**: S3 업로드 후 마크다운 삽입

#### 설정 방법

`keybindings-example.json` 파일을 참고하여 VS Code의 `keybindings.json`에 다음을 추가하세요:

---
[
  {
    "key": "cmd+v",
    "command": "markdownImageSmartPaste.smartPaste",
    "when": "editorTextFocus && editorLangId == markdown"
  }
]
---

또는 VS Code의 Keyboard Shortcuts (`Cmd+K Cmd+S`)에서 `markdownImageSmartPaste.smartPaste` 명령을 검색하고 `cmd+v`로 바인딩하세요.

### 명령 목록

- `markdownImageSmartPaste.pasteImage`: 수동 이미지 업로드 (커맨드 팔레트)
- `markdownImageSmartPaste.smartPaste`: 스마트 붙여넣기 (텍스트/이미지 자동 감지, 권장)
- `markdownImageSmartPaste.toggleOnPaste`: 자동 업로드 on/off 토글

### 권장 키바인딩

마크다운 파일에서 `Cmd+V`를 재정의하여 스마트 붙여넣기:

---
{
  "key": "cmd+v",
  "command": "markdownImageSmartPaste.smartPaste",
  "when": "editorTextFocus && editorLangId == markdown"
}
---

이 키바인딩은 클립보드 내용을 자동으로 감지합니다:
- **텍스트가 클립보드에 있으면**: 일반 붙여넣기
- **이미지가 클립보드에 있으면**: S3 업로드 후 마크다운 링크 삽입
- **이미지 업로드 실패 시**: 일반 붙여넣기로 폴백

## 사용 방법

### 방법 1: 스마트 붙여넣기 (권장)

1. 마크다운 파일 열기
2. `smartPaste` 명령에 키바인딩 설정 (예: `Cmd+V`)
3. 이미지를 클립보드에 복사 (스크린샷, 파일 복사 등)
4. 키바인딩 입력
5. 클립보드가 이미지면 자동으로 S3 업로드 후 마크다운 링크 삽입
6. 클립보드가 텍스트면 일반 붙여넣기

### 방법 2: 수동 업로드

1. 마크다운 파일 열기
2. 이미지를 클립보드에 복사
3. Command Palette (`Cmd+Shift+P`)에서 `Paste Image to S3` 실행
4. 업로드 진행 상태 확인
5. 완료되면 커서 위치에 마크다운 이미지 링크 자동 삽입

## 패키징 및 배포

### VSIX 파일 생성

---
$ pnpm install -g @vscode/vsce
$ vsce package
---

생성된 `.vsix` 파일을 VS Code에서 설치:

1. Command Palette (`Cmd+Shift+P`)
2. `Extensions: Install from VSIX...` 선택
3. 생성된 `.vsix` 파일 선택

## 문제 해결

### 업로드 실패

- AWS 자격증명이 올바르게 설정되었는지 확인
- S3 버킷 이름이 정확한지 확인
- IAM 권한에 `s3:PutObject` 권한이 있는지 확인
- Output 채널 (`Markdown Image Smart Paste`)에서 에러 로그 확인

### 클립보드 이미지 감지 안됨

- 이미지 파일을 직접 복사했는지 확인 (브라우저 이미지는 지원하지 않을 수 있음)
- 지원되는 이미지 형식: JPG, PNG, GIF, WebP, HEIC, SVG

### 상태바 아이콘이 경고 표시

- 필수 설정(`markdownImageSmartPaste.bucket`)이 설정되었는지 확인
- 상태바 아이콘에 마우스를 올려 에러 메시지 확인


