import React, { useState } from 'react';
import api from '../utils/api';
import { 
    Search, ShoppingBag, Calendar, User, 
    Hash, IndianRupee, Download, CheckCircle2,
    ArrowRight, Store, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReceiptLookup = () => {
    const [txId, setTxId] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!txId) return;
        setLoading(true);
        setReceipt(null);
        try {
            const res = await api.get(`/sales/public/${txId}`);
            setReceipt(res.data.data);
            toast.success("Receipt found!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid Transaction ID");
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        if (!receipt) return;
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            
            // Subtle Watermark
            doc.setTextColor(240, 240, 240);
            doc.setFontSize(60);
            doc.text("PAID RECEIPT", 40, 150, { angle: 45 });
            
            // Accent Header Bar
            doc.setFillColor(79, 70, 229);
            doc.rect(0, 0, pageWidth, 15, 'F');
            
            // Header: Shop Name & Tax Invoice Label
            doc.setFontSize(24);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text(receipt.user.shopName || 'StockSaathi Merchant', 20, 35);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text("DIGITAL TAX INVOICE", 190, 35, { align: 'right' });
            
            // Divider
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 42, 190, 42);
            
            // Info Grid (Bill From & Bill To)
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text("BILL FROM", 20, 52);
            doc.text("BILL TO", 120, 52);
            
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text(receipt.user.shopName, 20, 58);
            doc.text(receipt.customerName || 'Walking Customer', 120, 58);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            const shopAddress = doc.splitTextToSize(receipt.user.address || 'Address not provided', 60);
            doc.text(shopAddress, 20, 64);
            doc.text(`Phone: ${receipt.user.phone}`, 20, 64 + (shopAddress.length * 5));
            
            doc.text(`Contact: ${receipt.customerPhone || 'N/A'}`, 120, 64);
            
            // Right Side Meta Data
            doc.setFillColor(248, 250, 252);
            doc.rect(120, 75, 70, 25, 'F');
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("INVOICE NO:", 125, 82);
            doc.text("DATE:", 125, 88);
            doc.text("PAYMENT:", 125, 94);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0);
            doc.text(`#${receipt.transactionId}`, 155, 82);
            doc.text(new Date(receipt.createdAt).toLocaleDateString(), 155, 88);
            doc.text(receipt.paymentMethod, 155, 94);
            
            // Table
            const tableData = receipt.items.map((item, index) => [
                index + 1,
                item.product?.productName || 'Product',
                item.quantity,
                `Rs. ${item.price.toLocaleString()}`,
                `Rs. ${item.total.toLocaleString()}`
            ]);
            
            autoTable(doc, {
                startY: 110,
                head: [['#', 'Item Description', 'Qty', 'Rate', 'Amount']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], fontSize: 9, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 30, halign: 'right' },
                    4: { cellWidth: 30, halign: 'right' }
                },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });
            
            const finalY = doc.lastAutoTable.finalY || 180;
            
            // Calculation Block
            doc.setFillColor(248, 250, 252);
            doc.rect(130, finalY + 5, 60, 25, 'F');
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Total Units:", 135, finalY + 12);
            doc.text(receipt.items.reduce((acc, item) => acc + item.quantity, 0).toString(), 185, finalY + 12, { align: 'right' });
            
            doc.setFontSize(12);
            doc.setTextColor(79, 70, 229);
            doc.setFont("helvetica", "bold");
            doc.text("GRAND TOTAL:", 135, finalY + 22);
            doc.text(`Rs. ${receipt.totalAmount.toLocaleString()}`, 185, finalY + 22, { align: 'right' });
            
            // Terms and Footer
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.setFont("helvetica", "normal");
            doc.text("Terms & Conditions:", 20, finalY + 40);
            doc.text("1. Items once sold cannot be returned or exchanged.", 20, finalY + 45);
            doc.text("2. This is a computer generated digital invoice and does not require a physical signature.", 20, finalY + 50);
            
            doc.setDrawColor(241, 245, 249);
            doc.line(20, 275, 190, 275);
            doc.setFontSize(8);
            doc.text("Generated via StockSaathi Retail OS - www.stocksaathi.com", pageWidth / 2, 282, { align: 'center' });
            
            doc.save(`Invoice_${receipt.transactionId}.pdf`);
            toast.success("Professional Invoice Generated!");
        } catch (pdfError) {
            console.error("PDF GENERATION ERROR:", pdfError);
            toast.error("Invoice generation failed.");
        }
    };

    return (
        <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4"
                    >
                        <CheckCircle2 size={14} /> Digital Verification
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        My <span className="text-indigo-600">Shopping</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Enter your transaction ID to verify and download your digital receipt.</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 mb-10"
                >
                    <form onSubmit={handleLookup} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Enter Transaction ID (e.g. ABC12345)"
                                className="w-full h-16 pl-16 pr-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black uppercase tracking-widest text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={txId}
                                onChange={(e) => setTxId(e.target.value)}
                            />
                        </div>
                        <button 
                            disabled={loading}
                            className="h-16 px-10 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Verify Receipt <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>
                </motion.div>

                <AnimatePresence>
                    {receipt && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="bg-indigo-600 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                        <Store size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase">{receipt.user.shopName}</h2>
                                        <div className="flex items-center gap-4 mt-1 opacity-80">
                                            <div className="flex items-center gap-1 text-[10px] font-bold">
                                                <MapPin size={12} /> {receipt.user.address || 'Verified Merchant'}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold">
                                                <Phone size={12} /> {receipt.user.phone}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={downloadPDF}
                                    className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                            </div>

                            <div className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction ID</p>
                                        <p className="font-black text-lg">#{receipt.transactionId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Billing Date</p>
                                        <p className="font-black text-lg">{new Date(receipt.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer</p>
                                        <p className="font-black text-lg">{receipt.customerName || 'Walking Customer'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order Items</h4>
                                    <div className="space-y-3">
                                        {receipt.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-700 shadow-sm font-black text-xs">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm uppercase tracking-tight">{item.product?.productName || 'Product'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.quantity} Unit(s) × ₹{item.price}</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-sm">₹{item.total.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-right space-y-2">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grand Total</p>
                                        <div className="flex items-center justify-end gap-2 text-4xl font-black text-indigo-600">
                                            <IndianRupee size={32} />
                                            {receipt.totalAmount.toLocaleString()}
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Paid via {receipt.paymentMethod}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReceiptLookup;
