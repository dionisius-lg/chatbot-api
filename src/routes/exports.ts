import express, { Router } from "express";
import * as controller from "./../controllers/exports";
import { authenticateToken } from "./../middleware/auth";

const router: Router = express.Router();

router.get('/entities', authenticateToken, controller.getEntities);

router.get('/faqs', authenticateToken, controller.getFaqs);

router.get('/faq_answers', authenticateToken, controller.getFaqAnswers);

router.get('/faq_questions', authenticateToken, controller.getFaqQuestions);

router.get('/languages', authenticateToken, controller.getLanguages);

router.get('/users', authenticateToken, controller.getUsers);

export default router;