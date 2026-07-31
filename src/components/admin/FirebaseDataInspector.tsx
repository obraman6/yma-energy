import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Search,
  Code,
  Table as TableIcon,
  CheckCircle2,
  Layers,
  FileJson,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  Zap,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { useToastStore } from '../../store/useToastStore';

import { useProductStore } from '../../store/useProductStore';
import { useServicesStore } from '../../store/useServicesStore';
import { useOrdersStore } from '../../store/useOrdersStore';

type CollectionName = 'products' | 'orders' | 'services' | 'serviceRequests' | 'repairs' | 'reviews' | 'users' | 'inquiries';

const collectionsList: { name: CollectionName; label: string; icon: string }[] = [
  { name: 'products', label: 'Products (Bidhaa)', icon: '📦' },
  { name: 'orders', label: 'Orders (Oda)', icon: '🛍️' },
  { name: 'services', label: 'Services (Huduma)', icon: '⚡' },
  { name: 'serviceRequests', label: 'Service Requests', icon: '🛠️' },
  { name: 'repairs', label: 'Repairs (Matengenezo)', icon: '🔧' },
  { name: 'reviews', label: 'Reviews (Maoni)', icon: '⭐' },
  { name: 'users', label: 'Users (Watumiaji)', icon: '👤' },
  { name: 'inquiries', label: 'Inquiries (Ujumbe wa Wateja)', icon: '📬' },
];

export const FirebaseDataInspector: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState<CollectionName>('products');
  const [documents, setDocuments] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [inspectDoc, setInspectDoc] = useState<Record<string, any> | null>(null);

  const showToast = useToastStore((s) => s.showToast);

  // Subscribe to real-time Firestore updates for the selected collection
  useEffect(() => {
    setIsLoading(true);
    const colRef = collection(db, selectedCollection);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docsData = snapshot.docs.map((docSnap) => ({
          _docId: docSnap.id,
          ...docSnap.data(),
        }));
        setDocuments(docsData);
        setIsLoading(false);
      },
      (error) => {
        console.error(`Error loading collection ${selectedCollection}:`, error);
        setIsLoading(false);
        showToast({
          title: 'Hitilafu ya Firestore',
          message: `Imeshindwa kusoma mkusanyiko wa ${selectedCollection}: ${error.message}`,
          type: 'warning',
        });
      }
    );

    return () => unsubscribe();
  }, [selectedCollection]);

  // Filter documents by search query
  const filteredDocs = documents.filter((d) => {
    if (!searchQuery.trim()) return true;
    const str = JSON.stringify(d).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  // Test adding a real document to Firebase
  const handleAddTestDoc = async () => {
    const testId = `test-${Date.now()}`;
    const testDoc = {
      _testTag: 'Real-Time Firebase Verification',
      id: testId,
      name: `Test Item ${new Date().toLocaleTimeString()}`,
      createdVia: 'YMA Energy Admin Data Inspector',
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, selectedCollection, testId), testDoc);
      showToast({
        title: 'Data Imewasilishwa Firestore! 🔥',
        message: `Hati ${testId} imehifadhiwa kwenye mkusanyiko wa "${selectedCollection}".`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Kuhifadhi',
        message: err.message,
        type: 'warning',
      });
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDoc(doc(db, selectedCollection, docId));
      showToast({
        title: 'Hati Imefutwa Firestore! 🗑️',
        message: `Hati ${docId} imetolewa kikamilifu kwenye database.`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Kufuta',
        message: err.message,
        type: 'warning',
      });
    }
  };

  const clearProducts = useProductStore((s) => s.clearAllProductsAndReviews);
  const clearServices = useServicesStore((s) => s.clearAllServicesAndRequests);
  const clearOrders = useOrdersStore((s) => s.clearAllOrders);

  const handleWipeAllData = async () => {
    if (
      !window.confirm(
        'Je, una uhakika unataka kufuta DATA ZOTE za mfano ili uweke data zako halisi? Mabadiliko haya hayawezi kurudishwa.'
      )
    ) {
      return;
    }

    try {
      await clearProducts();
      await clearServices();
      await clearOrders();

      // Wipe selected collection if any remaining
      for (const d of documents) {
        deleteDoc(doc(db, selectedCollection, d._docId)).catch(() => {});
      }

      showToast({
        title: 'Data Zote Zimefutwa! 🗑️✨',
        message: 'Mfumo sasa uko safi na tayari kwa wewe kuingiza data zako mpya halisi.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Kufuta Data',
        message: err.message,
        type: 'warning',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Firebase Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white shadow-xl border border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-amber-300">
                  Firebase Firestore Inspector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Tazama, kagua, na uhakiki data za mradi wako zinavyoingia kwenye Firebase Firestore kwa wakati halisi (Real-Time).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-white/10 font-mono">
            <div className="text-slate-400">Project ID:</div>
            <div className="font-bold text-amber-400">{firebaseConfig.projectId}</div>
            <div className="text-slate-600">|</div>
            <div className="text-slate-400">Database:</div>
            <div className="font-bold text-amber-300 truncate max-w-[150px]">
              {firebaseConfig.firestoreDatabaseId || '(default)'}
            </div>
          </div>
        </div>
      </div>

      {/* Collection Selector & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Firestore Collections
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWipeAllData}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Futa data zote za mfano ili uanze kuingiza zako mpya"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Futa Data Zote za Mfano (Clear All AI Data)</span>
            </button>

            <button
              onClick={handleAddTestDoc}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jaribu Kuweka Doc (Test Write)</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'json'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="JSON View"
              >
                <FileJson className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {collectionsList.map((col) => {
            const isActive = selectedCollection === col.name;
            return (
              <button
                key={col.name}
                onClick={() => {
                  setSelectedCollection(col.name);
                  setInspectDoc(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{col.icon}</span>
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tafuta ndani ya mkusanyiko wa ${selectedCollection}...`}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">Inapakia data kutoka Firebase...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
            <Database className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Hakuna data kwenye mkusanyiko wa "{selectedCollection}"
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bonyeza "Jaribu Kuweka Doc" hapo juu au fanya miamala kwenye duka ili data iingie hapa mara moja.
            </p>
          </div>
        ) : viewMode === 'json' ? (
          <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-[500px] border border-slate-800">
            <pre>{JSON.stringify(filteredDocs, null, 2)}</pre>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Doc ID</th>
                  <th className="p-3">Jina / Maelezo (Name)</th>
                  <th className="p-3">Taarifa Muhimu</th>
                  <th className="p-3">Tarehe (Timestamp)</th>
                  <th className="p-3 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                {filteredDocs.map((docItem) => {
                  const title = docItem.name || docItem.serviceName || docItem.customerName || docItem.title || docItem.email || 'Document Record';
                  const extra = docItem.priceTzs ? `TZS ${docItem.priceTzs.toLocaleString()}` : docItem.status || docItem.role || docItem.requestNumber || '';
                  const time = docItem.createdAt || docItem.timestamp || 'N/A';

                  return (
                    <tr key={docItem._docId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {docItem._docId}
                      </td>
                      <td className="p-3 font-bold">{title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {extra || 'Standard Record'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{time}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectDoc(docItem)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                            title="Inspect Raw JSON"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(docItem._docId)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Document Inspection Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Firestore Document: <span className="font-mono text-amber-500">{inspectDoc._docId}</span>
                </h4>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Funga (Close)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[400px]">
              <pre>{JSON.stringify(inspectDoc, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
