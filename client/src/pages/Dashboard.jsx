import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Done: 'bg-green-100 text-green-800',
}

export default function Dashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', defect_type: '', date: '' })
  const navigate = useNavigate()

  const token = localStorage.getItem('admin_token')

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.defect_type) params.defect_type = filters.defect_type
      if (filters.date) params.date = filters.date

      const res = await axios.get('/api/reports', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setReports(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
      } else {
        setError('Failed to load reports.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [filters])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-4 shadow flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">EIC-SiteSight</h1>
          <p className="text-blue-200 text-sm">Admin Dashboard</p>
        </div>
        <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm underline">
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option>Pending</option>
            <option>Ongoing</option>
            <option>Done</option>
          </select>

          <select
            value={filters.defect_type}
            onChange={(e) => setFilters({ ...filters, defect_type: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Defect Types</option>
            <option>Pothole</option>
            <option>Damaged Kerb</option>
            <option>Broken Pavement</option>
            <option>Road Marking Damage</option>
            <option>Drainage Issue</option>
            <option>Others</option>
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['Pending', 'Ongoing', 'Done'].map((status) => (
            <div key={status} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {reports.filter((r) => r.status === status).length}
              </p>
              <p className="text-sm text-gray-500">{status}</p>
            </div>
          ))}
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reports...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No reports found.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Defect Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.defect_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/report/${r.id}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
