import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../auth/AuthContext';
import { Loader2 } from 'lucide-react';

const API = 'http://localhost:8000';

const EndpointTester = ({ title, method, path, requiresBody, requiresId, requiresUpload, token }) => {
  const [id, setId] = useState('');
  const [body, setBody] = useState('{}');
  const [file, setFile] = useState(null);
  const [patientIdStr, setPatientIdStr] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      let finalPath = path.replace('{id}', id);
      let headers = { Authorization: `Bearer ${token}` };
      let reqBody = null;

      if (requiresBody) {
        reqBody = JSON.parse(body);
        headers['Content-Type'] = 'application/json';
      }

      let res;
      if (requiresUpload) {
        const formData = new FormData();
        formData.append('file', file);
        res = await axios.post(`${API}${path}?patient_id=${patientIdStr}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else if (method === 'GET') {
        res = await axios.get(`${API}${finalPath}`, { headers });
      } else if (method === 'POST') {
        res = await axios.post(`${API}${finalPath}`, reqBody, { headers });
      } else if (method === 'PUT') {
        res = await axios.put(`${API}${finalPath}`, reqBody, { headers });
      } else if (method === 'DELETE') {
        res = await axios.delete(`${API}${finalPath}`, { headers });
      }

      setResult({ type: 'success', data: res?.data || 'Success (No Content)' });
    } catch (err) {
      setResult({ type: 'error', data: err.response?.data?.detail || err.message });
    } finally {
      setLoading(false);
    }
  };

  const methodColors = {
    GET: '#10b981', POST: '#eab308', PUT: '#3b82f6', DELETE: '#ef4444'
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `${methodColors[method]}20`, color: methodColors[method] }}>
          {method}
        </span>
        <span className="font-mono text-slate-300 text-sm">{path}</span>
        <span className="text-slate-400 text-xs ml-auto uppercase tracking-wider font-bold">{title}</span>
      </div>

      <div className="space-y-3">
        {requiresId && (
          <input
            type="text"
            placeholder="Record ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        )}

        {requiresUpload && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="patient_id"
              value={patientIdStr}
              onChange={(e) => setPatientIdStr(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="flex-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white"
            />
          </div>
        )}

        {requiresBody && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder='{"key": "value"}'
          />
        )}

        <button
          onClick={handleTest}
          disabled={loading || !token}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Test Request
        </button>

        {result && (
          <div className={`mt-3 p-3 rounded-lg border font-mono text-xs overflow-auto max-h-48 ${
            result.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-emerald-400'
          }`}>
            <pre>{typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CrudTestPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-2">Supabase CRUD Tester</h2>
          <p className="text-slate-400 text-sm">
            Make sure you are logged in via the Auth panel above to use these endpoints. Token is automatically injected.
          </p>
          {!token && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-bold">
              No active session found. Please login first.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patients */}
          <div>
            <h3 className="text-lg font-bold text-indigo-400 mb-4 uppercase tracking-wider">Patients (CRUD)</h3>
            <EndpointTester title="List Patients" method="GET" path="/patients/" token={token} />
            <EndpointTester title="Create Patient" method="POST" path="/patients/" requiresBody token={token} />
            <EndpointTester title="Get Patient" method="GET" path="/patients/{id}" requiresId token={token} />
            <EndpointTester title="Update Patient" method="PUT" path="/patients/{id}" requiresId requiresBody token={token} />
            <EndpointTester title="Delete Patient" method="DELETE" path="/patients/{id}" requiresId token={token} />
          </div>

          {/* Hospitals */}
          <div>
            <h3 className="text-lg font-bold text-amber-400 mb-4 uppercase tracking-wider">Hospitals (CRUD)</h3>
            <EndpointTester title="List Hospitals" method="GET" path="/hospitals/" token={token} />
            <EndpointTester title="Create Hospital" method="POST" path="/hospitals/" requiresBody token={token} />
            <EndpointTester title="Get Hospital" method="GET" path="/hospitals/{id}" requiresId token={token} />
            <EndpointTester title="Update Hospital" method="PUT" path="/hospitals/{id}" requiresId requiresBody token={token} />
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-lg font-bold text-emerald-400 mb-4 uppercase tracking-wider">Documents (Upload & DB)</h3>
            <EndpointTester title="Upload Document" method="POST" path="/documents/" requiresUpload token={token} />
            <EndpointTester title="List by Patient ID" method="GET" path="/documents/?patient_id={id}" requiresId token={token} />
            <EndpointTester title="Get Document URL" method="GET" path="/documents/{id}" requiresId token={token} />
            <EndpointTester title="Delete Document" method="DELETE" path="/documents/{id}" requiresId token={token} />
          </div>

          {/* FHIR Records */}
          <div>
             <h3 className="text-lg font-bold text-rose-400 mb-4 uppercase tracking-wider">FHIR Records</h3>
             <EndpointTester title="List Records" method="GET" path="/fhir-records/" token={token} />
             <EndpointTester title="Create Record" method="POST" path="/fhir-records/" requiresBody token={token} />
             <EndpointTester title="Get Record" method="GET" path="/fhir-records/{id}" requiresId token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
