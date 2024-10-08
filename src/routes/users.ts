import express, { Router } from "express";
import * as controller from "./../controllers/users";
import validation from "./../middleware/validation";
import schema from "./../schemas/users";

const router: Router = express.Router();

router.get('/', controller.getData);

router.post('/', validation(schema.createData, 'body'), controller.createData);

router.get('/:id', validation(schema.detailById, 'params'), controller.getDataById);

router.patch('/:id', validation(schema.detailById, 'params'), validation(schema.updateData, 'body'), controller.updateDataById);

export default router;