import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Layers, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Categories = () => {
    const { searchQuery } = useOutletContext() || { searchQuery: '' };
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (searchQuery !== undefined) setSearchTerm(searchQuery);
    }, [searchQuery]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, description: category.description || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory._id}`, formData);
                toast.success("Category updated");
            } else {
                await api.post('/categories', formData);
                toast.success("Category added");
            }
            fetchCategories();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this category? This might affect products using it.")) {
            try {
                await api.delete(`/categories/${id}`);
                toast.success("Category deleted");
                fetchCategories();
            } catch (error) {
                toast.error("Failed to delete category");
            }
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase dark:text-white">Categories</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Organize products for faster inventory and billing workflows.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="h-12 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-700"
                >
                    <span className="inline-flex items-center gap-2"><Plus size={18} /> Add Category</span>
                </button>
            </div>

            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search categories..." 
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-secondary-200 dark:bg-secondary-800 rounded-2xl animate-pulse"></div>)
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <motion.div
                            key={category._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card group hover:border-indigo-500/50 transition-all p-8 rounded-[2.5rem]"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                                    <Layers size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(category)}
                                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-indigo-600 rounded-xl shadow-sm hover:scale-110 transition-all"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(category._id)}
                                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-rose-600 rounded-xl shadow-sm hover:scale-110 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
                            <p className="text-sm font-medium text-slate-500 line-clamp-2">
                                {category.description || 'No specialized description provided.'}
                            </p>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-500 dark:text-slate-400">
                        No categories found. Create one to get started!
                    </div>
                )}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Category Name</label>
                        <input 
                            type="text" 
                            required
                            className="input-field" 
                            placeholder="e.g. Beverages, Electronics"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Description</label>
                        <textarea 
                            className="input-field h-24"
                            placeholder="Describe this category..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary px-8">
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Categories;
