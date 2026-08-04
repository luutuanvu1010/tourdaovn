# Cách nhúng bản đồ lộ trình xe Bus của nhatrangbuscitytour.com

Kết quả gỡ lỗi trang https://nhatrangbuscitytour.com/lo-trinh-cac-tuyen-bus (04/08/2026).

## Tóm tắt

Không phải iframe hay ảnh tĩnh. Đây là **bản đồ Leaflet tự dựng**, vẽ trạm + lộ trình + xe chạy realtime, lấy dữ liệu từ 2 API JSON của chính website (OpenCart / PHP 7.4).

## Thư viện dùng

| Thư viện | Vai trò |
|---|---|
| `leaflet@1.9.4` | bản đồ nền |
| `leaflet-routing-machine@3.2.12` | vẽ đường đi bám theo đường thật (OSRM) |
| `leaflet-polylinedecorator` | vẽ mũi tên chỉ hướng xe |
| Tile: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | OpenStreetMap, miễn phí |

DOM chỉ cần: `<div id="map"></div>`

## 2 API dữ liệu

### 1. Danh sách trạm — `GET /smartbus/gps/stops`

Trả về mảng 22 trạm:

```json
[
  {
    "name": "Công viên Phù Đổng",
    "latitude": "12.22978100",
    "longitude": "109.19930600",
    "time_start": "08:30:00",
    "time_end": "18:30:00",
    "status": "1",
    "sort_order": "1"
  }
]
```

Frontend lọc theo giờ: chỉ hiện trạm mà **giờ hiện tại nằm giữa `time_start` và `time_end`**. Đây chính là cơ chế "lịch trình" — giờ hoạt động lưu ngay trong từng trạm, không có bảng lịch riêng.

### 2. Vị trí xe realtime — `GET /smartbus/gps/vehicles`

```json
{
  "Vehicles": [
    {
      "VehicleID": 125713,
      "VehiclePlate": "79H04876",
      "license_plate": "79H - 048.76",
      "Latitude": 12.210695,
      "Longitude": 109.193489,
      "Speed": 26,
      "State": 3,
      "Direction": 1,
      "LocalTime": "2026-08-04T15:10:38",
      "Address": "Phước Long, P. Nam Nha Trang, Khánh Hòa",
      "TotalKm": 77.58,
      "DoorClosed": true,
      "contact_phone": "1900989976"
    }
  ]
}
```

Cấu trúc field (`VehicleID`, `TotalKm`, `DoorClosed`, `UTCTime`/`LocalTime`) là dạng chuẩn của **nhà cung cấp hộp đen GPS Việt Nam**. Backend PHP của họ đóng vai proxy: gọi API nhà cung cấp bằng key riêng rồi trả JSON sạch ra frontend.

## Luồng hoạt động

1. `initializeMap()` chạy khi load trang:
   - `fetchStops()` → lọc theo giờ → tạo `waypoints`
   - Mỗi trạm `status = 1` → thêm marker
   - `L.Routing.control({ waypoints, createMarker: () => null, show: false, addWaypoints: false })` → vẽ đường nối các trạm theo đường thật
2. Xin `geolocation` của khách → marker "Vị trí của bạn"
3. `setInterval(..., 2000)` → mỗi **2 giây** gọi `/smartbus/gps/vehicles`, cập nhật `setLatLng()` cho marker xe + vẽ lại mũi tên hướng bằng `polylineDecorator` (chỉ khi `State === 3`, tức xe đang chạy)

## Nếu muốn làm tương tự cho tourdaovn

**Rào cản duy nhất:** endpoint `/smartbus/gps/*` **không có header `Access-Control-Allow-Origin`** → trình duyệt sẽ chặn nếu gọi trực tiếp từ domain khác.

Giải pháp phù hợp với kiến trúc hiện tại (Astro tĩnh + Cloudflare Workers):

- Tạo route proxy trong Worker, ví dụ `/api/bus/stops` và `/api/bus/vehicles`, gọi ngược về nguồn rồi trả kèm CORS header.
- Cache `stops` vài phút; `vehicles` không cache.
- Giảm nhịp polling xuống 5–10 giây thay vì 2 giây để đỡ tải.
- Nếu tự quản lý dữ liệu: đưa danh sách trạm vào Sanity (name, lat, lng, time_start, time_end, sort_order, status) — đúng schema trên là chạy được ngay.

**Lưu ý pháp lý:** dữ liệu GPS này thuộc về Công ty CP Quản lý và Phát triển Du lịch Thái Bình Dương. Nếu dùng lại cho website khác cần có thỏa thuận với họ.

## Điểm yếu quan sát được (nếu tự làm nên tránh)

- Polling 2 giây là quá dày, tốn băng thông cả 2 phía.
- `L.Routing.control` gọi OSRM public mỗi lần load trang → chậm và phụ thuộc dịch vụ ngoài. Nên tính đường 1 lần rồi lưu polyline tĩnh (GeoJSON).
- Không có xử lý lỗi khi API fail — bản đồ sẽ trắng.
