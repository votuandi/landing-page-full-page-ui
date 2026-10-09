#!/bin/sh
# Tạo 8 video Shorts DEMO (9:16, 6 giây, không tiếng) + poster từ ảnh minh họa của chính template
# (apps/web/public/images/illustrations — tài sản tự tạo của template-8, không dùng nội dung bên thứ ba).
# Cần ffmpeg. Chạy từ thư mục gốc dự án:  sh scripts/make-demo-shorts.sh
# Thay bằng video công trình thật trước khi xuất bản (xem README – "Thêm video").
set -e
SRC=apps/web/public/images/illustrations
VID=apps/web/public/videos/shorts
IMG=apps/web/public/images/shorts
mkdir -p "$VID" "$IMG"

encode() { # name, filter, source
  ffmpeg -y -v error -loop 1 -t 6 -i "$3" -vf "$2,format=yuv420p" -r 24 -c:v libx264 -preset slow -crf 30 \
    -movflags +faststart -an "$VID/$1.mp4"
  ffmpeg -y -v error -ss 0 -i "$VID/$1.mp4" -frames:v 1 -vf "scale=360:640" -c:v libwebp -quality 72 "$IMG/$1.webp"
}

PAN_X="scale=-2:960,crop=540:960:'(iw-540)*t/6':0"          # lia ngang trái → phải
PAN_X_REV="scale=-2:960,crop=540:960:'(iw-540)*(1-t/6)':0"  # lia ngang phải → trái
PAN_Y="scale=-2:1200,crop=540:960:'(iw-540)/2':'(ih-960)*(1-t/6)'" # lia dọc dưới → trên
ZOOM="crop=ih*9/16:ih,scale=1080:1920,zoompan=z='1+0.18*on/144':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=540x960:fps=24"

encode ho-gia-dinh-1 "$PAN_Y" "$SRC/home-solar-tall.webp"
encode ho-gia-dinh-2 "$PAN_X" "$SRC/home-solar.webp"
encode cua-hang-1 "$PAN_Y" "$SRC/shop-solar-tall.webp"
encode cua-hang-2 "$PAN_X_REV" "$SRC/shop-solar.webp"
encode nha-xuong-1 "$PAN_Y" "$SRC/factory-solar-tall.webp"
encode nha-xuong-2 "$PAN_X" "$SRC/cold-storage-solar.webp"
encode trang-trai-1 "$PAN_X_REV" "$SRC/farm-hybrid-solar.webp"
encode trang-trai-2 "$ZOOM" "$SRC/farm-hybrid-solar.webp"
ls -la "$VID" "$IMG"
