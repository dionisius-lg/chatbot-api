import express, { Router } from "express";
import * as controller from "./../controllers/files";
import validation from "./../middleware/validation";
import schema from "./../schemas/files";

const router: Router = express.Router();

router.get('/:id', validation(schema.download, 'params'), controller.download);

export default router;