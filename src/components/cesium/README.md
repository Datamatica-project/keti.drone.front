# Cesium 컴포넌트

Cesium.js를 사용한 3D 지구본 뷰어 컴포넌트입니다.

## 사용 방법

```tsx
import CesiumViewer from "@/components/cesium/CesiumViewer";

export default function MyPage() {
  return (
    <div className="w-full h-screen">
      <CesiumViewer
        initialView={{
          longitude: 127.5, // 경도
          latitude: 37.5,   // 위도
          height: 10000000, // 높이 (미터)
        }}
      />
    </div>
  );
}
```

## 설정

1. `.env.local` 파일에 Cesium Ion 토큰을 추가하세요:
   ```
   NEXT_PUBLIC_CESIUM_ION_TOKEN=your_token_here
   ```

2. Cesium Ion 토큰은 https://cesium.com/ion/ 에서 무료로 발급받을 수 있습니다.

## 주의사항

- Cesium은 클라이언트 컴포넌트에서만 동작합니다.
- 번들 크기가 크므로 필요시 동적 import를 사용하세요.