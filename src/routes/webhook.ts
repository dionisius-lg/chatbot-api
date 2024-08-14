import express, { Router } from "express";
import * as controller from "./../controllers/webhook";
import validation from "./../middleware/validation";
import schema from "./../schemas/webhook";

const router: Router = express.Router();

router.post('/', validation(schema.message, 'body'), controller.message);

export default router;