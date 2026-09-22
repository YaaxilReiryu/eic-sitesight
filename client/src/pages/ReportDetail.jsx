import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

const STATUS_ORDER = ['Pending', 'Ongoing', 'Done']
const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Done: 'bg-green-100 text-green-800',
}

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const token = localStorage.getItem('admin_token')

  const fetchReport = async () => {
    try {
      const res = await api.get(`/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReport(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
      } else {
        setError('Failed to load report.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [id])

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true)
      await api.patch(`/api/reports/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setReport({ ...report, status: newStatus })
    } catch (err) {
      setError('Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true)
      const res = await api.get(`/api/reports/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `defect-report-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Failed to generate PDF.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  if (!report) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-4 shadow flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-blue-200 hover:text-white">
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold">Report #{report.id}</h1>
          <p className="text-blue-200 text-sm">Defect Report Detail</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Photo */}
        {report.photo_path && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <img
              src={report.photo_path}
              alt="Defect"
              className="w-full max-h-72 object-cover"
            />
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Defect Type</p>
              <p className="text-gray-800 font-medium mt-1">{report.defect_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[report.status]}`}>
                {report.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Materials Required</p>
              <p className="text-gray-800 mt-1">{report.materials_required || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Submitted At</p>
              <p className="text-gray-800 mt-1">{new Date(report.submitted_at).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase font-semibold">GPS Coordinates</p>
              <p className="text-gray-800 mt-1">{report.latitude}, {report.longitude}</p>
            </div>
            {report.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase font-semibold">Notes</p>
                <p className="text-gray-800 mt-1">{report.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Update Repair Status</p>
          <div className="flex gap-3">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating || report.status === status}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                  ${report.status === status
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                  } disabled:opacity-50`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* PDF Generation */}
        <button
          onClick={handleGeneratePDF}
          disabled={generating}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {generating ? 'Generating PDF...' : '📄 Generate Compliance Report (PDF)'}
        </button>
      </div>
    </div>
  )
}
