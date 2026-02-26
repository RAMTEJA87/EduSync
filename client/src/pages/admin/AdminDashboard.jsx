import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/common/GlassCard';
import { Database, ShieldCheck, Settings, LogOut, X, Plus, Trash2, Edit2, Users, Layers, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('HIERARCHY');

    // Hierarchy State
    const [structures, setStructures] = useState([]);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [editStructureId, setEditStructureId] = useState(null);
    const [year, setYear] = useState('');
    const [branch, setBranch] = useState('');
    const [section, setSection] = useState('');

    // Users State
    const [users, setUsers] = useState([]);
    const [userRoleFilter, setUserRoleFilter] = useState('STUDENT');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [uName, setUName] = useState('');
    const [uEmail, setUEmail] = useState('');
    const [uPassword, setUPassword] = useState('');
    const [uRole, setURole] = useState('STUDENT');
    const [uContextId, setUContextId] = useState('');

    // Delete Confirmation State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '', text: '' });

    // Section-wise Students State
    const [viewStudentsModal, setViewStudentsModal] = useState({ isOpen: false, structure: null });

    useEffect(() => {
        if (activeTab === 'HIERARCHY') fetchStructures();
        if (activeTab === 'USERS') fetchUsers();
    }, [activeTab, userRoleFilter]);

    // ==========================================
    // Hierarchy Logic
    // ==========================================
    const fetchStructures = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/academic', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setStructures(data);
        } catch (error) { console.error('Error fetching structures:', error); }
    };

    const handleSaveStructure = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editStructureId ? `/api/admin/academic/${editStructureId}` : '/api/admin/academic';
        const method = editStructureId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ year, branch, section })
            });
            const data = await res.json();
            if (res.ok) {
                fetchStructures();
                closeStructureModal();
            } else {
                alert(data.message || 'Failed to save structure');
            }
        } catch (error) { console.error('Submission error:', error); }
    };

    const handleDeleteStructure = (id) => {
        setDeleteModal({
            isOpen: true,
            type: 'STRUCTURE',
            id,
            title: 'Delete Branch Node?',
            text: 'This will irreversibly shred the node and instantly unassign all enrolled students to mitigate data corruption. Proceed?'
        });
    };

    const confirmDeleteStructure = async (id) => {
        setStructures(prev => prev.filter(s => s._id !== id));
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/academic/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'Failed to delete structure');
                fetchStructures();
            }
        } catch (error) {
            console.error(error);
            fetchStructures();
        }
    };

    const openStructureModal = (structure = null) => {
        if (structure) {
            setEditStructureId(structure._id);
            setYear(structure.year);
            setBranch(structure.branch);
            setSection(structure.section);
        } else {
            setEditStructureId(null);
            setYear('');
            setBranch('');
            setSection('');
        }
        setIsStructureModalOpen(true);
    };

    const closeStructureModal = () => setIsStructureModalOpen(false);

    // ==========================================
    // Users Logic
    // ==========================================
    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users?role=${userRoleFilter}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setUsers(data);

            // Need structures for the user edit dropdown
            if (structures.length === 0) fetchStructures();
        } catch (error) { console.error('Error fetching users:', error); }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const reqBody = { name: uName, email: uEmail, role: uRole };
            if (uRole === 'STUDENT' && uContextId !== '') reqBody.academicContextId = uContextId;
            else if (uRole !== 'STUDENT') reqBody.academicContextId = null;

            if (!editUserId && uPassword) reqBody.password = uPassword;

            const url = editUserId ? `/api/admin/users/${editUserId}` : '/api/admin/users';
            const method = editUserId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(reqBody)
            });

            if (res.ok) {
                fetchUsers();
                fetchStructures(); // Update structure counts
                setIsUserModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to save user');
            }
        } catch (error) { console.error(error) }
    };

    const handleDeleteUser = (id) => {
        setDeleteModal({
            isOpen: true,
            type: 'USER',
            id,
            title: 'Delete User Profile?',
            text: 'This action cannot be undone. System records mapped to this user will be entirely purged.'
        });
    };

    const confirmDeleteUser = async (id) => {
        setUsers(prev => prev.filter(u => u._id !== id));
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'Failed to delete user');
                fetchUsers();
            } else {
                fetchStructures(); // Also update structures optimistically 
            }
        } catch (error) {
            console.error(error);
            fetchUsers();
        }
    };

    const openUserModal = (user = null) => {
        if (user) {
            setEditUserId(user._id);
            setUName(user.name);
            setUEmail(user.email);
            setUPassword('');
            setURole(user.role);
            setUContextId(user.academicContext ? user.academicContext._id : '');
        } else {
            setEditUserId(null);
            setUName('');
            setUEmail('');
            setUPassword('');
            setURole(userRoleFilter !== 'ADMIN' ? userRoleFilter : 'STUDENT');
            setUContextId('');
        }
        setIsUserModalOpen(true);
    };

    const handleEditStudentFromModal = (student, structure) => {
        setViewStudentsModal({ isOpen: false, structure: null });
        openUserModal({
            ...student,
            role: 'STUDENT',
            academicContext: structure
        });
    };

    const handleDeleteStudentFromModal = (studentId) => {
        setViewStudentsModal({ isOpen: false, structure: null });
        handleDeleteUser(studentId);
    };

    // ==========================================
    // Delete Confirmation Logic
    // ==========================================
    const executeDelete = () => {
        if (deleteModal.type === 'STRUCTURE') confirmDeleteStructure(deleteModal.id);
        if (deleteModal.type === 'USER') confirmDeleteUser(deleteModal.id);
        setDeleteModal({ isOpen: false, type: null, id: null, title: '', text: '' });
    };

    // ==========================================
    // Render Functions
    // ==========================================
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen relative">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-outfit font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-green-400" />
                        System Administration
                    </h1>
                    <p className="text-slate-400">Manage academic hierarchy and holistic system data</p>
                </div>
                <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all font-medium text-sm border border-red-500/20">
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <GlassCard delay={0.1} className="col-span-1 lg:col-span-1">
                    <div className="flex flex-col gap-2 bg-black/20 p-4 border border-white/5 rounded-xl">
                        <button
                            onClick={() => setActiveTab('HIERARCHY')}
                            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${activeTab === 'HIERARCHY' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Layers className="w-5 h-5" />
                            <span className="font-semibold">Academic Hierarchy</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('USERS')}
                            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${activeTab === 'USERS' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-semibold">User Directory</span>
                        </button>
                    </div>
                </GlassCard>

                <div className="col-span-1 lg:col-span-3">
                    {activeTab === 'HIERARCHY' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                            <GlassCard className="w-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold font-outfit text-white">Hierarchy Configurations</h3>
                                    <button onClick={() => openStructureModal()} className="cyber-button !py-2 !px-4 !text-sm flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Branch Node
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400 text-sm">
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider">Year</th>
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider">Branch</th>
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider">Section</th>
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider">Student Count</th>
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {structures.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="py-8 text-center text-slate-500">
                                                        No academic structures found. Create a new branch node.
                                                    </td>
                                                </tr>
                                            ) : structures.map((row) => (
                                                <tr key={row._id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 px-4 font-medium text-slate-300">Year {row.year}</td>
                                                    <td className="py-3 px-4 text-emerald-300 font-medium">{row.branch}</td>
                                                    <td className="py-3 px-4">Sec {row.section}</td>
                                                    <td className="py-3 px-4 font-mono text-slate-400">{row.students?.length || 0}</td>
                                                    <td className="py-3 px-4 text-right flex items-center justify-end gap-3">
                                                        <button onClick={() => setViewStudentsModal({ isOpen: true, structure: row })} className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 bg-indigo-500/10 rounded-md" title="View Enrolled Students">
                                                            <Users className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => openStructureModal(row)} className="text-blue-400 hover:text-blue-300 transition-colors p-1 bg-blue-500/10 rounded-md">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteStructure(row._id)} className="text-red-400 hover:text-red-300 transition-colors p-1 bg-red-500/10 rounded-md">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {activeTab === 'USERS' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                            <GlassCard className="w-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold font-outfit text-white">System Users</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-2 p-1 bg-black/20 rounded-xl backdrop-blur-md">
                                            {['STUDENT', 'TEACHER'].map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => setUserRoleFilter(r)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${userRoleFilter === r ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {r === 'TEACHER' ? 'FACULTY' : r}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => openUserModal()} className="cyber-button !py-2 !px-4 !text-sm flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Add User
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400 text-sm">
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider">Name & Email</th>
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider">Role</th>
                                                {userRoleFilter === 'STUDENT' && <th className="py-3 px-4 font-medium uppercase tracking-wider">Class Context</th>}
                                                <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="py-8 text-center text-slate-500">
                                                        No {userRoleFilter.toLowerCase()}s found.
                                                    </td>
                                                </tr>
                                            ) : users.map((user) => (
                                                <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-slate-200">{user.name}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-1 rounded-md font-semibold ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' : user.role === 'TEACHER' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                            {user.role === 'TEACHER' ? 'FACULTY' : user.role}
                                                        </span>
                                                    </td>
                                                    {userRoleFilter === 'STUDENT' && (
                                                        <td className="py-3 px-4 text-sm text-slate-400">
                                                            {user.academicContext ? `Y${user.academicContext.year} • ${user.academicContext.branch} • Sec ${user.academicContext.section}` : <span className="text-yellow-500/70">Unassigned</span>}
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                                                        <button onClick={() => openUserModal(user)} className="text-blue-400 hover:text-blue-300 transition-colors p-1 bg-blue-500/10 rounded-md">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(user._id)} className="text-red-400 hover:text-red-300 transition-colors p-1 bg-red-500/10 rounded-md">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Structure Modal */}
            <AnimatePresence>
                {isStructureModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeStructureModal} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md">
                            <GlassCard className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">{editStructureId ? 'Edit' : 'Add'} Academic Node</h3>
                                    <button onClick={closeStructureModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleSaveStructure} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Year</label>
                                        <input type="text" placeholder="e.g. 2" required value={year} onChange={e => setYear(e.target.value)} className="glass-input !pl-4 w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Branch Name</label>
                                        <input type="text" placeholder="e.g. Computer Science" required value={branch} onChange={e => setBranch(e.target.value)} className="glass-input !pl-4 w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Section</label>
                                        <input type="text" placeholder="e.g. A" required value={section} onChange={e => setSection(e.target.value)} className="glass-input !pl-4 w-full" />
                                    </div>
                                    <button type="submit" className="cyber-button w-full mt-4">Save Configuration</button>
                                </form>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* User Edit Modal */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md">
                            <GlassCard className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">{editUserId ? 'Edit' : 'Create'} User Profile</h3>
                                    <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleSaveUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                                        <input type="text" required value={uName} onChange={e => setUName(e.target.value)} className="glass-input !pl-4 w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Email</label>
                                        <input type="email" required value={uEmail} onChange={e => setUEmail(e.target.value)} className="glass-input !pl-4 w-full" />
                                    </div>
                                    {!editUserId && (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Set Initial Password</label>
                                            <input type="text" required value={uPassword} onChange={e => setUPassword(e.target.value)} placeholder="Minimum 6 characters" className="glass-input !pl-4 w-full" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Role</label>
                                        <select value={uRole} onChange={e => setURole(e.target.value)} className="glass-input !pl-4 w-full appearance-none">
                                            <option value="STUDENT">Student</option>
                                            <option value="TEACHER">Faculty</option>
                                        </select>
                                    </div>

                                    {uRole === 'STUDENT' && (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Academic Context</label>
                                            <select value={uContextId} onChange={e => setUContextId(e.target.value)} className="glass-input !pl-4 w-full appearance-none text-sm">
                                                <option value="">Unassigned</option>
                                                {structures.map(s => (
                                                    <option key={s._id} value={s._id}>Year {s.year} - {s.branch} - Sec {s.section}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <button type="submit" className="cyber-button w-full mt-4">Update Details</button>
                                </form>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm">
                            <GlassCard className="p-6 text-center border-red-500/20">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{deleteModal.title}</h3>
                                <p className="text-slate-400 text-sm mb-6">{deleteModal.text}</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/5">Cancel</button>
                                    <button onClick={executeDelete} className="flex-1 py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 font-medium transition-colors">Delete</button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Section-wise Students Modal */}
            <AnimatePresence>
                {viewStudentsModal.isOpen && viewStudentsModal.structure && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewStudentsModal({ isOpen: false, structure: null })} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl">
                            <GlassCard className="p-6 max-h-[80vh] flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-400" />
                                            Enrolled Students
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Year {viewStudentsModal.structure.year} • {viewStudentsModal.structure.branch} • Sec {viewStudentsModal.structure.section}
                                        </p>
                                    </div>
                                    <button onClick={() => setViewStudentsModal({ isOpen: false, structure: null })} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '60vh' }}>
                                    {viewStudentsModal.structure.students && viewStudentsModal.structure.students.length > 0 ? (
                                        <div className="space-y-3">
                                            {viewStudentsModal.structure.students.map(student => (
                                                <div key={student._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div>
                                                        <div className="font-semibold text-white">{student.name}</div>
                                                        <div className="text-xs text-slate-400">{student.email}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-xs font-mono px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/20 hidden sm:block">
                                                            Roll #: {student.rollNumber || 'Not Set'}
                                                        </div>
                                                        <button onClick={() => handleEditStudentFromModal(student, viewStudentsModal.structure)} className="text-blue-400 hover:text-blue-300 transition-colors p-1.5 bg-blue-500/10 rounded-md cursor-pointer">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteStudentFromModal(student._id)} className="text-red-400 hover:text-red-300 transition-colors p-1.5 bg-red-500/10 rounded-md cursor-pointer">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No students enrolled in this section yet.</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
