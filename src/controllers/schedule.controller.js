const service = require('../services/schedule.service');

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

exports.getAll = handle(async (req, res) => {
    const data = await service.getAll();
    res.json(data);
});

exports.create = handle(async (req, res) => {
    const data = await service.create(req.body);
    res.status(201).json(data);
});

exports.update = handle(async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    res.json(data);
});

exports.remove = handle(async (req, res) => {
    await service.delete(req.params.id);
    res.json({ message: 'Jadwal berhasil dihapus' });
});

exports.getStudentSchedule = handle(async (req, res) => {
    const { class_code, date } = req.query;
    if (!class_code || !date)
        return res.status(400).json({ error: 'class_code dan date wajib diisi' });

    const data = await service.getStudentSchedule(class_code, date);
    if (!data)
        return res.status(404).json({ error: 'Tidak ada jadwal untuk kelas dan tanggal tersebut' });

    res.json(data);
});

exports.getTeacherSchedule = handle(async (req, res) => {
    const { teacher_nik, start_date, end_date } = req.query;
    if (!teacher_nik || !start_date || !end_date)
        return res.status(400).json({ error: 'teacher_nik, start_date, dan end_date wajib diisi' });

    const data = await service.getTeacherSchedule(teacher_nik, start_date, end_date);
    if (!data)
        return res.status(404).json({ error: 'Tidak ada jadwal untuk guru dan periode tersebut' });

    res.json(data);
});

exports.getRekapJP = handle(async (req, res) => {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date)
        return res.status(400).json({ error: 'start_date dan end_date wajib diisi' });

    const data = await service.getRekapJP(start_date, end_date);
    res.json(data);
});

exports.upload = handle(async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'File tidak ditemukan. Gunakan field "file"' });

    const count = await service.uploadFromExcel(req.file.path);
    res.json({ message: `Upload sukses, ${count} baris data ditambahkan.` });
});

exports.exportExcel = handle(async (req, res) => {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date)
        return res.status(400).json({ error: 'start_date dan end_date wajib diisi' });

    const { fileName } = await service.exportRekapExcel(start_date, end_date);

    const protocol = req.protocol;
    const host = req.get('host');
    const downloadUrl = `${protocol}://${host}/public/reports/${fileName}`;

    return res.status(200).json({
        message: "Laporan berhasil dibuat",
        download_url: downloadUrl
    });
});
