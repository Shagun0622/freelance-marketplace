import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, FileText, Save, ArrowLeft,
    CheckCircle, AlertCircle, Plus, X, Code, Briefcase,
    Award, Globe, Clock, DollarSign, Star, Trash2, ExternalLink,
    Shield, TrendingUp
} from 'lucide-react';

function Profile() {
    const { user, updateUser, token } = useAuth();
    const navigate = useNavigate();
    const isFreelancer = user?.role === 'freelancer';

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || '',
        skills: user?.skills || [],
        // Freelancer fields
        title: user?.title || '',
        hourlyRate: user?.hourlyRate || '',
        experienceLevel: user?.experienceLevel || 'Intermediate',
        availability: user?.availability || 'Full-time',
        workExperience: user?.workExperience || [],
        certifications: user?.certifications || [],
        portfolio: user?.portfolio || [],
        resumeUrl: user?.resumeUrl || '',
    });

    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profileCompleteness, setProfileCompleteness] = useState(0);
    const [activeTab, setActiveTab] = useState('basic');

    // Work experience form
    const [newExp, setNewExp] = useState({ company: '', role: '', startYear: '', endYear: '', current: false, description: '' });
    // Certification form
    const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '', url: '' });
    // Portfolio form
    const [newPortfolio, setNewPortfolio] = useState({ title: '', description: '', url: '', imageUrl: '' });

    useEffect(() => { calculateCompleteness(); }, [formData]);

    const calculateCompleteness = () => {
        let completed = 0;
        if (formData.name) completed += 15;
        if (formData.email) completed += 10;
        if (formData.phone) completed += 10;
        if (formData.location) completed += 10;
        if (formData.bio) completed += 10;
        if (formData.skills.length > 0) completed += 10;
        if (isFreelancer) {
            if (formData.title) completed += 10;
            if (formData.hourlyRate) completed += 5;
            if (formData.workExperience.length > 0) completed += 10;
            if (formData.certifications.length > 0) completed += 5;
            if (formData.portfolio.length > 0) completed += 5;
        } else {
            completed += 35; // remaining % for clients
        }
        setProfileCompleteness(Math.min(completed, 100));
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !formData.skills.includes(trimmed)) {
            setFormData({ ...formData, skills: [...formData.skills, trimmed] });
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });

    const addWorkExp = () => {
        if (!newExp.company || !newExp.role || !newExp.startYear) return;
        setFormData({ ...formData, workExperience: [...formData.workExperience, { ...newExp }] });
        setNewExp({ company: '', role: '', startYear: '', endYear: '', current: false, description: '' });
    };

    const removeWorkExp = (i) => setFormData({ ...formData, workExperience: formData.workExperience.filter((_, idx) => idx !== i) });

    const addCert = () => {
        if (!newCert.name || !newCert.issuer) return;
        setFormData({ ...formData, certifications: [...formData.certifications, { ...newCert }] });
        setNewCert({ name: '', issuer: '', year: '', url: '' });
    };

    const removeCert = (i) => setFormData({ ...formData, certifications: formData.certifications.filter((_, idx) => idx !== i) });

    const addPortfolio = () => {
        if (!newPortfolio.title || !newPortfolio.url) return;
        setFormData({ ...formData, portfolio: [...formData.portfolio, { ...newPortfolio }] });
        setNewPortfolio({ title: '', description: '', url: '', imageUrl: '' });
    };

    const removePortfolio = (i) => setFormData({ ...formData, portfolio: formData.portfolio.filter((_, idx) => idx !== i) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        const result = await updateUser(formData);
        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => navigate('/dashboard'), 1500);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
        }
        setLoading(false);
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0d9f6f]/20 focus:border-[#0d9f6f] transition-all bg-gray-50 focus:bg-white";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
    const sectionClass = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6";

    const tabs = isFreelancer ? [
        { key: 'basic',      label: 'Basic Info',    icon: User },
        { key: 'freelancer', label: 'Professional',  icon: Briefcase },
        { key: 'experience', label: 'Experience',    icon: TrendingUp },
        { key: 'portfolio',  label: 'Portfolio',     icon: Globe },
    ] : [
        { key: 'basic', label: 'Basic Info', icon: User },
    ];

    return (
        <div className="max-w-3xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-[#0d9f6f] transition-colors mb-4">
                    <ArrowLeft size={15} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0d9f6f]/10 flex items-center justify-center">
                        <User size={19} className="text-[#0d9f6f]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                        <p className="text-gray-400 text-sm">Manage your {isFreelancer ? 'professional' : 'personal'} information</p>
                    </div>
                </div>
            </div>

            {/* Completeness Card */}
            <div className={`${sectionClass} mb-5`}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-sm font-bold text-gray-800">Profile Completeness</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {profileCompleteness === 100 ? 'Your profile is complete — great visibility!' : 'Complete your profile to attract more opportunities'}
                        </p>
                    </div>
                    <span className="text-2xl font-bold text-[#0d9f6f]">{profileCompleteness}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0d9f6f] to-[#0891b2] transition-all duration-500"
                        style={{ width: `${profileCompleteness}%` }} />
                </div>

                {/* Checklist */}
                {isFreelancer && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                            { label: 'Name & Bio',      done: !!(formData.name && formData.bio) },
                            { label: 'Contact Info',    done: !!(formData.phone && formData.location) },
                            { label: 'Skills',          done: formData.skills.length > 0 },
                            { label: 'Professional Title', done: !!formData.title },
                            { label: 'Work Experience', done: formData.workExperience.length > 0 },
                            { label: 'Certifications',  done: formData.certifications.length > 0 },
                            { label: 'Portfolio',       done: formData.portfolio.length > 0 },
                            { label: 'Hourly Rate',     done: !!formData.hourlyRate },
                        ].map(item => (
                            <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                                item.done ? 'bg-[#0d9f6f]/5 border-[#0d9f6f]/15 text-[#0d9f6f]' : 'bg-gray-50 border-gray-100 text-gray-400'
                            }`}>
                                {item.done
                                    ? <CheckCircle size={12} className="flex-shrink-0" />
                                    : <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />
                                }
                                {item.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            {isFreelancer && (
                <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}>
                            <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {message.text && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm border ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                        {message.text}
                    </div>
                )}

                {/* ── BASIC INFO TAB ── */}
                {activeTab === 'basic' && (
                    <div className={sectionClass}>
                        <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <User size={15} className="text-[#0d9f6f]" /> Basic Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                                        className={`${inputClass} pl-10`} required />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email Address</label>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="email" value={formData.email} disabled
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Phone</label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                            placeholder="+91 98765 43210" className={`${inputClass} pl-10`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Location</label>
                                    <div className="relative">
                                        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" name="location" value={formData.location} onChange={handleChange}
                                            placeholder="City, Country" className={`${inputClass} pl-10`} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Bio / About</label>
                                <div className="relative">
                                    <FileText size={15} className="absolute left-3.5 top-3 text-gray-400" />
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4"
                                        placeholder="Tell clients about yourself, your experience and what you do best..."
                                        className={`${inputClass} pl-10 resize-none`} />
                                </div>
                            </div>
                            {/* Skills */}
                            <div>
                                <label className={labelClass}>Skills</label>
                                <div className="flex gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Code size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                            placeholder="e.g. React, Python, Figma"
                                            className={`${inputClass} pl-10`} />
                                    </div>
                                    <button type="button" onClick={addSkill}
                                        className="px-4 py-2.5 bg-[#0d9f6f]/10 text-[#0d9f6f] border border-[#0d9f6f]/20 rounded-xl hover:bg-[#0d9f6f]/20 transition-colors">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                {formData.skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map(skill => (
                                            <span key={skill} className="flex items-center gap-1.5 bg-[#0d9f6f]/8 text-[#0d9f6f] px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#0d9f6f]/15">
                                                {skill}
                                                <button type="button" onClick={() => removeSkill(skill)} className="text-[#0d9f6f]/50 hover:text-red-500 transition-colors">
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">Add skills to get matched with relevant projects</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PROFESSIONAL TAB (Freelancer only) ── */}
                {activeTab === 'freelancer' && isFreelancer && (
                    <div className="space-y-5">
                        <div className={sectionClass}>
                            <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Briefcase size={15} className="text-[#0d9f6f]" /> Professional Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Professional Title</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange}
                                        placeholder="e.g. Full Stack Developer, UI/UX Designer" className={inputClass} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Hourly Rate (USD)</label>
                                        <div className="relative">
                                            <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange}
                                                placeholder="25" className={`${inputClass} pl-10`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Availability</label>
                                        <div className="relative">
                                            <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select name="availability" value={formData.availability} onChange={handleChange}
                                                className={`${inputClass} pl-10 appearance-none cursor-pointer`}>
                                                {['Full-time', 'Part-time', 'Not available'].map(a => (
                                                    <option key={a} value={a}>{a}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Experience Level</label>
                                    <div className="flex gap-2">
                                        {['Entry', 'Intermediate', 'Expert'].map(level => (
                                            <button key={level} type="button"
                                                onClick={() => setFormData({ ...formData, experienceLevel: level })}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                    formData.experienceLevel === level
                                                        ? 'bg-[#0d9f6f] text-white border-[#0d9f6f]'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#0d9f6f]/30'
                                                }`}>
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className={sectionClass}>
                            <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Award size={15} className="text-[#0d9f6f]" /> Certifications
                            </h2>
                            <div className="space-y-3 mb-4">
                                {formData.certifications.map((cert, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-[#0d9f6f]/10 flex items-center justify-center flex-shrink-0">
                                            <Shield size={14} className="text-[#0d9f6f]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{cert.name}</p>
                                            <p className="text-xs text-gray-400">{cert.issuer} {cert.year ? `· ${cert.year}` : ''}</p>
                                            {cert.url && (
                                                <a href={cert.url} target="_blank" rel="noreferrer"
                                                    className="text-xs text-[#0d9f6f] flex items-center gap-1 mt-1 hover:underline">
                                                    <ExternalLink size={10} /> View credential
                                                </a>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeCert(i)}
                                            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <input placeholder="Certificate name *" value={newCert.name}
                                    onChange={e => setNewCert({ ...newCert, name: e.target.value })}
                                    className={inputClass} />
                                <input placeholder="Issuing organization *" value={newCert.issuer}
                                    onChange={e => setNewCert({ ...newCert, issuer: e.target.value })}
                                    className={inputClass} />
                                <input placeholder="Year" type="number" value={newCert.year}
                                    onChange={e => setNewCert({ ...newCert, year: e.target.value })}
                                    className={inputClass} />
                                <input placeholder="Credential URL" value={newCert.url}
                                    onChange={e => setNewCert({ ...newCert, url: e.target.value })}
                                    className={inputClass} />
                                <button type="button" onClick={addCert}
                                    className="sm:col-span-2 flex items-center justify-center gap-2 py-2.5 bg-[#0d9f6f]/10 text-[#0d9f6f] border border-[#0d9f6f]/20 rounded-xl text-sm font-semibold hover:bg-[#0d9f6f]/20 transition-colors">
                                    <Plus size={15} /> Add Certification
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── EXPERIENCE TAB ── */}
                {activeTab === 'experience' && isFreelancer && (
                    <div className={sectionClass}>
                        <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <TrendingUp size={15} className="text-[#0d9f6f]" /> Work Experience
                        </h2>
                        {/* Timeline */}
                        <div className="space-y-3 mb-5">
                            {formData.workExperience.map((exp, i) => (
                                <div key={i} className="relative flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-[#0d9f6f] flex items-center justify-center">
                                            <Briefcase size={13} color="white" />
                                        </div>
                                        {i < formData.workExperience.length - 1 && (
                                            <div className="w-px flex-1 bg-gray-200 mt-2" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{exp.role}</p>
                                                <p className="text-xs font-semibold text-[#0d9f6f]">{exp.company}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {exp.startYear} — {exp.current ? 'Present' : exp.endYear}
                                                </p>
                                            </div>
                                            <button type="button" onClick={() => removeWorkExp(i)}
                                                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {exp.description && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{exp.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Experience form */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Experience</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input placeholder="Company *" value={newExp.company}
                                    onChange={e => setNewExp({ ...newExp, company: e.target.value })} className={inputClass} />
                                <input placeholder="Role / Title *" value={newExp.role}
                                    onChange={e => setNewExp({ ...newExp, role: e.target.value })} className={inputClass} />
                                <input placeholder="Start Year *" type="number" value={newExp.startYear}
                                    onChange={e => setNewExp({ ...newExp, startYear: e.target.value })} className={inputClass} />
                                <div className="flex gap-2">
                                    <input placeholder="End Year" type="number" value={newExp.endYear} disabled={newExp.current}
                                        onChange={e => setNewExp({ ...newExp, endYear: e.target.value })}
                                        className={`${inputClass} flex-1 ${newExp.current ? 'opacity-50' : ''}`} />
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 cursor-pointer flex-shrink-0 px-2">
                                        <input type="checkbox" checked={newExp.current}
                                            onChange={e => setNewExp({ ...newExp, current: e.target.checked })}
                                            className="rounded accent-[#0d9f6f]" />
                                        Now
                                    </label>
                                </div>
                            </div>
                            <textarea placeholder="Description (optional)" value={newExp.description}
                                onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                                rows="2" className={`${inputClass} resize-none`} />
                            <button type="button" onClick={addWorkExp}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0d9f6f]/10 text-[#0d9f6f] border border-[#0d9f6f]/20 rounded-xl text-sm font-semibold hover:bg-[#0d9f6f]/20 transition-colors">
                                <Plus size={15} /> Add Experience
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PORTFOLIO TAB ── */}
                {activeTab === 'portfolio' && isFreelancer && (
                    <div className={sectionClass}>
                        <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <Globe size={15} className="text-[#0d9f6f]" /> Portfolio Projects
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                            {formData.portfolio.map((item, i) => (
                                <div key={i} className="relative p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#0d9f6f]/20 transition-colors group">
                                    <button type="button" onClick={() => removePortfolio(i)}
                                        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={13} />
                                    </button>
                                    <p className="text-sm font-bold text-gray-800 pr-6">{item.title}</p>
                                    {item.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                                    {item.url && (
                                        <a href={item.url} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-[#0d9f6f] mt-2 hover:underline">
                                            <ExternalLink size={10} /> View project
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Project</p>
                            <input placeholder="Project title *" value={newPortfolio.title}
                                onChange={e => setNewPortfolio({ ...newPortfolio, title: e.target.value })} className={inputClass} />
                            <textarea placeholder="Description" value={newPortfolio.description}
                                onChange={e => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                                rows="2" className={`${inputClass} resize-none`} />
                            <input placeholder="Project URL *" value={newPortfolio.url}
                                onChange={e => setNewPortfolio({ ...newPortfolio, url: e.target.value })} className={inputClass} />
                            <input placeholder="Image URL (optional)" value={newPortfolio.imageUrl}
                                onChange={e => setNewPortfolio({ ...newPortfolio, imageUrl: e.target.value })} className={inputClass} />
                            <button type="button" onClick={addPortfolio}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0d9f6f]/10 text-[#0d9f6f] border border-[#0d9f6f]/20 rounded-xl text-sm font-semibold hover:bg-[#0d9f6f]/20 transition-colors">
                                <Plus size={15} /> Add Project
                            </button>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <button type="submit" disabled={loading}
                    className="w-full bg-[#0d9f6f] hover:bg-[#0a8a5f] text-white py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#0d9f6f]/20">
                    {loading
                        ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        : <><Save size={17} /> Save Changes</>
                    }
                </button>
            </form>
        </div>
    );
}

export default Profile;