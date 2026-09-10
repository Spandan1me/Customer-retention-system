import React, { useState } from 'react';
import api from '../../api';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export const CustomerImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [duplicateMode, setDuplicateMode] = useState('skip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicate_mode', duplicateMode);

    try {
      const res = await api.post('/customers/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data.summary);
      alert('File processed successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-sky-600" /> Customer Data Import Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">Upload CSV or Excel database files of churned ISP subscribers.</p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-8 text-center transition cursor-pointer bg-slate-50">
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer font-bold text-sm text-sky-600 block">
              {file ? file.name : 'Click to Browse CSV or Excel (.xlsx) file'}
            </label>
            <p className="text-xs text-slate-400 mt-1">Requires Customer ID, Customer Name, Mobile Number</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duplicate Customer ID Strategy</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="dup"
                  value="skip"
                  checked={duplicateMode === 'skip'}
                  onChange={() => setDuplicateMode('skip')}
                />
                Skip Duplicate Records (Preserves Existing Follow-ups)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="dup"
                  value="update"
                  checked={duplicateMode === 'update'}
                  onChange={() => setDuplicateMode('update')}
                />
                Update Existing Customer Details
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Validating & Importing...' : 'Import Customer Database'}
          </button>
        </form>

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 space-y-2">
            <p className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Import Summary
            </p>
            <p>Total Rows: <strong>{result.total_rows}</strong></p>
            <p>Imported: <strong className="text-emerald-700">{result.imported}</strong></p>
            <p>Updated: <strong>{result.updated}</strong></p>
            <p>Skipped: <strong>{result.skipped}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};
