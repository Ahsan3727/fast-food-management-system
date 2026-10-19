---
name: maps-integration
description: >-
  Use this skill when the user asks to set up, debug, or improve map
  functionality in the fast-food management system. Covers Leaflet + OpenStreetMap
  integration in the CustomerApp and RiderApp, the delivery pin picker, live
  rider tracking, and routing.
---

# Maps Integration Skill

This skill guides you through implementing and debugging maps in the fast-food management system using Leaflet + react-leaflet inside Capacitor.

## Architecture

- **Library**: `react-leaflet` + `leaflet` (replaces the Groxo WebView + Leaflet HTML approach).
- **Tiles**: OpenStreetMap for development; a paid tile provider (e.g., MapTiler, Stadia) for production.
- **Routing**: Public OSRM demo server for development. ⚠️ Use a production routing provider or self-hosted OSRM for production.
- **Geocoding**: OpenStreetMap Nominatim for development; a paid geocoder for production.

## Key Map Features

| Feature | Screen | Description |
|---|---|---|
| Delivery pin picker | `checkout/` | Customer drops a pin to set delivery address |
| Live rider tracking | `tracking/` | Customer sees rider moving in real time |
| Rider route | `active-delivery/` | Rider sees route from restaurant to customer |
| Restaurant marker | `active-delivery/` | Fixed restaurant pickup point from `settings` (not hardcoded — see C13) |

## Steps

### 1. Setup

```bash
pnpm add leaflet react-leaflet --filter customer
pnpm add @types/leaflet -D --filter customer
```

In the map component:
```ts
import 'leaflet/dist/leaflet.css';
// Fix broken default marker icons under Vite:
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });
```

### 2. Map Container Requirements

- Always give the map container a **fixed height** (`height: 400px` or `100vh`).
- **Tear the map down** when leaving the screen to prevent memory leaks:
  ```tsx
  useEffect(() => () => map.remove(), [map]);
  ```

### 3. Live Rider Tracking

- Subscribe to `rider:location:update` socket event in `tracking/`.
- On each event, update the rider marker position using a ref — do not re-render the whole map.
- Fallback: if no socket event for 15 s, show "location updating…" indicator.

### 4. Delivery Pin Picker

- Allow the customer to drag a marker to set the delivery pin.
- On pin drop, call reverse geocoding to populate the address line.
- Save `{ lat, lng, addressLine }` — not just coordinates.
- The restaurant location center comes from `settings` API — never hardcoded (C13).

### 5. Debug Common Issues

| Issue | Fix |
|---|---|
| Map tiles not loading | Check Leaflet CSS is imported; check tile URL is accessible |
| Marker icon broken (404) | Import marker images and set `L.Icon.Default.mergeOptions` |
| Map container height 0 | Add explicit height via CSS |
| Map not updating on rider move | Use a ref for the marker, call `marker.setLatLng()` instead of re-rendering |
| OSRM routing fails | Check OSRM demo server is not rate-limiting; switch to a production provider |
