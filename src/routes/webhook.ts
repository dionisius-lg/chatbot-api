import express, { Router } from "express";
import * as controller from "./../controllers/webhook";
import validation from "./../middleware/validation";
import schema from "./../schemas/webhook";
import { authenticateKey } from "./../middleware/auth";

const router: Router = express.Router();

router.post('/chat', authenticateKey, validation(schema.chat, 'body'), controller.chat);

export default router;
