# Notion Whisper — 프로젝트 기획서 (최종)

> 노션이 보내는 읽지 않은 메시지 — 데스크톱에 조용히 떠있어요
> React + TypeScript + Electron · Notion API 연동

---

## 1. 컨셉

Notion DB에서 오늘의 할일과 습관을 가져와서, 데스크톱 배경 위에 **iMessage 수신 말풍선** 형태로 표시하는 앱.

- 노션이 나에게 "문자를 보낸" 느낌 — 왼쪽 정렬 회색 말풍선
- 미완료 항목 = **읽지 않은 메시지**로 표시
- 할일 완료 시 말풍선이 사라지며 "읽음" 처리
- 안 읽은 메시지가 쌓이는 은근한 압박감으로 생산성 유도

---

## 2. UI 명세

### 전체 레이아웃

Electron 투명 윈도우가 데스크톱 배경 위에 항상 떠있는 형태. 클릭 관통(click-through)으로 다른 작업 방해 없음.

```
데스크톱 배경
┌──────────────────────────────────────────────┐
│                                              │
│  읽지 않음 · 4개                               │
│  ┌─────────────────────┐                     │
│  │ 비행기 예약하기 ✈️    │                     │
│  └─────────────────────┘                     │
│  ┌─────────────────────┐                     │
│  │ 물 마시기 💧         │                     │
│  └─────────────────────┘                     │
│  ┌─────────────────────┐                     │
│  │ API 문서 정리        │                     │
│  └─────────────────────┘                     │
│  ┌─────────────────────┐                     │
│  │ 운동 30분 🏃         │                     │
│  └─────────────────────┘                     │
│                                              │
│              ┌─── macOS Dock ───┐            │
└──────────────────────────────────────────────┘
```

### 말풍선 스타일

| 속성 | 값 |
|------|------|
| 정렬 | **왼쪽** (수신 메시지) |
| 배경색 | `#E9E9EB` → `#E1E1E4` (미세 그라디언트) |
| 텍스트 색상 | `#000000` |
| 폰트 | SF Pro Text, 16px, weight 400 |
| letter-spacing | -0.2px |
| padding | 10px 14px |
| max-width | 280px |
| border-radius | 첫 번째: `18px 18px 18px 4px` |
| | 이어지는 것: `4px 18px 18px 4px` |
| box-shadow | `0 1px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` |
| 말풍선 간 간격 | 3px (iMessage 그룹 메시지처럼 밀착) |

### 라벨

```
읽지 않음 · {미완료 개수}개
```

| 속성 | 값 |
|------|------|
| 폰트 | SF Pro Text, 12px, weight 500 |
| 색상 | `rgba(255,255,255,0.55)` |
| text-shadow | `0 1px 4px rgba(0,0,0,0.4)` (배경 위 가독성) |
| 위치 | 말풍선 그룹 바로 위, 6px 여백 |

### 프로필 아이콘

없음 — 말풍선만 표시

### 위치

기본값: **좌하단** (Dock 위, 화면 왼쪽)
설정에서 변경 가능: 좌상단, 좌하단, 중앙

### 특수 상태

| 상태 | 표시 |
|------|------|
| 모두 완료 | 라벨: "다 읽음 ✨", 말풍선 없음 (또는 축하 메시지 1개) |
| 데이터 없음 | 라벨: "새 메시지 없음", 말풍선 없음 |
| API 에러 | 라벨: "연결 끊김 🔌", 회색 말풍선 "노션 연결을 확인해주세요" |
| 로딩 중 | 말풍선 영역에 iMessage 타이핑 인디케이터 (···) 애니메이션 |

---

## 3. 노션 DB 구조

### 할일 (To-do) 데이터베이스

사용자의 기존 노션 To-do DB를 연동. 다음 프로퍼티를 매핑:

| 프로퍼티 | 타입 | 용도 | 필수 |
|---------|------|------|------|
| Name / 이름 | Title | 말풍선 텍스트로 표시 | ✅ |
| Status / 상태 | Checkbox 또는 Status | 완료 여부 (읽음/읽지 않음) | ✅ |
| Date / 날짜 | Date | 오늘 마감인 항목 필터링 | ⬜ |
| Priority / 우선순위 | Select | 말풍선 정렬 순서 | ⬜ |

### 습관 (Habit) 데이터베이스

| 프로퍼티 | 타입 | 용도 | 필수 |
|---------|------|------|------|
| Name / 이름 | Title | 말풍선 텍스트 | ✅ |
| Emoji / 이모지 | Rich Text 또는 Title prefix | 텍스트 뒤에 이모지 표시 | ⬜ |
| 오늘 날짜 (동적) | Checkbox / Formula | 오늘 완료 여부 | ✅ |

### Notion API 쿼리 예시

```json
{
  "filter": {
    "and": [
      {
        "property": "Date",
        "date": { "equals": "2026-02-24" }
      },
      {
        "property": "Status",
        "checkbox": { "equals": false }
      }
    ]
  },
  "sorts": [
    { "property": "Priority", "direction": "ascending" }
  ]
}
```

### API 응답 파싱

```json
{
  "results": [
    {
      "id": "page-id",
      "properties": {
        "Name": {
          "title": [{ "plain_text": "비행기 예약하기 ✈️" }]
        },
        "Status": {
          "checkbox": false
        },
        "Date": {
          "date": { "start": "2026-02-24" }
        }
      }
    }
  ]
}
```

---

## 4. 아키텍처

### 기술 스택

| 구분 | 기술 |
|------|------|
| 언어 | TypeScript |
| 프론트엔드 | React 18+ |
| 데스크톱 | Electron |
| 빌드 도구 | Vite + electron-builder |
| 스타일링 | CSS-in-JS 또는 Tailwind |
| 네트워크 | fetch (Notion API) |
| 보안 저장 | electron-keytar (Keychain) |
| 타겟 | macOS 12.0+ |
| API | Notion API v2022-06-28 |

### 프로젝트 구조

```
notion-whisper/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml
│
├── electron/                         # Electron 메인 프로세스
│   ├── main.ts                        # 앱 진입점, 윈도우 생성
│   ├── tray.ts                        # 메뉴바 트레이 아이콘
│   ├── ipc.ts                         # IPC 핸들러 (API 호출 등)
│   └── store.ts                       # electron-store (설정 저장)
│
├── src/                              # React 렌더러 프로세스
│   ├── main.tsx                       # React 진입점
│   ├── App.tsx                        # 라우팅 (위젯 뷰 / 설정 뷰)
│   │
│   ├── components/
│   │   ├── widget/
│   │   │   ├── MessageBubble.tsx      # 개별 말풍선 컴포넌트
│   │   │   ├── UnreadLabel.tsx        # "읽지 않음 · N개" 라벨
│   │   │   ├── BubbleGroup.tsx        # 말풍선 그룹 (리스트)
│   │   │   ├── TypingIndicator.tsx    # 로딩 중 ··· 애니메이션
│   │   │   └── EmptyState.tsx         # 빈 상태 / 완료 상태
│   │   │
│   │   └── settings/
│   │       ├── SettingsPanel.tsx       # 설정 패널 메인
│   │       ├── NotionConnect.tsx       # 노션 연결 (토큰 입력)
│   │       ├── DatabaseSelect.tsx     # DB 선택
│   │       ├── PropertyMapping.tsx    # 프로퍼티 매핑
│   │       └── PositionSelect.tsx     # 위젯 위치 설정
│   │
│   ├── hooks/
│   │   ├── useNotionData.ts           # 노션 데이터 fetch + polling
│   │   ├── useWidgetPosition.ts       # 위젯 위치 관리
│   │   └── useSettings.ts            # 설정 읽기/쓰기
│   │
│   ├── services/
│   │   ├── notionApi.ts               # Notion API 클라이언트
│   │   └── notionParser.ts            # API 응답 → 앱 데이터 변환
│   │
│   ├── types/
│   │   ├── notion.ts                  # Notion API 타입 정의
│   │   └── widget.ts                  # 위젯 관련 타입
│   │
│   └── styles/
│       └── global.css
│
└── resources/                        # 앱 아이콘, 트레이 아이콘
    ├── icon.icns
    └── trayTemplate.png
```

### 핵심 컴포넌트 상세

#### A. Electron 메인 프로세스 (`electron/main.ts`)

```typescript
// 투명 윈도우 생성 — 핵심 설정
const widgetWindow = new BrowserWindow({
  transparent: true,          // 배경 투명
  frame: false,               // 프레임 없음
  alwaysOnTop: false,         // 다른 창 아래로 갈 수 있음
  skipTaskbar: true,           // Dock에 표시 안 함
  hasShadow: false,            // 시스템 그림자 제거
  focusable: false,            // 포커스 안 받음 (클릭 관통)
  type: 'desktop',             // 데스크톱 레벨 (배경 바로 위)
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
  }
});

// macOS 전용: 데스크톱 레벨 설정
widgetWindow.setVisibleOnAllWorkspaces(true, {
  visibleOnFullScreen: false
});

// 클릭 관통 설정
widgetWindow.setIgnoreMouseEvents(true, { forward: true });
```

#### B. Notion API 클라이언트 (`src/services/notionApi.ts`)

```typescript
interface NotionApiClient {
  // DB 목록 조회 (설정 시 사용)
  searchDatabases(): Promise<NotionDatabase[]>;

  // 할일 가져오기 (미완료만)
  fetchTodos(databaseId: string): Promise<NotionItem[]>;

  // 습관 가져오기 (오늘자 미완료만)
  fetchHabits(databaseId: string): Promise<NotionItem[]>;

  // 통합 조회 (할일 + 습관 합쳐서 정렬)
  fetchAllItems(): Promise<NotionItem[]>;
}

// API 호출은 Electron 메인 프로세스에서 수행 (CORS 회피)
// 렌더러 → IPC → 메인 → Notion API → 메인 → IPC → 렌더러
```

#### C. 데이터 폴링 (`src/hooks/useNotionData.ts`)

```typescript
function useNotionData(intervalMs: number = 60000) {
  const [items, setItems] = useState<NotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        // IPC로 메인 프로세스에 데이터 요청
        const data = await window.electronAPI.fetchNotionItems();
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return { items, loading, error, unreadCount: items.length };
}
```

#### D. 말풍선 컴포넌트 (`src/components/widget/MessageBubble.tsx`)

```typescript
interface MessageBubbleProps {
  text: string;
  isFirst: boolean;  // 그룹 내 첫 번째 여부 (모서리 결정)
}

// 스타일 요약:
// - 배경: #E9E9EB → #E1E1E4 그라디언트
// - 텍스트: #000, 16px, SF Pro Text
// - border-radius: 첫번째 18/18/18/4, 나머지 4/18/18/4
// - max-width: 280px
// - 등장 애니메이션: translateY(12px) scale(0.92) → normal
```

---

## 5. Electron 윈도우 구조

앱은 2개의 윈도우로 구성:

### 위젯 윈도우 (항상 표시)
- 투명, 프레임 없음, 데스크톱 레벨
- 클릭 관통 (마우스 이벤트 무시)
- 말풍선 UI만 렌더링
- 전체 화면 크기이지만 투명 배경이라 말풍선만 보임

### 설정 윈도우 (트레이에서 열기)
- 일반 윈도우 (macOS 네이티브 프레임)
- 트레이 아이콘 클릭 시 표시
- 노션 연결, DB 선택, 위치 설정 등
- 설정 변경 시 위젯 윈도우에 IPC로 전달

### 트레이 아이콘
- macOS 메뉴바에 작은 아이콘 (💬 또는 커스텀)
- 클릭 시 메뉴: 설정 열기, 새로고침, 위젯 숨기기/보이기, 종료
- 미완료 항목 수를 뱃지로 표시 가능

---

## 6. 메인 앱 (설정) 화면

### 6-1. 온보딩 (최초 1회)
1. "Notion Whisper에 오신 것을 환영합니다" 인트로
2. Notion Integration Token 입력 안내 + 입력 필드
3. 연결된 DB 목록에서 할일 DB / 습관 DB 선택
4. 프로퍼티 매핑 (어떤 프로퍼티가 제목/상태/날짜인지)
5. 완료 → 위젯 자동 표시

### 6-2. 설정 화면
- Notion 연결 상태 (연결됨 ✅ / 끊김 ❌)
- 할일 DB 변경
- 습관 DB 변경
- 프로퍼티 매핑 변경
- 위젯 위치 (좌하단 / 좌상단 / 중앙)
- 갱신 주기 (30초 / 1분 / 5분 / 15분)
- 위젯 보이기/숨기기
- 시작 시 자동 실행
- 연결 해제

---

## 7. 데이터 흐름

```
┌──────────┐     IPC      ┌──────────────┐    HTTPS    ┌───────────┐
│ 렌더러    │ ──────────→ │ 메인 프로세스   │ ─────────→ │ Notion API │
│ (React)  │ ←────────── │ (Electron)    │ ←───────── │           │
└──────────┘             └──────────────┘            └───────────┘
     │                        │
     │ 위젯 UI 업데이트         │ Keychain (토큰 저장)
     │ 말풍선 표시/제거          │ electron-store (설정)
     ▼                        ▼
┌──────────┐            ┌──────────────┐
│ 위젯 윈도우 │            │ 설정 윈도우    │
│ (투명)     │            │ (일반)        │
└──────────┘            └──────────────┘
```

### 폴링 전략
1. 설정된 주기(기본 1분)마다 Notion API 호출
2. 이전 데이터와 비교 → 변경분만 UI 업데이트
3. 새 항목 추가 시: 말풍선 등장 애니메이션
4. 항목 완료 시: 말풍선 퇴장 애니메이션 후 제거
5. API 에러 시: 마지막 성공 데이터 유지 + 에러 표시

---

## 8. 애니메이션

### 말풍선 등장
```css
/* 초기 상태 */
opacity: 0;
transform: translateY(12px) scale(0.92);

/* 최종 상태 */
opacity: 1;
transform: translateY(0) scale(1);

/* 트랜지션 */
transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
/* 각 말풍선마다 0.08s 딜레이 추가 (순차 등장) */
```

### 말풍선 퇴장 (완료 시)
```css
opacity: 0;
transform: translateX(-20px) scale(0.9);
transition: all 0.3s ease-out;
/* 퇴장 완료 후 DOM에서 제거 */
```

### 타이핑 인디케이터 (로딩 중)
- iMessage의 "···" 타이핑 버블 애니메이션
- 회색 말풍선 안에 3개의 점이 순차적으로 바운스

---

## 9. 개발 순서 (Claude Code 작업 플로우)

### Phase 1: 프로젝트 셋업
- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Electron 통합 (electron-vite 또는 수동 설정)
- [ ] 프로젝트 구조 생성 (위 구조 참고)
- [ ] 기본 빌드 + 실행 확인

### Phase 2: 위젯 UI 구현
- [ ] MessageBubble 컴포넌트 (iMessage 회색 말풍선)
- [ ] UnreadLabel 컴포넌트
- [ ] BubbleGroup 컴포넌트 (말풍선 리스트)
- [ ] 등장/퇴장 애니메이션
- [ ] TypingIndicator (로딩 상태)
- [ ] EmptyState (빈 상태/완료 상태)
- [ ] 목데이터로 UI 테스트

### Phase 3: Electron 투명 윈도우
- [ ] 투명 + 프레임리스 윈도우 생성
- [ ] 데스크톱 레벨 설정 (배경 바로 위)
- [ ] 클릭 관통 설정
- [ ] 트레이 아이콘 + 메뉴
- [ ] 위젯 위치 설정 (좌하단/좌상단/중앙)
- [ ] 멀티 워크스페이스 지원

### Phase 4: Notion API 연동
- [ ] notionApi.ts — API 클라이언트 구현
- [ ] notionParser.ts — 응답 파싱
- [ ] IPC 통신 (렌더러 ↔ 메인)
- [ ] useNotionData 훅 (폴링 + 상태 관리)
- [ ] electron-keytar로 토큰 안전 저장
- [ ] 에러 핸들링

### Phase 5: 설정 화면
- [ ] 온보딩 플로우
- [ ] Notion 토큰 입력 + DB 선택
- [ ] 프로퍼티 매핑 UI
- [ ] 위젯 위치/갱신 주기 설정
- [ ] electron-store로 설정 영속화

### Phase 6: 마무리
- [ ] 앱 아이콘 + 트레이 아이콘
- [ ] electron-builder 패키징 (macOS .dmg)
- [ ] 시작 시 자동 실행 설정
- [ ] 엣지 케이스 테스트
- [ ] README.md 작성

---

## 10. Notion Integration 생성 가이드 (사용자 안내용)

1. https://www.notion.so/my-integrations 접속
2. "New integration" 클릭
3. 이름: "Notion Whisper", Type: "Internal"
4. Capabilities: "Read content" 만 체크 (읽기 전용)
5. 생성 후 "Internal Integration Secret" 복사
6. 연결할 DB에서 ··· → "Connections" → "Notion Whisper" 추가

---

## 11. 디자인 토큰 (React/CSS 변환용)

```typescript
export const tokens = {
  // 말풍선
  bubble: {
    bg: 'linear-gradient(180deg, #E9E9EB 0%, #E1E1E4 100%)',
    textColor: '#000000',
    fontSize: '16px',
    fontWeight: 400,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
    letterSpacing: '-0.2px',
    lineHeight: 1.4,
    padding: '10px 14px',
    maxWidth: '280px',
    gap: '3px',                              // 말풍선 간 간격
    radiusFirst: '18px 18px 18px 4px',       // 첫 번째 말풍선
    radiusContinue: '4px 18px 18px 4px',     // 이어지는 말풍선
    shadow: '0 1px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  },

  // 라벨
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    marginBottom: '6px',
  },

  // 애니메이션
  animation: {
    enter: {
      duration: '0.45s',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      staggerDelay: '0.08s',
    },
    exit: {
      duration: '0.3s',
      easing: 'ease-out',
    },
  },
} as const;
```

---

## 12. 참고 파일

- **UI 프로토타입**: `notion-whisper-v4.jsx` — React 프로토타입 (iMessage 수신 말풍선 스타일)
- **이전 버전**: `notion-whisper-spec.md` (Swift/WidgetKit 버전, 더 이상 사용 안 함)

---

*이 문서를 Claude Code에 전달하면 바로 개발을 시작할 수 있습니다.*
*"이 기획서 읽고 Phase 1부터 순서대로 개발해줘" 로 시작하세요.*
