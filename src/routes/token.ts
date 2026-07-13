import express, { Router } from "express";
import * as controller from "./../controllers/token";
import validation from "./../middleware/validation";
import schema from "./../schemas/token";
import { authenticateRefreshToken } from "./../middleware/auth";

const router: Router = express.Router();

router.post('/', validation(schema.auth, 'body'), controller.auth);

router.get('/refresh', authenticateRefreshToken, controller.refreshAuth);

export default router;
