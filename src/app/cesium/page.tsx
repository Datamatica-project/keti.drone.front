import CesiumViewer from "@/components/cesium/CesiumViewer";

export const metadata = {
  title: "Cesium 3D 지도",
  description: "Cesium.js를 사용한 3D 지구본 뷰어",
};

/**
 * Cesium 3D 지도 페이지
 * /cesium 경로로 접근 가능합니다.
 */
export default function CesiumPage() {
  const flightPath = [
    { "longitude": 127.5000, "latitude": 37.5000, "height": 50 },
    { "longitude": 127.5005, "latitude": 37.5005, "height": 55 },
    { "longitude": 127.5010, "latitude": 37.5010, "height": 60 },
    { "longitude": 127.5016, "latitude": 37.5014, "height": 65 },
    { "longitude": 127.5022, "latitude": 37.5017, "height": 70 },
    { "longitude": 127.5028, "latitude": 37.5019, "height": 75 },
    { "longitude": 127.5034, "latitude": 37.5020, "height": 80 },
    { "longitude": 127.5040, "latitude": 37.5020, "height": 85 },
    { "longitude": 127.5045, "latitude": 37.5018, "height": 90 },
    { "longitude": 127.5050, "latitude": 37.5015, "height": 95 },
    { "longitude": 127.5055, "latitude": 37.5012, "height": 100 },
    { "longitude": 127.5060, "latitude": 37.5008, "height": 105 },
    { "longitude": 127.5065, "latitude": 37.5004, "height": 110 },
    { "longitude": 127.5070, "latitude": 37.5000, "height": 115 },
    { "longitude": 127.5075, "latitude": 37.4996, "height": 120 },
    { "longitude": 127.5080, "latitude": 37.4992, "height": 125 },
    { "longitude": 127.5085, "latitude": 37.4988, "height": 130 },
    { "longitude": 127.5090, "latitude": 37.4984, "height": 135 },
  ]
  return (
    <div className="w-full h-screen">
      <CesiumViewer
        initialView={{
          longitude: 127.5, // 서울
          latitude: 37.5,
          height: 300,
        }}
        flightPath={flightPath}
        pathColor="#00ff00"
        pathWidth={3}
        animate={true}        // 애니메이션 활성화
        flightDuration={20}   // 20초 동안 비행
      />
    </div>
  );
}