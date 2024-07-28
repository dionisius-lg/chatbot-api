import express, { Router } from "express";
import * as controller from "./../controllers/exports";

const router: Router = express.Router();

router.get('/faqs', controller.getDataFaqs);

export default router;