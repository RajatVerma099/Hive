# Hive - Conversation Platform

A modern, real-time conversation platform that allows people to create and join topic-based discussions, similar to Reddit but focused on live conversations.

## 🚀 Features

### Core Features
- **Conversations**: Create and join public/private topic-based discussions
- **Fades**: Temporary conversations for live events (sports, breaking news, etc.)
- **Real-time Messaging**: Live chat with Socket.io integration
- **Personal Notebook**: Save and organize important messages
- **Discover**: Search and find conversations by topic or name
- **User Roles**: Host, Converser, and Spectator roles in conversations

### Advanced Features
- **Message Translation**: Translate messages to your local language
- **Message Pinning**: Pin important messages (admin/moderator feature)
- **Typing Indicators**: See when others are typing
- **Topic-based Organization**: Conversations organized by topics
- **Time-based Fades**: Temporary groups with automatic expiration
- **Voting System**: Convert Fades to permanent Conversations

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 19** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Socket.io Client** for real-time communication
- **React Router** for navigation
- **Context API** for state management

### Backend (Node.js + Express)
- **Node.js** with Express framework
- **TypeScript** for type safety
- **Socket.io** for real-time messaging
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **CORS** enabled for cross-origin requests

### Database (PostgreSQL)
- **Users**: User profiles and authentication
- **Conversations**: Permanent discussion groups
- **Fades**: Temporary conversation groups
- **Messages**: Chat messages with replies and pinning
- **Participants**: User roles in conversations/fades
- **Notebooks**: Personal message collections

## 📁 Project Structure

```
Hive/
├── apps/
│   ├── frontend/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/       # React components
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── ChatsTab.tsx
│   │   │   │   ├── DiscoverTab.tsx
│   │   │   │   ├── NotebookTab.tsx
│   │   │   │   └── ProfileTab.tsx
│   │   │   ├── context/          # React context
│   │   │   │   └── AppContext.tsx
│   │   │   ├── hooks/            # Custom hooks
│   │   │   │   └── useSocket.ts
│   │   │   ├── services/         # API services
│   │   │   │   └── api.ts
│   │   │   ├── types/            # TypeScript types
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/                  # Node.js backend
│       ├── src/
│       │   └── index.ts          # Main server file
│       ├── prisma/
│       │   └── schema.prisma     # Database schema
│       ├── package.json
│       └── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vently
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd apps/frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb hive

   # Set up environment variables
   cp apps/backend/.env.example apps/backend/.env
   # Edit apps/backend/.env with your database credentials

   # Run database migrations
   cd apps/backend
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd apps/backend
   npm run dev

   # Terminal 2 - Frontend
   cd apps/frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database Studio: `npx prisma studio` (in backend directory)

## 🔧 Development

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hive?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
PORT=3001
NODE_ENV="development"
GOOGLE_TRANSLATE_API_KEY="your-translate-api-key"
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_TRANSLATE_API_KEY=your-translate-api-key
```

## 🎯 Current Status

### ✅ Completed
- [x] Project scaffolding and setup
- [x] Database schema design
- [x] Backend server with Socket.io
- [x] Frontend UI with all tabs
- [x] Real-time messaging infrastructure
- [x] Component architecture
- [x] TypeScript configuration
- [x] Responsive design

### 🚧 In Progress
- [ ] Authentication system
- [ ] API endpoints implementation
- [ ] Database integration
- [ ] Real-time features testing

### 📋 TODO
- [ ] Google OAuth integration
- [ ] Message translation
- [ ] File upload support
- [ ] Push notifications
- [ ] Mobile app
- [ ] Advanced search
- [ ] Moderation tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.io for real-time communication
- Prisma for the excellent ORM
- Tailwind CSS for the utility-first styling
- Vite for the fast build tool
