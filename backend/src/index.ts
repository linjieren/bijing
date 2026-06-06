import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error';
import { userMiddleware } from './middleware/user';
import { success, error } from './middleware/response';

import storyRoutes from './routes/stories';
import shareRoutes from './routes/share';
import squareRoutes from './routes/square';
import feedbackRoutes from './routes/feedback';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Anonymous-Id');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(userMiddleware);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 当前用户信息
app.get('/api/me', (req, res) => {
  const user = req.currentUser;
  if (!user) {
    error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
    return;
  }
  success(res, {
    id: user.id,
    anonymous_id: user.anonymous_id,
    nickname: user.nickname,
    avatar_color: user.avatar_color,
    phone: user.phone,
    created_at: user.created_at,
  });
});

// API 路由
app.use('/api/stories', storyRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/square', squareRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Bijing backend listening on port ${PORT}`);
});
