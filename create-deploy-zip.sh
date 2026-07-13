#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Spark App - Elastic Beanstalk ZIP Creator${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found!${NC}"
  echo -e "${RED}Please run this script from the repository root directory.${NC}"
  exit 1
fi

# Define output filename
OUTPUT_ZIP="spark-app-$(date +%Y%m%d-%H%M%S).zip"
PARENT_DIR=$(dirname "$(pwd)")

echo -e "${YELLOW}📦 Creating deployment ZIP...${NC}\n"
echo "Repository: $(pwd)"
echo "Output ZIP: $OUTPUT_ZIP"
echo ""

# Create ZIP excluding unnecessary files
zip -r "$PARENT_DIR/$OUTPUT_ZIP" . \
  -x "node_modules/*" \
  ".git/*" \
  ".gitignore" \
  "dist/*" \
  "*.zip" \
  ".DS_Store" \
  "*.log" \
  ".env" \
  ".env.production" \
  "README.md" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ ZIP created successfully!${NC}\n"
  
  # Get file size
  FILE_SIZE=$(du -h "$PARENT_DIR/$OUTPUT_ZIP" | cut -f1)
  echo -e "${GREEN}📊 File size: $FILE_SIZE${NC}"
  
  # Show file count
  FILE_COUNT=$(unzip -l "$PARENT_DIR/$OUTPUT_ZIP" | tail -1 | awk '{print $2}')
  echo -e "${GREEN}📄 Files included: $FILE_COUNT${NC}\n"
  
  # Show first 20 files in ZIP
  echo -e "${BLUE}📋 ZIP Contents (first 20 files):${NC}"
  unzip -l "$PARENT_DIR/$OUTPUT_ZIP" | head -25
  
  echo -e "\n${GREEN}✨ Ready for deployment!${NC}"
  echo -e "${BLUE}Location: $PARENT_DIR/$OUTPUT_ZIP${NC}\n"
  
  # Instructions
  echo -e "${YELLOW}📝 Next Steps:${NC}"
  echo "1. Deploy to Elastic Beanstalk:"
  echo -e "   ${BLUE}eb deploy --zip-file $PARENT_DIR/$OUTPUT_ZIP${NC}"
  echo ""
  echo "2. Or upload manually via AWS Console:"
  echo -e "   ${BLUE}Open: Elastic Beanstalk Dashboard → Upload and Deploy${NC}"
  echo ""
  echo "3. Or deploy to EC2 manually:"
  echo -e "   ${BLUE}unzip $OUTPUT_ZIP${NC}"
  echo -e "   ${BLUE}npm install${NC}"
  echo -e "   ${BLUE}npm start${NC}"
  
else
  echo -e "${RED}❌ Error creating ZIP file!${NC}"
  exit 1
fi
