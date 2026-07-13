import express, { Router } from "express";
import * as controller from "./../controllers/users";
import validation from "./../middleware/validation";
import schema from "./../schemas/users";
import { authenticateToken } from "./../middleware/auth";

const router: Router = express.Router();

router.get('/', authenticateToken, controller.getData);

router.post('/', authenticateToken, validation(schema.createData, 'body'), controller.createData);

router.get('/:id', authenticateToken, validation(schema.detailById, 'params'), controller.getDataById);

router.put('/:id', authenticateToken, validation(schema.detailById, 'params'), validation(schema.updateData, 'body'), controller.updateDataById);

export default router;
