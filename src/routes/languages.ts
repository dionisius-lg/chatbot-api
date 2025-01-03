import express, { Router } from "express";
import * as controller from "./../controllers/languages";
import validation from "./../middleware/validation";
import schema from "./../schemas/languages";
import { authenticateToken } from "./../middleware/auth";

const router: Router = express.Router();

router.get('/', authenticateToken, controller.getData);

router.get('/:id', authenticateToken, validation(schema.detailById, 'params'), controller.getDataById);

export default router;