# 🤖 Using Your Local Qwen3:4B Model with LoneStar IDE

## Quick Setup Guide

### 1. **Locate Your Qwen3:4B Model**
Find your existing Qwen3:4B model file on your PC. It should be in GGUF format (`.gguf` file extension).

### 2. **Update Configuration**
Edit the file: `qwen-ide/backend/.env`

Replace this line:
```
QWEN_MODEL_PATH=/path/to/your/qwen3-4b-model.gguf
```

With the actual path to your model, for example:

**Windows:**
```
QWEN_MODEL_PATH=C:/Users/YourName/AI/models/qwen-4b-chat.gguf
```

**Linux/Mac:**
```
QWEN_MODEL_PATH=/home/username/models/qwen-4b-chat.gguf
```

**Relative Path (if model is in project):**
```
QWEN_MODEL_PATH=../../../models/qwen-4b-chat.gguf
```

### 3. **Start LoneStar IDE**
```bash
cd qwen-ide
npm run dev
```

### 4. **Verify Model Loading**
- Open http://localhost:3000
- Check the header - you should see "Qwen3:4B Ready" when the model loads
- If you see "Connecting..." or "Error", check the backend console logs

## 🔧 Supported Model Formats

LoneStar IDE supports these Qwen3:4B variants:
- ✅ **GGUF format** (.gguf files) - **Recommended**
- ✅ **Quantized models** (Q4_0, Q4_1, Q5_0, Q5_1, Q8_0)
- ✅ **Chat and Instruct versions**

## 💡 Tips

1. **Model File Names** - Common Qwen3:4B filenames:
   - `qwen-4b-chat-q4_0.gguf`
   - `qwen2-4b-instruct-q4_0.gguf`
   - `Qwen-4B-Chat-GGUF.gguf`

2. **Memory Requirements:**
   - Minimum: 6GB RAM
   - Recommended: 8GB+ RAM
   - GPU acceleration: Optional but recommended

3. **Path Format:**
   - Use forward slashes `/` even on Windows
   - Or use double backslashes `\\` on Windows
   - Avoid single backslashes `\`

## 🚨 Troubleshooting

### Model Not Found Error
```
Error: Model file not found: /path/to/model.gguf
```
**Solution:** Double-check the file path in `.env` file

### Out of Memory Error
```
Error: Failed to load model - insufficient memory
```
**Solution:** 
- Close other applications
- Use a smaller quantized model (Q4_0 instead of Q8_0)
- Reduce `gpuLayers` in ModelService

### Permission Error
```
Error: EACCES: permission denied
```
**Solution:** Ensure the model file has read permissions

## 📊 Model Status Indicators

In the LoneStar IDE header, you'll see:
- 🟢 **"Qwen3:4B Ready"** - Model loaded successfully
- 🟡 **"Connecting..."** - Model is loading
- 🔴 **"Error"** - Model failed to load
- ⚪ **"Disconnected"** - Model not initialized

## 🎯 Next Steps

Once your model is loaded:
1. **Chat Panel** - Click "Chat" tab to interact with Qwen3:4B
2. **Code Assistance** - Ask for code help, explanations, debugging
3. **Settings** - Adjust model parameters (temperature, max tokens, etc.)

---

**Need help?** Check the backend console logs for detailed error messages.