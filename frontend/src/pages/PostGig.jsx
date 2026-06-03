import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Briefcase, DollarSign, Clock, Tag, Award,
    ArrowLeft, X, Plus, ArrowRight, AlertCircle, Layers
} from 'lucide-react';

function PostGig() {
    const { user } = useAuth();
    const { currency, symbol, exchangeRates } = useCurrency();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '', description: '',
        budget: { min: '', max: '' },
        category: '', skills: [],
        duration: '', experienceLevel: 'Intermediate'
    });
    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user && user.role !== 'client') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center p-8 bg-white rounded-xl border border-gray-100 shadow-sm max-w-sm w-full mx-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={26} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a2332] mb-2">Access Denied</h2>
                    <p className="text-gray-500 text-sm mb-6">Only clients can post gigs.</p>
                    <button onClick={() => navigate('/dashboard')}
                        className="w-full bg-[#0d9f6f] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a8560] transition-colors">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !formData.skills.includes(trimmed)) {
            setFormData({ ...formData, skills: [...formData.skills, trimmed] });
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
    };

    // Convert input amount to USD for storage
    const toUSD = (amount) => {
        if (currency === 'USD') return parseFloat(amount);
        const rate = exchangeRates[currency]?.rate || 1;
        return Math.round(parseFloat(amount) / rate);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Always store in USD
            const budgetInUSD = {
                min: toUSD(formData.budget.min),
                max: toUSD(formData.budget.max)
            };
            await axios.post(
                'http://localhost:5000/api/gigs',
                { ...formData, budget: budgetInUSD },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            navigate('/my-gigs');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post gig');
        }
        setLoading(false);
    };

    const categories = ['Web Development', 'Mobile Development', 'AI/ML', 'Design', 'Writing', 'Marketing', 'Other'];
    const durations = ['Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '3+ months'];
    const experienceLevels = ['Entry', 'Intermediate', 'Expert'];
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a2332] placeholder-gray-400 focus:outline-none focus:border-[#0d9f6f] transition-colors shadow-sm";
    const labelClass = "block text-sm font-semibold text-[#1a2332] mb-1.5";
    const sectionClass = "bg-white rounded-xl border border-gray-100 shadow-sm p-5";

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="mb-6">
                    <button onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-[#0d9f6f] transition-colors mb-4">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0d9f6f]/10 flex items-center justify-center flex-shrink-0">
                            <Briefcase size={20} className="text-[#0d9f6f]" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2332]">Post a New Gig</h1>
                            <p className="text-gray-400 text-sm mt-0.5">Find the perfect freelancer for your project</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm">
                            <AlertCircle size={16} className="flex-shrink-0" /> {error}
                        </div>
                    )}

                    {/* Project Details */}
                    <div className={sectionClass}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <Layers size={15} className="text-[#0d9f6f]" />
                            <h2 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide">Project Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Gig Title <span className="text-red-400">*</span></label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange}
                                    placeholder="e.g., Need React Developer for E-commerce Website"
                                    className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Project Description <span className="text-red-400">*</span></label>
                                <textarea name="description" value={formData.description} onChange={handleChange}
                                    rows="5" placeholder="Describe your project in detail..."
                                    className={`${inputClass} resize-none`} required />
                            </div>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className={sectionClass}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <DollarSign size={15} className="text-[#0d9f6f]" />
                            <h2 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide">
                                Budget Range ({currency})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Min Budget', name: 'budget.min', placeholder: currency === 'INR' ? '10000' : '500' },
                                { label: 'Max Budget', name: 'budget.max', placeholder: currency === 'INR' ? '50000' : '1500' },
                            ].map(({ label, name, placeholder }) => (
                                <div key={name}>
                                    <label className={labelClass}>{label} ({symbol})</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
                                            {symbol}
                                        </span>
                                        <input type="number" name={name}
                                            value={name === 'budget.min' ? formData.budget.min : formData.budget.max}
                                            onChange={handleChange} placeholder={placeholder}
                                            className={`${inputClass} pl-8`} required />
                                    </div>
                                    {currency !== 'USD' && (formData.budget.min || formData.budget.max) && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            ≈ ${toUSD(name === 'budget.min' ? formData.budget.min || 0 : formData.budget.max || 0)} USD (stored)
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scope */}
                    <div className={sectionClass}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <Tag size={15} className="text-[#0d9f6f]" />
                            <h2 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide">Project Scope</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Category <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="category" value={formData.category} onChange={handleChange}
                                        className={`${inputClass} pl-9 appearance-none cursor-pointer`} required>
                                        <option value="">Select category</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Duration <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="duration" value={formData.duration} onChange={handleChange}
                                        className={`${inputClass} pl-9 appearance-none cursor-pointer`} required>
                                        <option value="">Select duration</option>
                                        {durations.map(dur => <option key={dur} value={dur}>{dur}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Experience Level <span className="text-red-400">*</span></label>
                            <div className="flex gap-2">
                                {experienceLevels.map(level => (
                                    <button key={level} type="button"
                                        onClick={() => setFormData({ ...formData, experienceLevel: level })}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border transition-all ${
                                            formData.experienceLevel === level
                                                ? 'bg-[#0d9f6f] text-white border-[#0d9f6f] shadow-sm'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#0d9f6f]/40 hover:text-[#0d9f6f]'
                                        }`}>
                                        <Award size={13} /> {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className={sectionClass}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <Award size={15} className="text-[#0d9f6f]" />
                            <h2 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide">Required Skills</h2>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <input type="text" value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="e.g., React, Node.js, MongoDB"
                                className={`${inputClass} flex-1`} />
                            <button type="button" onClick={addSkill}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0d9f6f]/10 text-[#0d9f6f] border border-[#0d9f6f]/20 rounded-lg text-sm font-semibold hover:bg-[#0d9f6f]/20 transition-colors">
                                <Plus size={15} /> Add
                            </button>
                        </div>
                        {formData.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map(skill => (
                                    <span key={skill} className="flex items-center gap-1.5 bg-[#0d9f6f]/10 text-[#0d9f6f] px-3 py-1 rounded-lg text-sm font-medium border border-[#0d9f6f]/15">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)}
                                            className="text-[#0d9f6f]/60 hover:text-red-500 transition-colors ml-0.5">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">No skills added yet.</p>
                        )}
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full bg-[#0d9f6f] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0a8560] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
                        {loading ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Posting...</>
                        ) : (
                            <>Post Gig <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PostGig;