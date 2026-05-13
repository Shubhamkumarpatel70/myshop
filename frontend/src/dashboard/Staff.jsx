import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Plus, User, Mail, Phone, Lock, 
    CreditCard, ShieldCheck, Trash2, Search,
    ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        aadharNumber: '',
        role: 'cashier'
    });

    const [selectedStaffStats, setSelectedStaffStats] = useState(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get('/users/staff');
            setStaff(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch staff");
        } finally {
            setLoading(false);
        }
    };

    const handleViewStats = async (member) => {
        try {
            const res = await api.get(`/users/staff/${member._id}/stats`);
            setSelectedStaffStats({ ...res.data.data, member });
            setIsStatsModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch staff performance");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/staff', formData);
            toast.success("Staff added successfully");
            setIsModalOpen(false);
            setFormData({ ownerName: '', email: '', phone: '', password: '', aadharNumber: '', role: 'cashier' });
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add staff");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Staff Portal</h1>
                    <p className="text-secondary-500 font-medium">Manage your elite team and operational permissions.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary h-12 px-8"
                >
                    <Plus size={20} /> Hire New Staff
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-white dark:bg-secondary-900 rounded-3xl animate-pulse"></div>)
                ) : staff.map((member) => (
                    <motion.div 
                        key={member._id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-secondary-900 p-6 rounded-[2rem] shadow-xl border border-secondary-100 dark:border-secondary-800"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600">
                                <User size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{member.ownerName}</h3>
                                <p className="text-xs text-primary-600 font-bold uppercase tracking-widest">{member.role}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <Mail size={16} /> {member.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <Phone size={16} /> {member.phone}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <CreditCard size={16} /> Aadhar: {member.aadharNumber || 'N/A'}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleViewStats(member)}
                                className="flex-1 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl text-sm font-bold hover:bg-secondary-200 transition-colors"
                            >
                                View Performance
                            </button>
                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Stats Modal */}
            <Modal 
                isOpen={isStatsModalOpen} 
                onClose={() => setIsStatsModalOpen(false)} 
                title={`${selectedStaffStats?.member.ownerName}'s Performance`}
            >
                {selectedStaffStats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Sales</p>
                                <h4 className="text-2xl font-black">{selectedStaffStats.totalSales}</h4>
                            </div>
                            <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Total Revenue</p>
                                <h4 className="text-2xl font-black">₹{selectedStaffStats.totalRevenue.toLocaleString()}</h4>
                            </div>
                        </div>
                        
                        <div>
                            <h5 className="font-bold mb-4 flex items-center gap-2">
                                <ShoppingCart size={18} className="text-secondary-400" /> Recent Transactions
                            </h5>
                            <div className="space-y-3">
                                {selectedStaffStats.recentSales.length > 0 ? (
                                    selectedStaffStats.recentSales.map(sale => (
                                        <div key={sale._id} className="flex justify-between items-center p-3 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold">{sale.customerName}</p>
                                                <p className="text-[10px] text-secondary-500">{new Date(sale.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-bold text-emerald-600">₹{sale.totalAmount}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-secondary-500 text-center py-4">No sales recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Add New Staff"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
                            <input 
                                type="text" required className="input-field"
                                value={formData.ownerName}
                                onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Mobile Number</label>
                            <input 
                                type="tel" required className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Email Address</label>
                        <input 
                            type="email" required className="input-field"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Password</label>
                            <input 
                                type="password" required className="input-field"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Aadhar Number</label>
                            <input 
                                type="text" required className="input-field"
                                value={formData.aadharNumber}
                                onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">System Role</label>
                        <select 
                            required 
                            className="input-field appearance-none cursor-pointer"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="cashier">Cashier (Billing Only)</option>
                            <option value="manager">Manager (Inventory + Billing)</option>
                        </select>
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="btn btn-primary w-full py-4 text-lg font-bold">
                            Register Staff Member
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Staff;
