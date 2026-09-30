import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import api from '../api'

const DEFECT_TYPES = [
  'Pothole',
  'Damaged Kerb',
  'Broken Pavement',
  'Road Marking Damage',
  'Drainage Issue',
  'Others',
]

export default function SubmissionForm() {
  const [form, setForm] = useState({
    submitter_name: '',
    submitter_phone: '',
    defect_type: '',
    materials_required: '',
    notes: '',
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [gps, setGps] = useState({ latitude: null, longitude: null })
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true }
      const compressed = await imageCompression(file, options)
      setPhoto(compressed)
      setPhotoPreview(URL.createObjectURL(compressed))
    } catch (err) {
      setError('Failed to process photo. Please try again.')
    }
  }

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setError('GPS is not supported on this device.')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGpsStatus('success')
      },
      () => {
        setGpsStatus('error')
        setError('Unable to retrieve GPS location. Please allow location access.')
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.submitter_name) return setError('Please enter your name.')
    if (!form.submitter_phone) return setError('Please enter your phone number.')
    if (!form.defect_type) return setError('Please select a defect type.')
    if (!photo) return setError('Please capture or upload a photo.')
    if (!gps.latitude) return setError('Please capture your GPS location.')

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('submitter_name', form.submitter_name)
      formData.append('submitter_phone', form.submitter_phone)
      formData.append('defect_type', form.defect_type)
      formData.append('materials_required', form.materials_required)
      formData.append('notes', form.notes)
      formData.append('latitude', gps.latitude)
      formData.append('longitude', gps.longitude)
      formData.append('photo', photo)

      await api.post('/api/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSubmitted(true)
    } catch (err) {
      setError('Submission failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setForm({ submitter_name: '', submitter_phone: '', defect_type: '', materials_required: '', notes: '' })
    setPhoto(null)
    setPhotoPreview(null)
    setGps({ latitude: null, longitude: null })
    setGpsStatus('idle')
    setError('')
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Report Submitted</h2>
          <p className="text-gray-600 mb-6">Your defect report has been successfully recorded.</p>
          <button
            onClick={handleReset}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold">EIC-SiteSight</h1>
        <p className="text-blue-200 text-sm">Site Defect Report Submission</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-6">

        {/* Submitter Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.submitter_name}
            onChange={(e) => setForm({ ...form, submitter_name: e.target.value })}
            placeholder="e.g. Ahmad bin Abdullah"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submitter Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.submitter_phone}
            onChange={(e) => setForm({ ...form, submitter_phone: e.target.value })}
            placeholder="e.g. 012-3456789"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Defect Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Defect Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.defect_type}
            onChange={(e) => setForm({ ...form, defect_type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Defect Type --</option>
            {DEFECT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Photo Capture */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Defect Photo <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2"
          />
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="mt-3 rounded-lg w-full max-h-48 object-cover border" />
          )}
        </div>

        {/* GPS Detection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            GPS Location <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleGetGps}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200 transition"
          >
            {gpsStatus === 'loading' ? '📡 Detecting location...' :
             gpsStatus === 'success' ? '✅ Location captured' :
             gpsStatus === 'error' ? '❌ Retry GPS' :
             '📍 Detect My Location'}
          </button>
          {gps.latitude && (
            <p className="mt-1 text-xs text-gray-500">
              {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
            </p>
          )}
        </div>

        {/* Materials Required */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Materials Required
          </label>
          <input
            type="text"
            value={form.materials_required}
            onChange={(e) => setForm({ ...form, materials_required: e.target.value })}
            placeholder="e.g. Asphalt, Concrete, Kerb blocks"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional information about the defect..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-800 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Defect Report'}
        </button>
      </form>
    </div>
  )
}
