const PDFDocument = require('pdfkit')
const https = require('https')
const http = require('http')

function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function generateDefectPDF(report) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const buffers = []

      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      // ── Header ──────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill('#1d4ed8')
      doc.fillColor('white')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('EIC Advance Sdn Bhd', 50, 20)
      doc.fillColor('#bfdbfe')
         .fontSize(10)
         .font('Helvetica')
         .text('Site Defect Compliance Report', 50, 46)
      doc.fillColor('white')
         .fontSize(10)
         .text(`Report ID: #${report.id}`, 50, 62)

      // ── Status Badge — positioned absolutely, no moveDown ───
      const statusColor = report.status === 'Done' ? '#16a34a'
        : report.status === 'Ongoing' ? '#2563eb' : '#d97706'

      doc.rect(doc.page.width - 130, 20, 80, 24).fill(statusColor)
      doc.fillColor('white')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(report.status, doc.page.width - 130, 27, { width: 80, align: 'center' })

      // ── Reset position after header ──────────────────────────
      doc.y = 100
      doc.x = 50

      // ── Section: Defect Information ──────────────────────────
      doc.fillColor('#1e3a8a')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text('Defect Information', 50)
      doc.moveDown(0.3)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#bfdbfe').lineWidth(1).stroke()
      doc.moveDown(0.5)

      const fields = [
        ['Submitted By', report.submitter_name || 'Not specified'],
        ['Phone Number', report.submitter_phone || 'Not specified'],
        ['Defect Type', report.defect_type],
        ['Materials Required', report.materials_required || 'Not specified'],
        ['Notes', report.notes || 'None'],
        ['Submission Date', new Date(report.submitted_at).toLocaleString('en-MY')],
        ['Current Status', report.status],
      ]

      fields.forEach(([label, value]) => {
        doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text(label.toUpperCase(), 50)
        doc.fillColor('#111827').fontSize(11).font('Helvetica').text(value, 50)
        doc.moveDown(0.6)
      })

      // ── Section: GPS Location ────────────────────────────────
      doc.moveDown(0.3)
      doc.fillColor('#1e3a8a')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text('GPS Location', 50)
      doc.moveDown(0.3)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#bfdbfe').lineWidth(1).stroke()
      doc.moveDown(0.5)

      doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text('COORDINATES', 50)
      doc.fillColor('#111827').fontSize(11).font('Helvetica')
         .text(`${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`, 50)
      doc.moveDown(0.4)
      doc.fillColor('#2563eb').fontSize(9)
         .text(
           `View on Map: https://maps.google.com/?q=${report.latitude},${report.longitude}`,
           50,
           doc.y,
           { link: `https://maps.google.com/?q=${report.latitude},${report.longitude}`, underline: true }
         )

      // ── Section: Defect Photo ────────────────────────────────
      if (report.photo_path) {
        try {
          const imageBuffer = await fetchImageBuffer(report.photo_path)
          doc.moveDown(1)
          doc.fillColor('#1e3a8a')
             .fontSize(13)
             .font('Helvetica-Bold')
             .text('Defect Photo', 50)
          doc.moveDown(0.3)
          doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#bfdbfe').lineWidth(1).stroke()
          doc.moveDown(0.5)
          doc.image(imageBuffer, 50, doc.y, { fit: [495, 280], align: 'center' })
          doc.moveDown(1)
        } catch (imgErr) {
          console.error('Could not load image for PDF:', imgErr.message)
          doc.moveDown(0.5)
          doc.fillColor('#ef4444').fontSize(10).font('Helvetica')
             .text('Image could not be loaded.', 50)
        }
      }

      // ── Footer ───────────────────────────────────────────────
      doc.moveDown(2)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke()
      doc.moveDown(0.5)
      doc.fillColor('#9ca3af')
         .fontSize(8)
         .font('Helvetica')
         .text(
           `Generated by EIC-SiteSight Platform • ${new Date().toLocaleString('en-MY')} • EIC Advance Sdn Bhd, Putrajaya`,
           50,
           doc.y,
           { align: 'center', width: 495 }
         )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { generateDefectPDF }