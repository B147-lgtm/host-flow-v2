
import React, { useState, useEffect } from 'react';
import { MOCK_REVIEWS, PROPERTY_NAME } from '../constants';
import { analyzeReviews, getPricingInsights } from '../services/geminiService';
import { Brain, TrendingUp, Sparkles, ThumbsUp, Lightbulb, RefreshCw, ExternalLink } from 'lucide-react';

interface AIInsightsProps {
  propertyName: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ propertyName }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [pricingData, setPricingData] = useState<{text: string | null, sources: any[]}>({ text: null, sources: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const reviewTexts = MOCK_REVIEWS.map(r => r.comment);
    try {
      const [analysisRes, pricingRes] = await Promise.all([
        // Added propertyName as the second argument
        analyzeReviews(reviewTexts, propertyName),
        // Pass propertyName prop instead of fixed constant
        getPricingInsights(propertyName)
      ]);
      setAnalysis(analysisRes);
      setPricingData(pricingRes);
    } catch (error) {
      console.error("Error fetching AI data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse italic">Consulting the AI brain for farm optimization...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-emerald-600" />
          Farm Strategy Hub
        </h1>
        <button 
          onClick={fetchData}
          className="p-2 hover:bg-emerald-50 rounded-full text-emerald-600 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="w-24 h-24 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Pricing Strategy
          </h2>
          <div className="prose prose-slate text-slate-700 leading-relaxed whitespace-pre-wrap text-sm font-medium">
            {pricingData.text}
          </div>
          
          {pricingData.sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Market Data Sources</p>
              <div className="flex flex-wrap gap-2">
                {pricingData.sources.map((source: any, idx: number) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100 transition-colors font-bold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5" />
            Guest Sentiment
          </h2>
          {analysis && (
            <div className="space-y-6">
              <div>
                <span className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">General Mood</span>
                <p className="text-2xl font-bold mt-1">{analysis.sentiment}</p>
              </div>
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md">
                <p className="text-emerald-50 leading-relaxed text-sm font-medium">
                  {analysis.summary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-500" />
          Operational Improvements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analysis?.improvements.map((improvement: string, i: number) => (
            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                {i + 1}
              </div>
              <p className="text-slate-700 font-bold text-sm leading-relaxed">{improvement}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
