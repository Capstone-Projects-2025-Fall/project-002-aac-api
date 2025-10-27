# 🚀 Deployment Guide - AAC API Project

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites Verification
- [ ] Node.js (v18+) installed
- [ ] Python 3 (v3.7+) installed
- [ ] Yarn or npm package manager
- [ ] Git repository cloned
- [ ] Microphone access enabled
- [ ] Internet connection for speech recognition

### ✅ Dependencies Installation
- [ ] API dependencies installed (`npm install`)
- [ ] Documentation dependencies installed (`yarn install`)
- [ ] Python dependencies installed (`pip3 install SpeechRecognition`)

---

## 🚀 Quick Deployment (5 Minutes)

### **Step 1: Clone Repository**
```bash
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git
cd project-002-aac-api
```

### **Step 2: Install Dependencies**
```bash
# Install API dependencies
cd Initial_API
npm install

# Install documentation dependencies
cd ../documentation
yarn install

# Install Python dependencies
pip3 install SpeechRecognition
```

### **Step 3: Start Servers**
```bash
# Terminal 1 - Documentation Server
cd documentation
ORG_NAME=your-org PROJECT_NAME=aac-api yarn start --host 0.0.0.0

# Terminal 2 - API Server
cd Initial_API
node .
```

### **Step 4: Verify Deployment**
- **Documentation**: [http://localhost:3000/aac-api/](http://localhost:3000/aac-api/)
- **Tic-Tac-Toe Game**: [http://localhost:3000/aac-api/tic-tac-toe](http://localhost:3000/aac-api/tic-tac-toe)
- **API Health**: [http://localhost:8080/test](http://localhost:8080/test)

---

## 🔧 Detailed Deployment Instructions

### **Environment Setup**

#### **1. Node.js Environment**
```bash
# Verify Node.js version
node --version  # Should be v18+

# Verify npm version
npm --version   # Should be v8+
```

#### **2. Python Environment**
```bash
# Verify Python version
python3 --version  # Should be v3.7+

# Install SpeechRecognition
pip3 install SpeechRecognition
```

#### **3. Package Managers**
```bash
# Install Yarn (if not installed)
npm install -g yarn

# Verify installations
yarn --version
npm --version
```

### **API Server Deployment**

#### **1. Navigate to API Directory**
```bash
cd Initial_API
```

#### **2. Install Dependencies**
```bash
npm install
```

#### **3. Verify Installation**
```bash
# Check package.json
cat package.json

# Verify dependencies
npm list
```

#### **4. Start API Server**
```bash
node .
```

**Expected Output:**
```
it's alive on http://localhost:8080
```

#### **5. Test API Endpoints**
```bash
# Health check
curl http://localhost:8080/test

# Expected response:
# {"name":"Test1","status":"test"}
```

### **Documentation Server Deployment**

#### **1. Navigate to Documentation Directory**
```bash
cd documentation
```

#### **2. Install Dependencies**
```bash
yarn install
```

#### **3. Set Environment Variables**
```bash
export ORG_NAME=your-org
export PROJECT_NAME=aac-api
```

#### **4. Start Documentation Server**
```bash
ORG_NAME=your-org PROJECT_NAME=aac-api yarn start --host 0.0.0.0
```

**Expected Output:**
```
[SUCCESS] Docusaurus website is running at: http://localhost:3000/aac-api/
```

#### **5. Verify Documentation**
- Open browser to [http://localhost:3000/aac-api/](http://localhost:3000/aac-api/)
- Verify all pages load correctly
- Test Tic-Tac-Toe game functionality

---

## 🧪 Testing Deployment

### **1. API Testing**
```bash
# Health check
curl http://localhost:8080/test

# Test endpoint
curl -X POST http://localhost:8080/test/123 \
  -H "Content-Type: application/json" \
  -d '{"info": "test"}'

# Upload test (will fail without real audio)
curl -X POST http://localhost:8080/upload \
  -F "audioFile=@/dev/null"
```

### **2. Game Testing**
1. **Open Game**: [http://localhost:3000/aac-api/tic-tac-toe](http://localhost:3000/aac-api/tic-tac-toe)
2. **Test Voice Commands**:
   - Click "Record Command"
   - Say "center"
   - Verify X appears in center
   - Check API log shows request/response
3. **Test Click Interface**:
   - Click squares manually
   - Verify game logic works
4. **Test Audio Feedback**:
   - Listen for text-to-speech announcements
   - Verify win/draw detection

### **3. Unit Testing**
```bash
cd Initial_API
npm test
```

**Expected Output:**
```
PASS  __tests__/api.test.js
✓ GET /test should return status 200
✓ POST /test/:id should return status 200
✓ POST /upload should handle missing file
✓ POST /upload should handle audio processing
✓ Error handling should work correctly

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Port Already in Use**
```bash
# Error: EADDRINUSE: address already in use
# Solution: Kill existing processes
pkill -f "node \."
pkill -f "docusaurus"
```

#### **Module Not Found**
```bash
# Error: Cannot find module 'multer'
# Solution: Reinstall dependencies
cd Initial_API
rm -rf node_modules package-lock.json
npm install
```

#### **Python Module Not Found**
```bash
# Error: ModuleNotFoundError: No module named 'speech_recognition'
# Solution: Install Python dependencies
pip3 install SpeechRecognition
```

#### **Permission Denied**
```bash
# Error: Permission denied for microphone
# Solution: Grant browser microphone access
# Chrome: Settings > Privacy > Microphone
# Firefox: Settings > Privacy > Permissions
```

#### **CORS Errors**
```bash
# Error: CORS policy blocks request
# Solution: Verify CORS middleware is enabled
# Check Initial_API/index.js for cors() middleware
```

### **Debug Commands**

#### **Check Running Processes**
```bash
# Check Node.js processes
ps aux | grep node

# Check Python processes
ps aux | grep python

# Check port usage
lsof -i :3000
lsof -i :8080
```

#### **Check Logs**
```bash
# API server logs
# Check terminal running "node ."

# Documentation server logs
# Check terminal running "yarn start"
```

#### **Verify Dependencies**
```bash
# Check API dependencies
cd Initial_API
npm list

# Check documentation dependencies
cd documentation
yarn list
```

---

## 🌐 Production Deployment

### **Environment Variables**
```bash
# Set production environment variables
export NODE_ENV=production
export ORG_NAME=your-production-org
export PROJECT_NAME=aac-api
export PORT=8080
```

### **Build Documentation**
```bash
cd documentation
yarn build
```

### **Production API Server**
```bash
cd Initial_API
NODE_ENV=production node .
```

### **Reverse Proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 Performance Monitoring

### **Health Checks**
```bash
# API health
curl http://localhost:8080/test

# Documentation health
curl http://localhost:3000/aac-api/
```

### **Resource Monitoring**
```bash
# Check memory usage
ps aux | grep node

# Check CPU usage
top -p $(pgrep node)

# Check disk usage
df -h
```

---

## 🔒 Security Considerations

### **Production Security**
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS restrictions
- [ ] Use environment variables for secrets
- [ ] Regular security updates

### **API Security**
- [ ] Input validation and sanitization
- [ ] File upload restrictions
- [ ] Error message sanitization
- [ ] Request size limits
- [ ] Authentication (if needed)

---

## 📞 Support & Maintenance

### **Log Monitoring**
```bash
# API logs
tail -f /var/log/aac-api.log

# Documentation logs
tail -f /var/log/docusaurus.log
```

### **Backup Strategy**
```bash
# Backup code
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git

# Backup dependencies
tar -czf node_modules_backup.tar.gz node_modules/
```

### **Update Procedure**
```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd Initial_API && npm update
cd ../documentation && yarn upgrade

# Restart services
pkill -f "node \."
pkill -f "docusaurus"
# Restart using deployment commands
```

---

**🎉 Deployment Complete! Your AAC API project is now ready for production use and user testing.**
