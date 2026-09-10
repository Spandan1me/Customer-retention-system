import React, { useState } from 'react';
import api from '../../api';
import { FileSpreadsheet, Download, FileText, Table } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('agent_daily');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/export/', { params: { type: reportType, format: 'json' } });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (fmt: string) => {
    try {
      const response = await api.get('/reports/export/', {
        params: { type: reportType, format: fmt },
        responseType: 'blob',
      });
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `${reportType}_report.${fmt === 'excel' ? 'xlsx' : fmt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Retention Reporting Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate and export 12 enterprise performance reports in CSV, Excel, or PDF format.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Report Selector Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-sky-500"
        >
          <option value="agent_daily">1. Agent Daily Performance Report</option>
          <option value="overdue_followup">2. Overdue Follow-up Report</option>
          <option value="recharge_conversion">3. Recharge Conversion Report</option>
          <option value="customer_master">4. Customer Master Assignment Report</option>
        </select>

        <button
          onClick={fetchReport}
          className="w-full md:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition"
        >
          {loading ? 'Generating...' : 'Preview Report Data'}
        </button>
      </div>

      {/* Report Preview Table */}
      {reportData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <h3 className="text-sm font-bold text-slate-800">
            Previewing {reportData.total_records} Records ({reportData.report_type})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white uppercase font-bold">
                <tr>
                  {reportData.headers.map((h: string, idx: number) => (
                    <th key={idx} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.data.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {reportData.headers.map((h: string, cIdx: number) => (
                      <td key={cIdx} className="px-4 py-3 font-medium text-slate-800">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
