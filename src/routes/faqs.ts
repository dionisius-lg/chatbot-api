import express, { Router } from "express";
import * as controller from "./../controllers/faqs";
import validation from "./../middleware/validation";
import fileValidation from "./../middleware/file_validation";
import schema from "./../schemas/faqs";

const router: Router = express.Router();

router.get('/', controller.getData);

router.post('/', validation(schema.createData, 'body'), controller.createData);

router.get('/:id', validation(schema.detailById, 'params'), controller.getDataById);

router.patch('/:id', validation(schema.detailById, 'params'), validation(schema.updateData, 'body'), controller.updateDataById);

router.post('/import', fileValidation.single({
    subpath: 'excel',
    mimetypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}), controller.importData);

export default router;