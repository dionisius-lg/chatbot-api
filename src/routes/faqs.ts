import express, { Router } from "express";
import * as controller from "./../controllers/faqs";
import validation from "./../middleware/validation";
import fileValidation from "./../middleware/file_validation";
import schema from "./../schemas/faqs";
import { authenticateToken } from "./../middleware/auth";

const router: Router = express.Router();

router.get('/', authenticateToken, controller.getData);

router.post('/', authenticateToken, validation(schema.createData, 'body'), controller.createData);

router.get('/:id', authenticateToken, validation(schema.detailById, 'params'), controller.getDataById);

router.put('/:id', authenticateToken, validation(schema.detailById, 'params'), validation(schema.updateData, 'body'), controller.updateDataById);

router.post('/import', authenticateToken, fileValidation.single({
    subpath: 'import',
    mimetypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}), controller.importData);

router.post('/train', authenticateToken, controller.trainData);

export default router;
