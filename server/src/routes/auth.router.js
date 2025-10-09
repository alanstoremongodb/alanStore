import { Router } from 'express';
import AuthManager from '../controllers/auth.manager.js';
import { requireAuth } from '../middleware/auth.js';

export const routerAuth = Router();

routerAuth.post('/auth/register', AuthManager.register); // podés desactivar luego
routerAuth.post('/auth/login', AuthManager.login);
routerAuth.post('/auth/refresh', AuthManager.refresh);
routerAuth.post('/auth/logout', AuthManager.logout);

routerAuth.get('/auth/me', requireAuth, AuthManager.me);
