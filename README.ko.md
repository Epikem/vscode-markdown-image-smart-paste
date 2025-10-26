# VS Code Extension: Markdown Image Smart Paste

스마트 붙여넣기 확장: 마크다운 파일에서 `cmd+v`로 텍스트/이미지를 자동 감지하여 이미지를 S3에 업로드하고 마크다운 스니펫을 삽입합니다.

> ⚠️ **주의사항**  
> 이 프로젝트는 바이브코딩으로 작성되었습니다. 사용에 주의하시기 바라며, **어떠한 보증도 제공하지 않습니다** (NO WARRANTY).  
> macOS 환경에서만 테스트되었습니다.

## 빠른 시작

---
# 의존성 설치
$ pnpm install

# 개발 모드 실행
$ pnpm run watch

# VS Code에서 F5를 눌러 디버깅 시작
---

📖 자세한 내용:
- 사용자 가이드: `USAGE.md`
- 개발 가이드: `DEVELOPMENT.md`

---

## 주요 기능

- ✅ **스마트 감지**: 텍스트/이미지 자동 구분
- ✅ **원클릭**: cmd+v로 업로드 및 삽입 완료
- ✅ **S3 업로드**: 규칙 기반 파일명/경로 생성 (예: `images/YYYY/MM/YYYYMMDDHHMMSS.ext`)
- ✅ **퍼블릭 URL**: S3 업로드 후 마크다운 이미지 스니펫 자동 삽입
- ✅ **폴백 처리**: 실패 시 자동으로 기본 붙여넣기
- ✅ **크로스 플랫폼**: macOS, Linux, Windows 지원

### 동작 흐름
1. 마크다운 파일에서 붙여넣기(Cmd+V) 수행
2. 클립보드 내용 분석 (파일 경로 / file:// URL / 이미지 데이터 여부 판단)
3. 업로드 규칙에 따라 파일명/경로 생성
4. AWS S3로 업로드 → 퍼블릭 URL 확보
5. `![ALT](URL)` 형식으로 에디터에 삽입

## 아키텍처 개요
- VS Code 확장(Typescript)
  - `extension.ts`: 활성화/비활성화, 이벤트 구독, 명령 등록
  - `PasteInterceptor`: 붙여넣기 이벤트 가로채기, 이미지 감지
  - `Uploader`: S3 업로더(aws-sdk v3 or AWS CLI 연동)
  - `NamePolicy`: 파일명/경로 규칙 생성
  - `Config`: 설정 로딩/검증

## 설정 (Settings)
- `markdownImageSmartPaste.bucket` (string, required): S3 버킷명
- `markdownImageSmartPaste.region` (string, optional): 기본값 `ap-northeast-2`
- `markdownImageSmartPaste.prefix` (string, optional): 기본 `images/${yyyy}/${MM}`
- `markdownImageSmartPaste.publicBaseUrl` (string, optional): CDN/정적 호스팅 도메인
- `markdownImageSmartPaste.useAclPublicRead` (boolean, optional): 기본 false
- `markdownImageSmartPaste.altFrom` (enum: filename|timestamp|none, optional): 기본 filename
- `markdownImageSmartPaste.linkMode` (enum: url|key|name, optional): 기본 url
- `markdownImageSmartPaste.enableOnPaste` (boolean): 붙여넣기 자동 동작 on/off
- `markdownImageSmartPaste.logging` (enum: error|info|debug, optional): 기본 info

## 동작 규칙
- 붙여넣기 시 컨텍스트가 마크다운/마크다운 호환 에디터일 때만 작동
- 클립보드가 이미지 파일 경로 또는 이미지 바이너리인 경우만 가로채서 동작
- 업로드 성공 시 삽입, 실패 시 원래 붙여넣기 동작으로 폴백
- 파일명: `YYYYMMDDHHMMSS.ext` (충돌 가능성 낮음)
- 경로: `${prefix}/YYYY/MM/` (월 단위 그룹)

## 보안/인증
- 우선순위
  1) `~/.aws/credentials`
  2) 환경변수 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`

## 명령/키바인딩
- 명령
  - `markdownImageSmartPaste.pasteImage`: 강제 이미지 붙여넣기(커맨드 팔레트)
  - `markdownImageSmartPaste.smartPaste`: 스마트 붙여넣기 (텍스트/이미지 자동 감지, cmd+v 기본 바인딩)
  - `markdownImageSmartPaste.toggleOnPaste`: 자동 동작 on/off 토글
- 키바인딩 설정 (keybindings.json에 추가)
---
{
  "key": "cmd+v",
  "command": "markdownImageSmartPaste.smartPaste",
  "when": "editorTextFocus && editorLangId == markdown"
}
---

`keybindings-example.json` 파일을 참조하여 사용자 환경에 맞게 설정하세요.

## 실패/폴백 전략
- 이미지가 아니면: 기본 붙여넣기 통과
- 업로드 실패: 사용자에게 에러 토스트, 기본 붙여넣기 통과
- URL 생성 실패: `key` 기반 링크 모드로 대체 시도

## 스니펫 템플릿
- 템플릿 문자열 지원: `![${alt}](${link})`
- 변수
  - `${url}`, `${key}`, `${name}`, `${alt}`, `${timestamp}`

## 파일명/경로 규칙
- alt 추출 우선순위: 파일명(확장자 제외) → 타임스탬프 → 빈 문자열
- 확장자 매핑: mime → jpg|png|gif|webp|heic|svg
- 충돌 방지: 타임스탬프 + 선택적 난수 3~4자리 옵션

## 퍼포먼스/UX
- 상태바에 업로드 진행 표시(스피너)
- 완료 후 상태바에 클릭 가능한 URL 표시
- 사용자 취소 동작 제공(ESC)

## 로그/진단
- `markdownImageSmartPaste.logging` (error|info|debug)
- 출력: VS Code Output 채널 `Markdown Image Smart Paste`

## 개발/실행
- 의존성 설치
---
$ npm i
$ npm run watch
---

- 실행/디버그: VS Code `F5` (Extension Development Host)

## 운영 팁
- 사내 프록시 환경에서는 SDK 설정에 프록시 적용 필요

## 면책 조항

이 소프트웨어는 "있는 그대로" 제공되며, 명시적이든 묵시적이든 어떠한 종류의 보증도 제공하지 않습니다. 바이브코딩으로 작성되었으므로 프로덕션 환경에서 사용 시 충분한 테스트를 권장합니다.
