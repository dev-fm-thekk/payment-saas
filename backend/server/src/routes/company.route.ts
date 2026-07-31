import { Router } from 'express';
import * as Controller from '../controllers/Company/company.controller';

const router = Router();

router.post('/', authenticate, post__handler0);
router.get('/', authenticate, get__handler1);
router.get('/:id', authenticate, get__id_handler2);
router.patch('/:id', authenticate, patch__id_handler3);
router.delete('/:id', authenticate, delete__id_handler4);

export default router;
