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
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { useToastStore } from '../../store/useToastStore';
import { useLanguage } from '../../context/LanguageContext';
import { ConcentricSpinner } from '../common/ConcentricSpinner';

import { useProductStore } from '../../store/useProductStore';
import { useServicesStore } from '../../store/useServicesStore';
import { useOrdersStore } from '../../store/useOrdersStore';

type CollectionName = 'products' | 'orders' | 'services' | 'serviceRequests' | 'repairs' | 'reviews' | 'users' | 'inquiries';

const collectionsList: { name: CollectionName; labelEn: string; labelSw: string; icon: string }[] = [
  { name: 'products', labelEn: 'Products', labelSw: 'Bidhaa', icon: '📦' },
  { name: 'orders', labelEn: 'Orders', labelSw: 'Oda za Wateja', icon: '🛍️' },
  { name: 'services', labelEn: 'Services', labelSw: 'Huduma za Solar', icon: '⚡' },
  { name: 'serviceRequests', labelEn: 'Service Requests', labelSw: 'Maombi ya Huduma', icon: '🛠️' },
  { name: 'repairs', labelEn: 'Repairs', labelSw: 'Matengenezo', icon: '🔧' },
  { name: 'reviews', labelEn: 'Reviews', labelSw: 'Maoni ya Wateja', icon: '⭐' },
  { name: 'users', labelEn: 'Users', labelSw: 'Akaunti za Watumiaji', icon: '👤' },
  { name: 'inquiries', labelEn: 'Inquiries', labelSw: 'Ujumbe wa Wateja', icon: '📬' },
];

export const FirebaseDataInspector: React.FC = () => {
  const { language } = useLanguage();
  const [selectedCollection, setSelectedCollection] = useState<CollectionName>('products');
  const [documents, setDocuments] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [inspectDoc, setInspectDoc] = useState<Record<string, any> | null>(null);
  const [deleteConfirmDocId, setDeleteConfirmDocId] = useState<string | null>(null);

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
          title: language === 'sw' ? 'Hitilafu ya Firestore' : 'Firestore Error',
          message:
            language === 'sw'
              ? `Imeshindwa kusoma mkusanyiko wa ${selectedCollection}: ${error.message}`
              : `Failed to load ${selectedCollection} collection: ${error.message}`,
          type: 'warning',
        });
      }
    );

    return () => unsubscribe();
  }, [selectedCollection, language]);

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
        title: language === 'sw' ? 'Data Imewasilishwa Firestore! 🔥' : 'Data Saved to Firestore! 🔥',
        message:
          language === 'sw'
            ? `Hati ${testId} imehifadhiwa kwenye mkusanyiko wa "${selectedCollection}".`
            : `Document ${testId} saved to "${selectedCollection}" collection.`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: language === 'sw' ? 'Hitilafu ya Kuhifadhi' : 'Save Error',
        message: err.message,
        type: 'warning',
      });
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDoc(doc(db, selectedCollection, docId));
      setDeleteConfirmDocId(null);
      showToast({
        title: language === 'sw' ? 'Hati Imefutwa Firestore! 🗑️' : 'Document Deleted! 🗑️',
        message:
          language === 'sw'
            ? `Hati "${docId}" imetolewa kikamilifu kwenye database.`
            : `Document "${docId}" removed successfully from Firestore.`,
        type: 'success',
      });
    } catch (err: any) {
      setDeleteConfirmDocId(null);
      showToast({
        title: language === 'sw' ? 'Hitilafu ya Kufuta' : 'Delete Error',
        message: err.message,
        type: 'warning',
      });
    }
  };

  const clearProducts = useProductStore((s) => s.clearAllProductsAndReviews);
  const clearServices = useServicesStore((s) => s.clearAllServicesAndRequests);
  const clearOrders = useOrdersStore((s) => s.clearAllOrders);

  const handleWipeAllData = async () => {
    const confirmMsg =
      language === 'sw'
        ? 'Je, una uhakika unataka kufuta DATA ZOTE za mfano ili uweke data zako halisi? Mabadiliko haya hayawezi kurudishwa.'
        : 'Are you sure you want to clear ALL sample data to enter your real data? This action cannot be undone.';

    if (!window.confirm(confirmMsg)) {
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
        title: language === 'sw' ? 'Data Zote Zimefutwa! 🗑️✨' : 'All Sample Data Cleared! 🗑️✨',
        message:
          language === 'sw'
            ? 'Mfumo sasa uko safi na tayari kwa wewe kuingiza data zako mpya halisi.'
            : 'Database cleared and ready for your fresh real data.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: language === 'sw' ? 'Hitilafu ya Kufuta Data' : 'Wipe Data Error',
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
                  {language === 'sw' ? 'Muunganiko wa Halisi' : 'Live Sync Active'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {language === 'sw'
                  ? 'Tazama, kagua, na uhakiki data za mradi wako zinavyoingia kwenye Firebase Firestore kwa wakati halisi.'
                  : 'View, inspect, and verify your project data synced in real-time with Firebase Firestore.'}
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
              {language === 'sw' ? 'Mikusaniko ya Firestore' : 'Firestore Collections'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWipeAllData}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title={
                language === 'sw'
                  ? 'Futa data zote za mfano ili uanze kuingiza zako mpya'
                  : 'Clear all sample data to enter your new data'
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'sw' ? 'Futa Data Zote za Mfano' : 'Clear All Sample Data'}</span>
            </button>

            <button
              onClick={handleAddTestDoc}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'sw' ? 'Jaribu Kuweka Hati' : 'Test Write Document'}</span>
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
            const label = language === 'sw' ? col.labelSw : col.labelEn;
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
                <span>{label}</span>
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
            placeholder={
              language === 'sw'
                ? `Tafuta ndani ya mkusanyiko wa ${selectedCollection}...`
                : `Search inside ${selectedCollection} collection...`
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <ConcentricSpinner
              size="lg"
              text={
                language === 'sw'
                  ? 'Inapakia data kutoka Firebase Firestore...'
                  : 'Loading data from Firebase Firestore...'
              }
              subtext={
                language === 'sw'
                  ? 'Inafanya uhakiki wa data halisi ⚡'
                  : 'Fetching live real-time documents ⚡'
              }
            />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
            <Database className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'sw'
                ? `Hakuna data kwenye mkusanyiko wa "${selectedCollection}"`
                : `No data inside "${selectedCollection}" collection`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'sw'
                ? 'Bonyeza "Jaribu Kuweka Hati" hapo juu au fanya miamala kwenye duka ili data iingie hapa mara moja.'
                : 'Click "Test Write Document" above or run shop transactions to see live records here.'}
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
                  <th className="p-3">{language === 'sw' ? 'Jina / Maelezo' : 'Name / Details'}</th>
                  <th className="p-3">{language === 'sw' ? 'Taarifa Muhimu' : 'Key Info'}</th>
                  <th className="p-3">{language === 'sw' ? 'Tarehe' : 'Timestamp'}</th>
                  <th className="p-3 text-right">{language === 'sw' ? 'Vitendo' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                {filteredDocs.map((docItem) => {
                  const title =
                    docItem.name ||
                    docItem.serviceName ||
                    docItem.customerName ||
                    docItem.title ||
                    docItem.email ||
                    'Document Record';
                  const extra = docItem.priceTzs
                    ? `TZS ${docItem.priceTzs.toLocaleString()}`
                    : docItem.status || docItem.role || docItem.requestNumber || '';
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
                            title={language === 'sw' ? 'Kagua JSON' : 'Inspect Raw JSON'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmDocId(docItem._docId)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 transition-colors"
                            title={language === 'sw' ? 'Futa Hati' : 'Delete Document'}
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
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {language === 'sw' ? 'Funga' : 'Close'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[400px]">
              <pre>{JSON.stringify(inspectDoc, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {language === 'sw' ? 'Uhakiki wa Kufuta Hati' : 'Confirm Document Deletion'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sw' ? 'Mkusanyiko' : 'Collection'}: <strong className="font-mono text-amber-600 dark:text-amber-400">{selectedCollection}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {language === 'sw'
                ? `Je, una uhakika unataka kufuta hati "${deleteConfirmDocId}"? Mabadiliko haya yataondoa record hii kutoka kwenye Firestore na hayawezi kurudishwa.`
                : `Are you sure you want to delete document "${deleteConfirmDocId}"? This will permanently remove this record from Firestore and cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmDocId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                {language === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteDoc(deleteConfirmDocId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-600/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'sw' ? 'Ndio, Futa Hati' : 'Yes, Delete Document'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

