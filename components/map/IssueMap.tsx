'use client';

import { useEffect, useRef } from 'react';
import type { Issue } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  verified: '#10b981',
  in_progress: '#3b82f6',
  resolved: '#6b7280',
  rejected: '#9ca3af',
};

const TYPE_ICONS: Record<string, string> = {
  pothole: '🕳️',
  garbage: '🗑️',
  streetlight: '💡',
  water_leak: '💧',
  other: '📍',
};

interface IssueMapProps {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  center?: [number, number];
  zoom?: number;
}

export default function IssueMap({ issues, onIssueClick, center, zoom = 12 }: IssueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const [lat, lng] = center ?? [40.7128, -74.006];
    const hasMapbox = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
    let cleanup: (() => void) | null = null;

    const initMap = async () => {
      if (hasMapbox) {
        const mapboxgl = (await import('mapbox-gl')).default;
        // @ts-expect-error - CSS module
        await import('mapbox-gl/dist/mapbox-gl.css');
        const map = new mapboxgl.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        issues.forEach((issue) => {
          const el = document.createElement('div');
          el.className = 'cursor-pointer';
          el.innerHTML = `
            <div style="
              width: 36px; height: 36px; border-radius: 50%;
              background: ${STATUS_COLORS[issue.status] ?? '#666'};
              border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex; align-items: center; justify-content: center;
              font-size: 16px;
            " title="${issue.issue_type} - ${issue.status}">
              ${TYPE_ICONS[issue.issue_type] ?? '📍'}
            </div>
          `;
          el.addEventListener('click', () => onIssueClick?.(issue));
          new mapboxgl.Marker({ element: el }).setLngLat([issue.lng, issue.lat]).addTo(map);
        });
        (mapInstance as React.MutableRefObject<unknown>).current = map;
        return () => map.remove();
      } else {
        const L = (await import('leaflet')).default;
        const map = L.map(mapRef.current!).setView([lat, lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(map);
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        issues.forEach((issue) => {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                width: 36px; height: 36px; border-radius: 50%;
                background: ${STATUS_COLORS[issue.status] ?? '#666'};
                border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex; align-items: center; justify-content: center;
                font-size: 16px; cursor: pointer;
              ">${TYPE_ICONS[issue.issue_type] ?? '📍'}</div>
            `,
            iconSize: [36, 36],
          });
          const marker = L.marker([issue.lat, issue.lng], { icon }).addTo(map);
          marker.on('click', () => onIssueClick?.(issue));
          markersRef.current.push(marker);
        });
        mapInstance.current = map;
        return () => {
          map.remove();
          mapInstance.current = null;
        };
      }
    };

    initMap().then((fn) => { cleanup = fn; });

    return () => { cleanup?.(); };
  }, [issues, center?.[0], center?.[1], zoom, onIssueClick]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] rounded-xl overflow-hidden [&_.leaflet-pane]:z-[1] [&_.leaflet-top]:z-[2] [&_.custom-marker]:border-none"
    />
  );
}
