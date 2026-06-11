const express = require('express');
const router = express.Router();
const controller = require('../controllers/schedule.controller');
const apiKey = require('../middlewares/apiKey.middleware');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tmpDir = '/tmp';
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
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