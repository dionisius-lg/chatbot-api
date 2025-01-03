import express, { Router } from "express";
import * as controller from "./../controllers/exports";
import { authenticateToken } from "./../middleware/auth";

const router: Router = express.Router();

router.get('/faq_answers', authenticateToken, controller.getFaqAnswers);

router.get('/faqs', authenticateToken, controller.getFaqs);

router.get('/languages', authenticateToken, controller.getLanguages);

export default router;