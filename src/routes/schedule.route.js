const express = require('express');
const router = express.Router();
const controller = require('../controllers/schedule.controller');
const apiKey = require('../middlewares/apiKey.middleware');
const multer = require('multer');
const path = require('path');

const upload = multer({
    dest: 'tmp/',
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, ext === '.xlsx');
    },
});

router.use(apiKey);

router.post('/upload', upload.single('file'), controller.upload);
router.get('/export', controller.exportExcel);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/student', controller.getStudentSchedule);
router.get('/teacher', controller.getTeacherSchedule);
router.get('/report/rekap-jp', controller.getRekapJP);

module.exports = router;