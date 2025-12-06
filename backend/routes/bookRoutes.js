const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');
const { bookSchema } = require('../utils/validationSchemas');

// ✅ Public
router.get('/', bookController.listBooks);
router.get('/:id', validateId(), bookController.getBook);

// ✅ Admin Only
router.post('/', authMiddleware, adminMiddleware, validate(bookSchema), bookController.createBook);
router.put('/:id', authMiddleware, adminMiddleware, validateId(), validate(bookSchema), bookController.updateBook);
router.delete('/:id', authMiddleware, adminMiddleware, validateId(), bookController.deleteBook);

module.exports = router;
