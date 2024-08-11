import express, { Router } from "express";
import * as controller from "./../controllers/faq_answers";
import validation from "./../middleware/validation";
import fileValidation from "./../middleware/file_validation";
import schema from "./../schemas/faq_answers";

const router: Router = express.Router();

router.get('/', controller.getData);

router.post('/', validation(schema.createData, 'body'), controller.createData);

router.get('/:id', validation(schema.detailById, 'params'), controller.getDataById);

router.patch('/:id', validation(schema.detailById, 'params'), validation(schema.updateData, 'body'), controller.updateDataById);

router.post('/import', fileValidation.single({
    subpath: 'import',
    mimetypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}), controller.importData);

export default router;