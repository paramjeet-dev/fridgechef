import { Router } from 'express';
import {
  getInventory,
  addInventoryItem,
  batchAddInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
  bulkDeleteInventoryItems,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/',getInventory);
router.post('/',addInventoryItem);
router.post('/batch',batchAddInventoryItems);
router.patch('/:id',updateInventoryItem);
router.delete('/',bulkDeleteInventoryItems);   // bulk — body: { ids }
router.delete('/:id',deleteInventoryItem);

export default router;