import express, { Router } from "express";
import * as controller from "./../controllers/languages";
import validation from "./../middleware/validation";
import schema from "./../schemas/languages";

const router: Router = express.Router();

router.get('/', controller.getData);

router.get('/:id', validation(schema.detailById, 'params'), controller.getDataById);

export default router;