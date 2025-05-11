const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const ExcelJS = require('exceljs');
const sendNotification = require('../utils/sendNotification');
const verifyToken = require('../middleware/auth');

// ✅ Create contact
router.post('/', verifyToken, async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    await sendNotification(req.user.email, `📇 New contact created: ${contact.fullName}`, req.app);

    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all contacts
router.get('/', verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get one contact
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    res.json(contact);
  } catch (err) {
    res.status(404).json({ error: 'Contact not found' });
  }
});

// ✅ Update contact
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await sendNotification(req.user.email, `✏️ Contact updated: ${updated.fullName}`, req.app);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete contact
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);

    await sendNotification(req.user.email, `🗑️ Contact deleted: ${deleted.fullName}`, req.app);

    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(404).json({ error: 'Contact not found' });
  }
});

// ✅ Export as Excel
router.get('/export/excel', verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contacts');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Note', key: 'note', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    contacts.forEach(contact => worksheet.addRow(contact.toObject()));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to export contacts as Excel' });
  }
});

// ✅ Export as JSON
router.get('/export/json', verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.json');
    res.status(200).json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export contacts as JSON' });
  }
});

module.exports = router;
