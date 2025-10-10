import { Router } from 'express';
import AuthManager from '../controllers/auth.manager.js';
import { requireAuth } from '../middleware/auth.js';

export const routerAuth = Router();

routerAuth.post('/auth/register', AuthManager.register); // podés desactivar luego
routerAuth.post('/auth/login', AuthManager.login);
// usar el nombre real del método del manager
routerAuth.post('/auth/refresh', AuthManager.refreshToken);
routerAuth.post('/auth/logout', AuthManager.logout);

routerAuth.get('/auth/me', requireAuth, AuthManager.me);
