#!/bin/bash
# =============================================================
# Workout Tracker — Firebase Auto-Setup Script
# Chạy script này trên máy cá nhân của anh (có Node.js)
# =============================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     Workout Tracker — Firebase Auto Setup    ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js chưa được cài. Cài tại: https://nodejs.org${NC}"
    exit 1
fi

# Check/install Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}📦 Cài Firebase CLI...${NC}"
    npm install -g firebase-tools
fi

echo -e "${GREEN}✅ Firebase CLI: $(firebase --version)${NC}"

# Firebase Login
echo ""
echo -e "${CYAN}🔐 Bước 1: Đăng nhập Firebase${NC}"
firebase login

# Tạo project
echo ""
echo -e "${CYAN}🏗️  Bước 2: Tạo Firebase Project${NC}"
PROJECT_ID="workout-tracker-$(date +%s)"
echo -e "Project ID sẽ là: ${GREEN}$PROJECT_ID${NC}"
firebase projects:create "$PROJECT_ID" --display-name "Workout Tracker"
firebase use "$PROJECT_ID"

echo -e "${GREEN}✅ Project created: $PROJECT_ID${NC}"

# Enable billing (cần cho Cloud Functions)
echo ""
echo -e "${YELLOW}⚠️  Bước 3: Cloud Functions cần Blaze plan (pay-as-you-go)"
echo "   Free tier đủ cho cá nhân. Link:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/usage/details"
echo ""
read -p "Anh đã upgrade lên Blaze plan chưa? (y/n): " BLAZE
if [ "$BLAZE" != "y" ]; then
    echo -e "${YELLOW}Deploy Cloud Functions sau khi upgrade nhé. Tiếp tục cài phần còn lại...${NC}"
fi

# Init Firestore
echo ""
echo -e "${CYAN}🗄️  Bước 4: Khởi tạo Firestore${NC}"
firebase firestore:databases:create --location=asia-southeast1 --project "$PROJECT_ID" 2>/dev/null || \
    echo "Firestore đã tồn tại hoặc cần enable thủ công"

# Enable Authentication (phải qua console)
echo ""
echo -e "${YELLOW}🔑 Bước 5: Enable Authentication (cần làm thủ công — 30 giây)"
echo "   Mở link này: https://console.firebase.google.com/project/$PROJECT_ID/authentication"
echo "   → Click 'Get Started' → Enable 'Email/Password'"
read -p "Xong chưa? (nhấn Enter để tiếp tục)"

# Lấy Web App config
echo ""
echo -e "${CYAN}⚙️  Bước 6: Đăng ký Web App và lấy config${NC}"

TOKEN=$(firebase login:ci --no-localhost 2>/dev/null | grep -oP 'token: \K[^\s]+' || firebase auth:token 2>/dev/null || echo "")

# Tạo web app
APP_RESPONSE=$(curl -s -X POST \
    "https://firebase.googleapis.com/v1beta1/projects/$PROJECT_ID/webApps" \
    -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || firebase auth:token 2>/dev/null)" \
    -H "Content-Type: application/json" \
    -d '{"displayName": "WorkoutTracker"}' 2>/dev/null) || true

# Lấy config từ Firebase console
echo ""
echo -e "${YELLOW}📋 Bước 7: Lấy Firebase Config"
echo "   Mở: https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
echo "   → Scroll xuống 'Your apps' → Copy firebaseConfig object"
echo ""
echo "Paste config dạng JSON vào đây (ví dụ: {\"apiKey\":\"...\", ...}), rồi Enter:"
read -r CONFIG_JSON

# Parse và tạo .env
API_KEY=$(echo $CONFIG_JSON | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8').trim(); const c=JSON.parse(d); console.log(c.apiKey||'')")
AUTH_DOMAIN=$(echo $CONFIG_JSON | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8').trim(); const c=JSON.parse(d); console.log(c.authDomain||'')")
PROJECT_ID_CFG=$(echo $CONFIG_JSON | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8').trim(); const c=JSON.parse(d); console.log(c.projectId||'')")
STORAGE_BUCKET=$(echo $CONFIG_JSON | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8').trim(); const c=JSON.parse(d); console.log(c.storageBucket||'')")
MSG_SENDER=$(echo $CONFIG_JSON | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8').trim(); const c=JSON.parse(d); console.log(c.messagingSenderId||'')")
APP_ID=$(echo $CONFIG_JSON | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8').trim(); const c=JSON.parse(d); console.log(c.appId||'')")

# Write .env
cat > .env << EOF
EXPO_PUBLIC_FIREBASE_API_KEY=$API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID_CFG
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$MSG_SENDER
EXPO_PUBLIC_FIREBASE_APP_ID=$APP_ID

# n8n webhook (optional, điền sau)
N8N_WEBHOOK_URL=
EOF

echo -e "${GREEN}✅ .env file đã tạo!${NC}"

# Deploy Firestore rules + indexes
echo ""
echo -e "${CYAN}📜 Bước 8: Deploy Firestore rules & indexes${NC}"
firebase deploy --only firestore --project "$PROJECT_ID_CFG"

# Build & Deploy Functions (nếu có Blaze)
if [ "$BLAZE" = "y" ]; then
    echo ""
    echo -e "${CYAN}⚡ Bước 9: Build & Deploy Cloud Functions${NC}"
    cd functions && npm install && npm run build && cd ..
    firebase deploy --only functions --project "$PROJECT_ID_CFG"
    echo -e "${GREEN}✅ Cloud Functions deployed!${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║           🎉 Setup hoàn thành!               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  ✅ Firebase Project: $PROJECT_ID_CFG"
echo "║  ✅ Firestore rules + indexes deployed"
if [ "$BLAZE" = "y" ]; then
echo "║  ✅ Cloud Functions deployed"
fi
echo "║  ✅ .env file ready"
echo "╠══════════════════════════════════════════════╣"
echo "║  Để chạy app:"
echo "║  $ npx expo start"
echo "║  → Scan QR bằng Expo Go"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
