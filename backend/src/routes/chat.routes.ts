import { Router } from 'express';
import { ChatRequestSchema } from '../validators/schemas.js';
import { processChatMessage } from '../services/chat-service.js';
import { saveChatMessage, getChatHistory } from '../database/index.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res, next) => {
  try {
    const parsed = ChatRequestSchema.parse(req.body);

    saveChatMessage('user', parsed.message);
    const response = await processChatMessage(parsed.message);
    saveChatMessage('assistant', response.reply);

    res.json(response);
  } catch (err) {
    next(err);
  }
});

chatRouter.get('/history', (req, res, next) => {
  try {
    const history = getChatHistory(50);
    res.json(history);
  } catch (err) {
    next(err);
  }
});
