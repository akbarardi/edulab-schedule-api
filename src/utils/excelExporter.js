const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const supabase = require('../config/supabase');

async function generateRekapExcel(rekapData, start_date, end_date) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekap JP');

    const getWeeks = (start, end) => {
        const weeks = [];
        let cur = new Date(start);
        const last = new Date(end);
        let weekNum = 1;
        while (cur <= last) {
            const weekStart = new Date(cur);
            const weekEnd = new Date(cur);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekEnd > last) weekEnd.setTime(last.getTime());
            weeks.push({
                label: `Pekan ${weekNum}`,
                start: weekStart.toISOString().split('T')[0],
                end: weekEnd.toISOString().split('T')[0],
            });
            cur.setDate(cur.getDate() + 7);
            weekNum++;
        }
        return weeks;
    };
    const weeks = getWeeks(start_date, end_date);

    const yellowFill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
    };
    const textFontBold = { bold: true, color: { argb: 'FF000000' }, size: 11 };
    const centerAlign = { horizontal: 'center', vertical: 'middle' };

    const applyBorderAndAlign = (cell) => {
        cell.alignment = centerAlign;
        cell.font = { bold: true, size: 11 };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' },
        };
    };

    const fixedCols = 4;
    const totalCols = fixedCols + weeks.length + 1;

    sheet.mergeCells(1, 1, 2, 1);
    sheet.mergeCells(1, 2, 2, 2);
    sheet.mergeCells(1, 3, 2, 3);
    sheet.mergeCells(1, 4, 2, 4);
    sheet.mergeCells(1, 5, 1, 4 + weeks.length);
    sheet.mergeCells(1, totalCols, 2, totalCols);

    [['No', 1], ['NIK', 2], ['Nama Pengajar', 3], ['Kelas yg Diajar', 4]].forEach(([label, col]) => {
        const cell = sheet.getCell(1, col);
        cell.value = label;
        applyBorderAndAlign(cell);
    });

    const grupCell = sheet.getCell(1, 5);
    grupCell.value = 'Total Jam Pelajaran Per Pekan';
    applyBorderAndAlign(grupCell);
    grupCell.fill = yellowFill;
    grupCell.font = textFontBold;

    for (let c = 5; c <= 4 + weeks.length; c++) {
        const cell = sheet.getCell(1, c);
        cell.fill = yellowFill;
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    }

    weeks.forEach((w, i) => {
        const cell = sheet.getCell(2, fixedCols + 1 + i);
        cell.value = w.label;
        applyBorderAndAlign(cell);
        cell.fill = yellowFill;
        cell.font = textFontBold;
    });

    const totalCell = sheet.getCell(1, totalCols);
    totalCell.value = 'Total JP';
    applyBorderAndAlign(totalCell);
    totalCell.fill = yellowFill;
    totalCell.font = textFontBold;

    const totalCellRow2 = sheet.getCell(2, totalCols);
    totalCellRow2.fill = yellowFill;
    totalCellRow2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    rekapData.rekap.forEach((guru, idx) => {
        const rowNum = idx + 3;
        const kelasList = guru.detail.map(d => d.class_name).join(', ');

        sheet.getCell(rowNum, 1).value = idx + 1;
        sheet.getCell(rowNum, 2).value = guru.teacher_nik;
        sheet.getCell(rowNum, 3).value = guru.teacher_name;
        sheet.getCell(rowNum, 4).value = kelasList;

        for (let c = 1; c <= 4; c++) {
            sheet.getCell(rowNum, c).border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' },
            };
        }

        weeks.forEach((w, i) => {
            const currentCell = sheet.getCell(rowNum, fixedCols + 1 + i);
            const jp = (guru.weeklyJP && guru.weeklyJP[w.label]) || 0;
            currentCell.value = jp;
            currentCell.alignment = centerAlign;
            currentCell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' },
            };
        });

        const finalTotalCell = sheet.getCell(rowNum, totalCols);
        finalTotalCell.value = guru.total_jp;
        finalTotalCell.alignment = centerAlign;
        finalTotalCell.font = { bold: true };
        finalTotalCell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' },
        };
    });

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 30;
    for (let i = 0; i < weeks.length + 1; i++) {
        sheet.getColumn(fixedCols + 1 + i).width = 12;
    }

    const fileName = `rekap_${start_date}_${end_date}.xlsx`;
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
        .from('reports')
        .upload(fileName, fileBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: true
        });

    fs.unlinkSync(filePath);

    if (error) {
        throw new Error(`Gagal mengunggah laporan ke Supabase Storage: ${error.message}`);
    }
    const { data: publicUrlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

    return { downloadUrl: publicUrlData.publicUrl };
}

module.exports = { generateRekapExcel };