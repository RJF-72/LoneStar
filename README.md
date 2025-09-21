# LoneStar IDE - AI-Powered Development Environment

A specialized Integrated Development Environment (IDE) designed for working with the Qwen3:4B language model. LoneStar IDE provides intelligent code assistance, real-time AI chat integration, and advanced development tools powered by artificial intelligence.

## 🚀 Features

### Core IDE Functionality
- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- **Multi-language Support**: TypeScript, JavaScript, Python, Rust, Go, C++, Java, and more
- **File Explorer**: Intuitive project navigation and file management
- **Resizable Panels**: Customizable workspace layout
- **Dark/Light Themes**: Multiple theme options with auto-detection

### AI-Powered Features
- **Qwen3:4B Integration**: Direct integration with Qwen3:4B language model
- **Real-time Chat**: Interactive AI assistant for coding help
- **Code Generation**: AI-powered code completion and generation
- **Code Explanation**: Intelligent code analysis and explanations
- **Smart Debugging**: AI-assisted debugging and error resolution
- **Streaming Responses**: Real-time AI response streaming via WebSocket

### Development Tools
- **Integrated Terminal**: Built-in terminal for command execution
- **Project Management**: Create, organize, and manage development projects
- **Settings Panel**: Comprehensive configuration options
- **WebSocket Communication**: Real-time bidirectional communication
- **RESTful API**: Complete backend API for all IDE operations

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Monaco Editor** for code editing
- **Zustand** for state management
- **React Query** for data fetching
- **Socket.io** for real-time communication

### Backend (Node.js + Express)
- **Express.js** RESTful API server
- **WebSocket** support for real-time features
- **node-llama-cpp** for Qwen3:4B model integration
- **TypeScript** for type safety
- **CORS** and security middleware
- **Compression** and performance optimizations

### AI Integration
- **Qwen3:4B Model**: 4-billion parameter language model
- **Local Inference**: Run model locally for privacy and performance
- **Streaming Support**: Real-time token streaming
- **Configurable Parameters**: Temperature, top-p, top-k, repeat penalty
- **Context Management**: Conversation history and context awareness

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Git**
- **Qwen3:4B Model** (GGUF format)

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
      cd LoneStar/qwen-ide
   ```

2. **Install Dependencies**
   ```bash
   npm run install:all
   ```

3. **Download Qwen Model**
   Download a Qwen3:4B model in GGUF format:
   ```bash
   # Create models directory
   mkdir -p models
   
   # Download model (example)
   curl -L -o models/qwen-4b-chat.gguf \
   "https://huggingface.co/Qwen/Qwen-4B-Chat-GGUF/resolve/main/qwen-4b-chat.q4_0.gguf"
   ```

4. **Configure Environment**
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env
   # Edit the .env file to set QWEN_MODEL_PATH
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # http://localhost:3000
   npm run dev:backend   # http://localhost:8000
   ```

## 🔧 Configuration

### Model Configuration
Configure Qwen3:4B parameters in the Settings panel or via API:

```json
{
  "temperature": 0.7,
  "maxTokens": 2048,
  "topP": 0.9,
  "topK": 50,
  "repeatPenalty": 1.1,
  "systemPrompt": "You are a helpful AI assistant specialized in software development."
}
```

### IDE Settings
Customize the IDE experience:

```json
{
  "aiAssistance": true,
  "autoComplete": true,
  "syntaxHighlighting": true,
  "theme": "dark",
  "fontSize": 14,
  "tabSize": 2,
  "wordWrap": true
}
```

## 📚 Usage

### Getting Started
1. **Open the IDE** in your browser at `http://localhost:3000`
2. **Check Model Status** in the header (should show "Qwen3:4B Ready")
3. **Create or Open Project** using the file explorer
4. **Start Coding** with AI assistance

### AI Chat Interface
- Click the **Chat** tab to open the AI assistant
- Ask questions about your code
- Request code generation or explanations
- Get debugging help and suggestions

### Code Editor Features
- **Syntax Highlighting**: Automatic language detection
- **Auto-completion**: AI-powered code suggestions
- **Multi-file Editing**: Tabbed interface for multiple files
- **Find & Replace**: Advanced search functionality
- **Code Folding**: Collapse code blocks for better navigation

### Terminal Integration
- **Built-in Terminal**: Run commands directly in the IDE
- **Project Context**: Terminal opens in current project directory
- **Command History**: Access previous commands
- **Multiple Terminals**: Support for multiple terminal sessions

## 🔌 API Reference

### Model Endpoints
```
GET    /api/model/status       - Get model status
GET    /api/model/config       - Get model configuration  
PUT    /api/model/config       - Update model configuration
POST   /api/model/initialize   - Initialize/reload model
POST   /api/model/generate     - Generate text (non-streaming)
POST   /api/model/dispose      - Dispose model resources
```

### WebSocket Events
```
model_status        - Model status updates
chat_message        - Send chat message
chat_token         - Receive streaming token
chat_complete      - Chat response complete
model_config_update - Update model configuration
```

### Project Endpoints
```
GET    /api/projects          - List all projects
POST   /api/projects          - Create new project
GET    /api/projects/:id      - Get project details
PUT    /api/projects/:id      - Update project
DELETE /api/projects/:id      - Delete project
```

## 🛠️ Development

### Project Structure
```
qwen-ide/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── stores/          # Zustand state management
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # Shared types
│   └── types.ts
└── package.json             # Root package.json
```

### Development Scripts
```bash
# Development
npm run dev                   # Start both frontend and backend
npm run dev:frontend          # Start frontend only  
npm run dev:backend          # Start backend only

# Building
npm run build                # Build both frontend and backend
npm run build:frontend       # Build frontend only
npm run build:backend        # Build backend only

# Dependencies  
npm run install:all          # Install all dependencies

# Production
npm start                    # Start production server
```

### Adding New Features
1. **Frontend Components**: Add to `frontend/src/components/`
2. **Backend Routes**: Add to `backend/src/routes/`
3. **Shared Types**: Update `shared/types.ts`
4. **State Management**: Update `frontend/src/stores/appStore.ts`

## 🔒 Security Considerations

- **Local Model Execution**: Model runs locally for privacy
- **CORS Configuration**: Properly configured CORS policies
- **Input Validation**: All API inputs are validated
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Comprehensive error handling and logging

## 📈 Performance

### Optimization Features
- **Code Splitting**: Dynamic imports for better loading
- **Compression**: Gzip compression for smaller payloads
- **Caching**: Intelligent caching strategies
- **WebSocket**: Efficient real-time communication
- **Virtual Scrolling**: Handle large file lists efficiently

### System Requirements
- **RAM**: 8GB minimum (16GB recommended for large models)
- **Storage**: 10GB for model and application
- **CPU**: Multi-core processor recommended
- **GPU**: Optional (for faster inference)

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests  
cd backend && npm test

# Run all tests
npm run test
```

## 🐛 Troubleshooting

### Common Issues

**Model Not Loading**
- Check model file path in `.env`
- Ensure model file exists and is in GGUF format
- Check available RAM (models require significant memory)

**WebSocket Connection Failed**
- Verify backend is running on port 8000
- Check firewall settings
- Ensure WebSocket support in browser

**Frontend Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (v18+ required)
- Verify all dependencies are installed

**Performance Issues**
- Reduce model context size
- Lower model precision (use quantized models)
- Increase system RAM
- Close unnecessary browser tabs

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use consistent code formatting (Prettier)
- Add tests for new features
- Update documentation for API changes
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Qwen Team** for the excellent language model
- **Monaco Editor** for the code editing capabilities
- **React Team** for the fantastic framework
- **Node.js Community** for the robust backend ecosystem

## 🔮 Roadmap

### Upcoming Features
- [ ] **Plugin System**: Extensible plugin architecture
- [ ] **Git Integration**: Built-in version control
- [ ] **Code Refactoring**: AI-powered code refactoring tools
- [ ] **Multi-user Support**: Collaborative editing capabilities
- [ ] **Cloud Deployment**: Docker containerization and cloud deployment
- [ ] **More Models**: Support for other language models
- [ ] **Advanced Debugging**: Step-through debugging with AI assistance
- [ ] **Code Review**: AI-powered code review and suggestions

### Version History
- **v1.0.0**: Initial release with core IDE and Qwen3:4B integration
- **v0.9.0**: Beta release with chat interface
- **v0.8.0**: Alpha release with basic editor functionality

---

**Happy Coding with LoneStar IDE! 🎉**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/RJF-72/LoneStar) or contact the development team.