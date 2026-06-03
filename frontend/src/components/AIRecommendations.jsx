import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Brain, TrendingUp, Star, Briefcase, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AIRecommendations() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState([]);
    const [trendingSkills, setTrendingSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gigs');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (user?.role === 'freelancer') {
                const recRes = await axios.get('http://localhost:5000/api/ai/recommendations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRecommendations(recRes.data.recommendations || []);
            }
            
            const trendRes = await axios.get('http://localhost:5000/api/ai/trending-skills');
            setTrendingSkills(trendRes.data.trending || []);
        } catch (error) {
            console.error('Error fetching AI data:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9f6f]" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Brain size={20} className="text-[#0d9f6f]" />
                <h3 className="text-base font-bold text-gray-800">AI-Powered Insights</h3>
                <span className="ml-auto text-xs text-gray-400">Powered by Machine Learning</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                {user?.role === 'freelancer' && (
                    <button
                        onClick={() => setActiveTab('gigs')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'gigs'
                                ? 'text-[#0d9f6f] border-b-2 border-[#0d9f6f]'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Recommended Gigs
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('trending')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'trending'
                            ? 'text-[#0d9f6f] border-b-2 border-[#0d9f6f]'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Trending Skills
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === 'gigs' && user?.role === 'freelancer' && (
                    <>
                        {recommendations.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Brain size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No recommendations yet</p>
                                <p className="text-xs">Complete your profile to get personalized gig recommendations</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recommendations.map((gig, idx) => (
                                    <div
                                        key={gig.gigId}
                                        onClick={() => navigate(`/gigs/${gig.gigId}`)}
                                        className="p-3 rounded-lg border border-gray-100 hover:shadow-md hover:border-[#0d9f6f]/30 cursor-pointer transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-[#0d9f6f] bg-[#0d9f6f]/10 px-2 py-0.5 rounded">
                                                        {gig.category}
                                                    </span>
                                                    <span className="text-xs font-semibold text-white bg-[#0d9f6f] px-2 py-0.5 rounded-full">
                                                        {gig.matchScore}% Match
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-gray-800 text-sm">{gig.title}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-[#0d9f6f]">
                                                    ${gig.budget?.min} - ${gig.budget?.max}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {gig.skills?.slice(0, 4).map(skill => (
                                                <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                            {gig.skills?.length > 4 && (
                                                <span className="text-xs text-gray-400">+{gig.skills.length - 4}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'trending' && (
                    <div>
                        {trendingSkills.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No trending data yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {trendingSkills.map((skill, idx) => (
                                    <div
                                        key={skill.skill}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                                            <span className="font-medium text-gray-800">{skill.skill}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#0d9f6f] to-[#0a85a0] rounded-full"
                                                    style={{ width: `${Math.min(100, (skill.count / 50) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 w-12">{skill.count} gigs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AIRecommendations;