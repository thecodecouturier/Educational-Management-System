const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);
router.post('/', userController.addUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// routes للصلاحيات
router.get('/permissions/available', userController.getAvailablePermissions);
router.get('/permissions/default/:role', userController.getDefaultPermissionsByRole);

// routes لتعديل الملف الشخصي
router.put('/update-profile/:id', userController.updateProfile);
router.put('/change-password/:id', userController.changePassword);

module.exports = router;
