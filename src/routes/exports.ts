import express, { Router } from "express";
import * as controller from "./../controllers/exports";

const router: Router = express.Router();

router.get('/faq_answers', controller.getFaqAnswers);

router.get('/faqs', controller.getFaqs);

router.get('/languages', controller.getLanguages);

export default router;