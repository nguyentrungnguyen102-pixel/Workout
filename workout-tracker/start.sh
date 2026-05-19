#!/bin/bash
# ============================================================
# Workout Tracker — One-command dev startup
# Chạy: bash start.sh
# Yêu cầu: Node.js 18+ và Java 11+ (để chạy Firebase Emulator)
# ============================================================
set -e

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║      💪 Workout Tracker Dev Setup        ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js chưa cài. Tải tại: https://nodejs.org${NC}"; exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# 2. Check Java (cần cho Firebase Emulator)
if ! command -v java &>/dev/null; then
  echo -e "${YELLOW}⚠️  Java chưa cài (cần cho Firebase Emulator)"
  echo "   Cài nhanh: brew install openjdk  (Mac)  |  apt install openjdk-17-jdk  (Ubuntu)"
  echo -e "   Tiếp tục không có emulator...${NC}"
  HAS_JAVA=false
else
  echo -e "${GREEN}✅ Java $(java -version 2>&1 | head -1)${NC}"
  HAS_JAVA=true
fi

# 3. Install dependencies nếu chưa có
if [ ! -d "node_modules" ]; then
  echo -e "${CYAN}📦 Cài npm packages...${NC}"
  npm install --legacy-peer-deps
fi

# 4. Install firebase-tools nếu chưa có
if ! command -v firebase &>/dev/null; then
  echo -e "${CYAN}📦 Cài Firebase CLI...${NC}"
  npm install -g firebase-tools
fi

# 5. Khởi động Firebase Emulator (background)
if [ "$HAS_JAVA" = "true" ]; then
  echo ""
  echo -e "${CYAN}🔥 Khởi động Firebase Emulator (demo-workout)...${NC}"
  firebase emulators:start --project demo-workout --only auth,firestore \
    --import ./emulator-data --export-on-exit ./emulator-data \
    > /tmp/firebase-emulator.log 2>&1 &
  EMULATOR_PID=$!
  echo "   PID: $EMULATOR_PID (log: /tmp/firebase-emulator.log)"

  # Chờ emulator sẵn sàng
  echo -ne "   Đang chờ emulator..."
  for i in {1..30}; do
    if curl -s http://localhost:9099 &>/dev/null && curl -s http://localhost:8080 &>/dev/null; then
      echo -e " ${GREEN}✅ Sẵn sàng!${NC}"; break
    fi
    echo -n "."; sleep 1
  done
  echo ""
  echo -e "${GREEN}   🔥 Firebase Emulator UI: http://localhost:4000${NC}"
fi

# 6. Khởi động Expo
echo ""
echo -e "${CYAN}📱 Khởi động Expo...${NC}"
echo -e "${YELLOW}   → Scan QR code bằng Expo Go trên điện thoại${NC}"
echo -e "${YELLOW}   → Điện thoại và máy tính phải cùng WiFi${NC}"
echo ""

# Trap để cleanup khi thoát
cleanup() {
  echo -e "\n${YELLOW}Đang tắt...${NC}"
  [ -n "$EMULATOR_PID" ] && kill $EMULATOR_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

npx expo start
