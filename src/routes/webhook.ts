import express, { Router } from "express";
import * as controller from "./../controllers/webhook";

const router: Router = express.Router();

router.post('/', controller.message);

export default router;