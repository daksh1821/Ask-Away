# ❓ Question Site

---
![banner](https://img.shields.io/badge/Question--Answer-Site-blueviolet?style=for-the-badge&logo=github)
---

Welcome to **Question Site**!  
A modern, full-stack platform for asking, answering, and exploring questions on any topic.

---

## ✨ Features

- 🚀 **Google Signup & Login**  
  Authenticate securely using your Google account.

- 👤 **Profile & My Questions**  
  View all your questions and answers on your personal page.

- 🔔 **Notification Bell**  
  Real-time updates for new answers, votes, and more.

- ⭐ **Question & Answer Starring**  
  - Star any question (one star per user per question)
  - Star any answer except your own (one star per user per answer)

- 👁️ **Unique Views Count**  
  Each question displays the number of unique viewers.

- 💬 **Answer Count**  
  Instantly track how many answers each question has.

- 🟢 **Answered / 🔴 Unanswered**  
  Filter questions by their answered or unanswered status.

- ⏰ **Accurate Date & Time**  
  All posts and answers show the correct creation time.

- 📈 **Trending Page**  
  Discover what's hot! Trending questions based on stars, answers, and views.

- 📰 **My Feed**  
  Personalized feed with questions you starred, answered, or asked.

- 🏆 **Reputation System**  
  Gain reputation when others star your questions or answers.

- 🤖 **AI Summarization**  
  Get instant, AI-powered summaries of any question and its top answers.

---

## 🗝️ Setup & Required Access Keys

1. **MongoDB Atlas**  
   Create a free cluster at [mongodb.com](https://www.mongodb.com/atlas/database)  
   - Get your **MongoDB URI** and set as `MONGODB_URI` in backend `.env`

2. **Google Sign-In**  
   Register your app at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)  
   - Get your **Google Client ID**  
   - Set as `GOOGLE_CLIENT_ID` in both frontend and backend `.env`

3. **OpenAI Key (for AI Summarization)**  
   Get an API key at [OpenAI Dashboard](https://platform.openai.com/account/api-keys)  
   - Set as `OPENAI_API_KEY` in backend `.env`

4. **Environment Variables**

   ```bash
   # qa_project_backend/.env
   MONGODB_URI=your_mongodb_uri
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_AUDIENCE=your_google_client_id
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   JWT_SECRET=replace_with_long_random_string
   CLIENT_ORIGIN=http://localhost:5173
   ```

   ```bash
   # qa_project_frontend/.env
   VITE_API_BASE=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Axios, Socket.IO, Google Identity Services
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, OpenAI API
- **Real-Time**: WebSockets for notifications
- **Authentication**: Google SSO + JWT

---

## 🚦 How to Run

```bash
# 1. Backend
cd qa_project_backend
cp .env.example .env
# (edit .env with your values)
npm install
npm run dev

# 2. Frontend
cd ../qa_project_frontend
cp .env.example .env
# (edit .env with your values)
npm install
npm run dev
```

---

## 🎉 Demo Walkthrough

- **Sign up** with Google — fast and secure!
- **Ask questions**, answer others, and star valuable answers.
- **See your activity** in your profile and keep up with a real-time notification bell.
- **Watch reputation grow** as you help the community.
- **See trending topics** and get AI-powered summaries for any question instantly.

---

## 🖼️ Preview

![profile page](https://img.shields.io/badge/Profile-Page-teal?style=flat-square)
![notification bell](https://img.shields.io/badge/Notifications-bell-yellow?style=flat-square)
![ai summary](https://img.shields.io/badge/AI-Summary-purple?style=flat-square)

---

## 🌐 Animation & UI

- Subtle loading animations and clean transitions on all pages.
- Animated notification bell and star button.
- AI summary fades in for a smooth reading experience.

---

## 📝 Contribution

- Fork and star this repo!
- Open issues/PRs for new features or bugfixes.
- See `CONTRIBUTING.md` for guidelines.

---

## 🛡️ License

MIT

---

> _Made with ❤️ by Prashant Chauhan
