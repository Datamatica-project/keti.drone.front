"use client";

import { useEffect, useRef } from "react";
import {
  Ion,
  Viewer,
  Cartesian3,
  EasingFunction,
  PolylineCollection,
  Material,
  Color,
  Entity,
  Transforms,
  HeadingPitchRoll,
  Math as CesiumMath,
  JulianDate,
  SampledPositionProperty,
  SampledProperty,
  ClockRange,
  Quaternion,
} from "cesium";

// Cesium Ion 토큰 (필요시 환경변수로 관리)

// 드론 GPS 좌표 타입 정의
interface DroneGpsPoint {
  longitude: number; // 경도
  latitude: number;  // 위도
  height: number;    // 높이 (미터)
}

interface CesiumViewerProps {
  className?: string;
  initialView?: {
    longitude?: number;
    latitude?: number;
    height?: number;
  };
  // 드론 비행 경로 (GPS 좌표 리스트)
  flightPath?: DroneGpsPoint[];
  // 경로 선 색상 (CSS 색상 문자열)
  pathColor?: string;
  // 경로 선 두께 (픽셀)
  pathWidth?: number;
  // 애니메이션 활성화 여부
  animate?: boolean;
  // 전체 비행 시간 (초)
  flightDuration?: number;
}

export default function CesiumViewer({
  className = "",
  initialView = {
    longitude: 127.0, // 서울 기본값 (경도)
    latitude: 37.5,   // 서울 기본값 (위도)
    height: 1000000,  // 높이 (미터) - 100만 미터 = 1000km
  },
  flightPath = [],    // 드론 비행 경로
  pathColor = "#00ff00", // 기본 초록색
  pathWidth = 3,      // 기본 선 두께
  animate = false,    // 애니메이션 비활성화 기본값
  flightDuration = 30, // 기본 30초 비행
}: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const polylineCollectionRef = useRef<PolylineCollection | null>(null);
  const droneEntityRef = useRef<Entity | null>(null);

  // GPS 좌표를 Cesium 좌표로 변환
  const convertGpsToCartesian = (gpsPoints: DroneGpsPoint[]): Cartesian3[] => {
    return gpsPoints.map((point) =>
      Cartesian3.fromDegrees(point.longitude, point.latitude, point.height)
    );
  };

  // 드론 비행 경로를 3D 폴리라인으로 그리기
  const drawFlightPath = (viewer: Viewer, gpsPoints: DroneGpsPoint[]) => {
    if (gpsPoints.length < 2) return; // 최소 2개 좌표 필요

    // 기존 폴리라인 제거
    if (polylineCollectionRef.current) {
      viewer.scene.primitives.remove(polylineCollectionRef.current);
      polylineCollectionRef.current = null;
    }

    // GPS 좌표를 Cesium 좌표로 변환
    const positions = convertGpsToCartesian(gpsPoints);

    // 폴리라인 컬렉션 생성
    const polylineCollection = new PolylineCollection();

    // 폴리라인 추가 (공중에 표시 - clampToGround: false)
    polylineCollection.add({
      positions: positions,
      width: pathWidth,
      material: Material.fromType("Color", {
        color: Color.fromCssColorString(pathColor),
      }),
      id: { type: "drone-flight-path" },
    });

    // 씬에 폴리라인 추가
    viewer.scene.primitives.add(polylineCollection);
    polylineCollectionRef.current = polylineCollection;

    
  };

  // 드론 3D 모델 추가 (경로의 마지막 위치에 표시)
  const addDroneMarker = (viewer: Viewer, gpsPoint: DroneGpsPoint, heading = 0) => {
    // 기존 드론 Entity 제거
    if (droneEntityRef.current) {
      viewer.entities.remove(droneEntityRef.current);
      droneEntityRef.current = null;
    }

    const position = Cartesian3.fromDegrees(
      gpsPoint.longitude,
      gpsPoint.latitude,
      gpsPoint.height
    );

    // 드론 방향 설정 (heading: 진행 방향, pitch: 앞뒤 기울기, roll: 좌우 기울기)
    // heading 90도 보정 (모델 기본 방향이 옆을 향함) + roll 180도 보정
    const hpr = new HeadingPitchRoll(
      CesiumMath.toRadians(heading - 90), // heading 90도 보정
      0,                                   // pitch (앞뒤 기울기)
      CesiumMath.toRadians(-180)           // roll 180도 - 모델 뒤집힘 보정
    );
    const orientation = Transforms.headingPitchRollQuaternion(position, hpr);

    // 드론 3D 모델 Entity 추가
    const droneEntity = viewer.entities.add({
      name: "Drone",
      position: position,
      orientation: orientation,
      model: {
        uri: "/cesium/Assets/Glb/CesiumDrone.glb", // public 폴더 기준 경로
        minimumPixelSize: 64,    // 최소 픽셀 크기 (멀리서도 보임)
        maximumScale: 20000,     // 최대 스케일
        scale: 10,               // 모델 크기 배율 (필요시 조정)
      },
      label: {
        text: "Drone",
        font: "14px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: 1, // BOTTOM
        pixelOffset: new Cartesian3(0, -50, 0) as any,
      },
    });

    droneEntityRef.current = droneEntity;
    
  };

  // 두 점 사이의 heading(방위각) 계산
  const calculateHeading = (from: DroneGpsPoint, to: DroneGpsPoint): number => {
    const fromRad = {
      lon: CesiumMath.toRadians(from.longitude),
      lat: CesiumMath.toRadians(from.latitude),
    };
    const toRad = {
      lon: CesiumMath.toRadians(to.longitude),
      lat: CesiumMath.toRadians(to.latitude),
    };

    const dLon = toRad.lon - fromRad.lon;
    const y = Math.sin(dLon) * Math.cos(toRad.lat);
    const x = Math.cos(fromRad.lat) * Math.sin(toRad.lat) -
              Math.sin(fromRad.lat) * Math.cos(toRad.lat) * Math.cos(dLon);
    
    return Math.atan2(y, x); // 라디안
  };

  // 드론 애니메이션 (경로를 따라 이동)
  const animateDrone = (viewer: Viewer, gpsPoints: DroneGpsPoint[]) => {
    if (gpsPoints.length < 2) return;

    // 기존 드론 Entity 제거
    if (droneEntityRef.current) {
      viewer.entities.remove(droneEntityRef.current);
      droneEntityRef.current = null;
    }

    // 시작 시간 설정
    const startTime = JulianDate.now();
    const stopTime = JulianDate.addSeconds(startTime, flightDuration, new JulianDate());

    // 각 포인트 사이의 시간 간격 계산
    const timePerPoint = flightDuration / (gpsPoints.length - 1);

    // SampledPositionProperty 생성 (시간에 따른 위치)
    const positionProperty = new SampledPositionProperty();
    // SampledProperty 생성 (시간에 따른 방향) - roll 보정 포함
    const orientationProperty = new SampledProperty(Quaternion);

    gpsPoints.forEach((point, index) => {
      const time = JulianDate.addSeconds(startTime, index * timePerPoint, new JulianDate());
      const position = Cartesian3.fromDegrees(point.longitude, point.latitude, point.height);
      positionProperty.addSample(time, position);

      // 다음 포인트가 있으면 heading 계산, 없으면 이전 heading 유지
      let heading = 0;
      if (index < gpsPoints.length - 1) {
        heading = calculateHeading(point, gpsPoints[index + 1]);
      } else if (index > 0) {
        heading = calculateHeading(gpsPoints[index - 1], point);
      }
    

      // heading 90도 보정 (모델 기본 방향이 옆을 향함) + roll 180도 보정
      const hpr = new HeadingPitchRoll(
        heading - CesiumMath.toRadians(90), // heading 90도 보정
        0,                                   // pitch
        CesiumMath.toRadians(180)            // roll 180도 - 모델 뒤집힘 보정
      );
      const orientation = Transforms.headingPitchRollQuaternion(position, hpr);
      orientationProperty.addSample(time, orientation);
    });

    // 드론 Entity 추가 (애니메이션)
    const droneEntity = viewer.entities.add({
      name: "Drone",
      position: positionProperty,
      // 직접 계산한 orientation 사용 (roll 보정 포함)
      orientation: orientationProperty,
      model: {
        uri: "/cesium/Assets/Glb/CesiumDrone.glb",
        minimumPixelSize: 64,
        maximumScale: 20000,
        scale: 10,
      },
      label: {
        text: "Drone",
        font: "14px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: 1,
        pixelOffset: new Cartesian3(0, -50, 0) as any,
      },
      // 경로 표시 (드론이 지나간 경로)
      path: {
        resolution: 1,
        material: Color.YELLOW,
        width: 2,
        leadTime: 0,
        trailTime: flightDuration,
      },
    });

    droneEntityRef.current = droneEntity;

    // Viewer 시계 설정
    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.clock.clockRange = ClockRange.LOOP_STOP; // 끝나면 멈춤
    viewer.clock.multiplier = 1; // 1배속 (조절 가능)
    viewer.clock.shouldAnimate = true; // 애니메이션 시작

    // 타임라인 범위 설정
    if (viewer.timeline) {
      viewer.timeline.zoomTo(startTime, stopTime);
    }
  };

  // Viewer 초기화 및 카메라 이동
  const initViewer = async () => {
    try {
      // Cesium Ion 토큰 설정
      const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "";
      Ion.defaultAccessToken = cesiumToken;

      if (containerRef.current) {
        const viewer = new Viewer(containerRef.current, {});
        viewerRef.current = viewer;

        // 초기 카메라 위치로 이동
        viewer.camera?.flyTo({
          destination: Cartesian3.fromDegrees(
            initialView.longitude as number,
            initialView.latitude as number,
            initialView.height as number
          ),
          orientation: {
            heading: window.Cesium?.Math.toRadians(0),
            pitch: window.Cesium?.Math.toRadians(-45),
            roll: 0,
          },
          duration: 2.0,
          easingFunction: EasingFunction.QUADRATIC_IN_OUT,
        });

        // 드론 비행 경로가 있으면 그리기
        if (flightPath.length > 0) {
          drawFlightPath(viewer, flightPath);
          
          if (animate) {
            // 애니메이션 모드: 드론이 경로를 따라 이동
            animateDrone(viewer, flightPath);
          } else {
            // 정적 모드: 첫 번째 위치에 드론 표시
            addDroneMarker(viewer, flightPath[0]);
          }
        }
      }
    } catch (e) {
      console.error("Cesium 초기화 오류:", e);
    }
  };

  // 컴포넌트 마운트 시 Viewer 초기화
  useEffect(() => {
    // 기존 viewer 정리
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // Viewer 초기화
    initViewer();


    // cleanup
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          viewerRef.current.screenSpaceEventHandler.removeInputAction(3);
          viewerRef.current.destroy();
        } catch (e) {
          console.warn("Cesium destroy warning:", e);
        } finally {
          viewerRef.current = null;
        }
      }
    };
  }, []);

  // flightPath가 변경되면 경로와 드론 마커 다시 그리기
  useEffect(() => {
    if (viewerRef.current && flightPath.length > 0) {
      drawFlightPath(viewerRef.current, flightPath);
      
      if (animate) {
        animateDrone(viewerRef.current, flightPath);
      } else {
        addDroneMarker(viewerRef.current, flightPath[0]);
      }
    }
  }, [flightPath, animate]);


  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "600px" }}
    />
  );
}