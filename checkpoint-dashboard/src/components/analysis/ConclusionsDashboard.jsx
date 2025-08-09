import React, { useState } from 'react';
import { useConclusionsService } from './ConclusionsService';
import { AlertCircle, FileText, CheckCircle, RefreshCw } from 'lucide-react';

const ConclusionsDashboard = () => {
  const { 
    conclusions, 
    loading, 
    error, 
    fetchConclusions,
    fetchConclusionDetail,
    getStatusColor, 
    getHealthColor 
  } = useConclusionsService();

  const [selectedConclusion, setSelectedConclusion] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleViewDetail = async (conclusion) => {
    setDetailLoading(true);
    try {
      const detail = await fetchConclusionDetail(conclusion.filename);
      setDetailData(detail);
      setSelectedConclusion(conclusion);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Dark theme status colors
  const getDarkStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent': case 'good': return 'bg-green-900 text-green-300 border-green-700';
      case 'warning': case 'moderate': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'critical': case 'poor': return 'bg-red-900 text-red-300 border-red-700';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getDarkHealthColor = (score) => {
    if (score > 0.8) return 'text-green-400';
    if (score > 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-lg text-gray-300">Loading conclusions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="w-4 h-4" />
          <strong>Error:</strong>
        </div>
        <p className="mb-3">{error}</p>
        <button 
          onClick={fetchConclusions}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-400" />
            Training Analysis Conclusions
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Independent analysis reports from JSON files
          </p>
        </div>
        <button
          onClick={fetchConclusions}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {conclusions.length === 0 ? (
        <div className="bg-gray-700 p-8 rounded-lg text-center border border-gray-600">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">No Analysis Reports Found</h4>
          <p className="text-gray-400 mb-4">
            Generate analysis conclusions by running checkpoint analysis.
          </p>
          <div className="bg-gray-800 p-3 rounded text-sm text-left border border-gray-600">
            <p className="text-gray-300 mb-2"><strong>To generate conclusions:</strong></p>
            <code className="text-green-400 text-xs">
              python scripts/analyze_checkpoint.py --checkpoint outputs/checkpoints/latest.pth --config config/bailando_config_stable.yaml --output outputs/conclusions
            </code>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {conclusions.map((conclusion, index) => (
            <div 
              key={index} 
              className="bg-gray-700 border border-gray-600 rounded-lg p-6 hover:border-gray-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Stage {conclusion.stage} Analysis
                    {conclusion.epoch > 0 && (
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-600">
                        Epoch {conclusion.epoch}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-400">
                    Generated: {formatDate(conclusion.generated_at)}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDarkStatusColor(conclusion.status)}`}>
                    {conclusion.status || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <div className="text-xs text-gray-400 uppercase">Health Score</div>
                  <div className={`text-lg font-bold ${getDarkHealthColor(conclusion.health_score)}`}>
                    {conclusion.health_score ? `${(conclusion.health_score * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <div className="text-xs text-gray-400 uppercase">Confidence</div>
                  <div className="text-lg font-bold text-blue-400">
                    {conclusion.confidence_level ? `${(conclusion.confidence_level * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <div className="text-xs text-gray-400 uppercase">Final Loss</div>
                  <div className="text-lg font-bold text-purple-400">
                    {conclusion.final_loss?.toFixed(4) || 'N/A'}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <div className="text-xs text-gray-400 uppercase">Checkpoint</div>
                  <div className="text-sm font-medium text-gray-300 truncate">
                    {conclusion.checkpoint}
                  </div>
                </div>
              </div>

              {conclusion.recommendations?.priority_actions && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-300 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                    Top Recommendations:
                  </h5>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    {conclusion.recommendations.priority_actions.slice(0, 3).map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  File: {conclusion.filename}
                </div>
                <button
                  onClick={() => handleViewDetail(conclusion)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  View Full Analysis
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal - Dark Theme */}
      {selectedConclusion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-600">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  📊 Detailed Analysis - Stage {selectedConclusion.stage}
                </h3>
                <button
                  onClick={() => {
                    setSelectedConclusion(null);
                    setDetailData(null);
                  }}
                  className="text-gray-400 hover:text-gray-200 text-xl font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                  <span className="text-gray-300">Loading detailed analysis...</span>
                </div>
              ) : detailData ? (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  {detailData.executive_summary && (
                    <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-300 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Executive Summary
                      </h4>
                      <div className="text-sm text-blue-200">
                        <p><strong>Status:</strong> {detailData.executive_summary.status}</p>
                        <p><strong>Confidence:</strong> {(detailData.executive_summary.confidence_level * 100).toFixed(1)}%</p>
                        {detailData.executive_summary.key_findings && (
                          <div className="mt-2">
                            <strong>Key Findings:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {detailData.executive_summary.key_findings.map((finding, i) => (
                                <li key={i}>{finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {detailData.recommendations && (
                    <div className="bg-green-900 border border-green-700 p-4 rounded-lg">
                      <h4 className="font-bold text-green-300 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Recommendations
                      </h4>
                      <div className="text-sm text-green-200">
                        {detailData.recommendations.priority_actions && (
                          <div className="mb-3">
                            <strong>Priority Actions:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {detailData.recommendations.priority_actions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {typeof detailData.recommendations === 'string' && (
                          <p>{detailData.recommendations}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next Actions */}
                  {detailData.next_actions && (
                    <div className="bg-yellow-900 border border-yellow-700 p-4 rounded-lg">
                      <h4 className="font-bold text-yellow-300 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Next Actions
                      </h4>
                      <div className="text-sm text-yellow-200">
                        {Array.isArray(detailData.next_actions) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {detailData.next_actions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        ) : (
                          <pre className="whitespace-pre-wrap text-xs bg-gray-800 p-3 rounded border border-gray-600 text-gray-300">
                            {JSON.stringify(detailData.next_actions, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Raw Analysis Data */}
                  {detailData.detailed_analysis && (
                    <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-300 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Detailed Analysis
                      </h4>
                      <pre className="text-xs overflow-auto bg-gray-800 p-3 rounded border border-gray-600 max-h-60 text-gray-300">
                        {JSON.stringify(detailData.detailed_analysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConclusionsDashboard;