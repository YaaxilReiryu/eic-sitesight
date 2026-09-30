const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const pool = require('../db/pool')
const auth = require('../middleware/auth')
const { generateDefectPDF } = require('../utils/pdfGenerator')

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer config — store photos in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eic-sitesight',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, crop: 'limit' }],
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = /jpeg|jpg|png|webp|octet-stream/
    const allowedExts = /jpeg|jpg|png|webp/
    const mimeOk = allowedMimes.test(file.mimetype)
    const extOk = allowedExts.test(path.extname(file.originalname).toLowerCase())
    if (mimeOk || extOk) return cb(null, true)
    cb(new Error('Only image files are allowed.'))
  },
})

// POST /api/reports — public, no auth
router.post('/', upload.single('photo'), async (req, res) => {
  const { submitter_name, submitter_phone, defect_type, materials_required, notes, latitude, longitude } = req.body

  if (!defect_type || !latitude || !longitude) {
    return res.status(400).json({ message: 'Defect type and GPS coordinates are required.' })
  }

  if (!req.file) {
    return res.status(400).json({ message: 'A defect photo is required.' })
  }

  try {
    const photoUrl = req.file.path

    const result = await pool.query(
      `INSERT INTO defect_reports (submitter_name, submitter_phone, defect_type, materials_required, notes, photo_path, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [submitter_name || null, submitter_phone || null, defect_type, materials_required || null, notes || null, photoUrl, latitude, longitude]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Submit error:', err)
    res.status(500).json({ message: 'Failed to save report.' })
  }
})

// GET /api/reports — admin only
router.get('/', auth, async (req, res) => {
  const { status, defect_type, date } = req.query

  try {
    let query = 'SELECT * FROM defect_reports WHERE 1=1'
    const params = []
    let i = 1

    if (status) { query += ` AND status = $${i++}`; params.push(status) }
    if (defect_type) { query += ` AND defect_type = $${i++}`; params.push(defect_type) }
    if (date) { query += ` AND DATE(submitted_at) = $${i++}`; params.push(date) }

    query += ' ORDER BY submitted_at DESC'

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch reports error:', err)
    res.status(500).json({ message: 'Failed to fetch reports.' })
  }
})

// GET /api/reports/:id — admin only
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM defect_reports WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Report not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Fetch report error:', err)
    res.status(500).json({ message: 'Failed to fetch report.' })
  }
})

// PATCH /api/reports/:id/status — admin only
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body
  const validStatuses = ['Pending', 'Ongoing', 'Done']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be Pending, Ongoing, or Done.' })
  }

  try {
    const result = await pool.query(
      'UPDATE defect_reports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Report not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Status update error:', err)
    res.status(500).json({ message: 'Failed to update status.' })
  }
})

// GET /api/reports/:id/pdf — admin only
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM defect_reports WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Report not found.' })

    const report = result.rows[0]
    const pdfBuffer = await generateDefectPDF(report)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=defect-report-${report.id}.pdf`)
    res.send(pdfBuffer)
  } catch (err) {
    console.error('PDF generation error:', err)
    res.status(500).json({ message: 'Failed to generate PDF.' })
  }
})

module.exports = router