import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, X, CheckCircle2, Loader2, ChevronDown, Tag, MapPin, FileText } from 'lucide-react';
import { CATEGORIES, CATEGORY_FIELDS, REGIONS_DATA } from '../constants/data';
import { createAnimal, updateAnimal, uploadImages } from '../api/animals';
import { API_URL } from '../api/client';

const COLUMN_KEYS = ['breed', 'age', 'gender', 'weight', 'vaccinated'];

/** Select atrofidagi o'q belgisi (komponentdan tashqarida — remount bo'lmasligi uchun) */
const SelectWrap = ({ children }) => (
  <div className="relative">
    {children}
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
  </div>
);

/** Bo'lim sarlavhasi — och yashil doira ichida ikonka + matn */
const Section = ({ icon: Icon, title, hint }) => (
  <div className="flex items-center gap-2 mb-3.5">
    <span className="section-ic">
      <Icon size={14} />
    </span>
    <h3 className="text-[13px] font-bold text-brand">{title}</h3>
    {hint && <span className="ml-auto text-[11px] text-slate-400">{hint}</span>}
  </div>
);

/** To'liq URL ni bazada saqlanadigan nisbiy ko'rinishga qaytarish */
const toRelative = (u) => (u && u.startsWith(API_URL) ? u.slice(API_URL.length) : u);

let imgIdCounter = 0;

/**
 * E'lon berish / tahrirlash formasi.
 * Kategoriya tanlanganda unga xos maydonlar chiqadi
 * (masalan, qoramol uchun zoti/sut, yem-hashak uchun o'lchov birligi).
 */
export default function PostForm({ editItem, onCreated, onEditSaved, onCancelEdit, onGoHome, showToast }) {
  const isEdit = !!editItem;
  // App.jsx bu komponentni editItem bo'yicha key bilan render qiladi — editItem
  // o'zgarganda komponent qayta o'rnatiladi, shuning uchun boshlang'ich qiymatlar
  // to'g'ridan-to'g'ri propdan olinadi (effekt kerak emas).
  const [title, setTitle] = useState(editItem?.title || '');
  const [category, setCategory] = useState(editItem?.category || '');
  const [price, setPrice] = useState(editItem ? String(editItem.price ?? '') : '');
  const [region, setRegion] = useState(editItem?.region || '');
  const [district, setDistrict] = useState(editItem?.district || '');
  const [description, setDescription] = useState(editItem?.description || '');
  // kategoriyaga xos maydonlar qiymatlari
  const [dynamic, setDynamic] = useState(() => {
    if (!editItem) return {};
    const dyn = {};
    for (const key of COLUMN_KEYS) {
      if (editItem[key] !== null && editItem[key] !== undefined) dyn[key] = editItem[key];
    }
    if (editItem.attributes && typeof editItem.attributes === 'object') {
      Object.assign(dyn, editItem.attributes);
    }
    return dyn;
  });
  // {id, file?, url?, preview}
  const [images, setImages] = useState(() =>
    (editItem?.images || [])
      .filter((u) => u && !u.startsWith('data:'))
      .map((u) => ({ id: ++imgIdCounter, url: toRelative(u), preview: u }))
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const fields = useMemo(() => CATEGORY_FIELDS[category] || [], [category]);
  const districts = useMemo(() => REGIONS_DATA[region] || [], [region]);
  const CatIcon = useMemo(() => CATEGORIES.find((c) => c.id === category)?.icon, [category]);

  const setDynField = (key, value) => {
    setDynamic((prev) => ({ ...prev, [key]: value }));
  };

  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setImages((prev) => {
      const room = 8 - prev.length;
      const toAdd = files.slice(0, room).map((file) => ({
        id: ++imgIdCounter,
        file,
        preview: URL.createObjectURL(file),
      }));
      if (files.length > room) showToast(`Maksimal 8 ta rasm — ${files.length - room} tasi qo'shilmadi`, 'info');
      return [...prev, ...toAdd];
    });
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.file && target.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const validate = () => {
    const errs = {};
    if (!title.trim() || title.trim().length < 3) errs.title = "Sarlavha kamida 3 ta belgidan iborat bo'lsin";
    if (!category) errs.category = 'Kategoriyani tanlang';
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) errs.price = "To'g'ri narx kiriting";
    if (!region) errs.region = 'Viloyatni tanlang';
    if (region && districts.length && !district) errs.district = 'Tumanni tanlang';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) {
      showToast("Majburiy maydonlarni to'ldiring", 'error');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Yangi tanlangan rasmlarni yuklash
      const newFiles = images.filter((i) => i.file).map((i) => i.file);
      let uploadedUrls = [];
      if (newFiles.length) {
        const res = await uploadImages(newFiles);
        uploadedUrls = res.urls || [];
      }
      let uploadIdx = 0;
      const finalImages = images
        .map((i) => (i.file ? uploadedUrls[uploadIdx++] : i.url))
        .filter(Boolean);

      // 2. Dinamik maydonlarni ustun/attributes ga ajratish
      const columns = {};
      const attributes = {};
      for (const f of fields) {
        const val = dynamic[f.key];
        if (val === undefined || val === '' || val === null) continue;
        const parsed = f.type === 'number' ? Number(val) : val;
        if (f.target === 'column') columns[f.key] = parsed;
        else attributes[f.key] = parsed;
      }

      const payload = {
        title: title.trim(),
        category,
        price: Number(price),
        description: description.trim() || undefined,
        images: finalImages,
        region,
        district: district || undefined,
        ...columns,
        attributes: Object.keys(attributes).length ? attributes : undefined,
      };

      if (isEdit) {
        await updateAnimal(editItem.id, payload);
        showToast("E'lon muvaffaqiyatli yangilandi", 'success');
        onEditSaved?.();
      } else {
        await createAnimal(payload);
        setSuccess(true);
        onCreated?.();
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  function resetForm(revoke = true) {
    if (revoke) images.forEach((i) => i.file && i.preview && URL.revokeObjectURL(i.preview));
    setTitle('');
    setCategory('');
    setPrice('');
    setRegion('');
    setDistrict('');
    setDescription('');
    setDynamic({});
    setImages([]);
    setErrors({});
    setSuccess(false);
  }

  // ── Muvaffaqiyat ekrani ──
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-green/15 to-brand-green/5 border border-brand-green/30 flex items-center justify-center mb-5 shadow-lg shadow-brand-green/15"
        >
          <CheckCircle2 size={44} className="text-brand-green" />
        </motion.div>
        <h2 className="text-xl font-extrabold text-brand mb-2">E'lon joylandi! 🎉</h2>
        <p className="text-[13px] text-slate-500 mb-8 leading-relaxed max-w-xs">
          E'loningiz muvaffaqiyatli joylandi va endi barcha foydalanuvchilarga ko'rinadi.
        </p>
        <div className="flex gap-2.5 w-full max-w-sm">
          <button
            onClick={() => {
              resetForm();
              onGoHome?.();
            }}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-green to-brand-green-dark text-white font-bold text-sm transition-transform active:scale-[0.98] shadow-lg shadow-brand-green/25"
          >
            Bosh sahifaga
          </button>
          <button
            onClick={() => resetForm()}
            className="flex-1 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:border-brand-green/40 transition-colors active:scale-[0.98]"
          >
            Yana e'lon berish
          </button>
        </div>
      </div>
    );
  }

  const inputCls = (err) =>
    `w-full bg-white border ${err ? 'border-red-400' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 text-sm text-brand placeholder:text-slate-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all`;

  const selectCls = (err) =>
    `w-full appearance-none bg-white border ${err ? 'border-red-400' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 pr-9 text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all`;

  const labelCls = 'text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block';

  return (
    <div className="p-4 pb-6 space-y-4 w-full md:max-w-xl md:mx-auto">
      {/* Sarlavha */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-brand tracking-tight">
            {isEdit ? "E'lonni tahrirlash" : "Yangi e'lon berish"}
          </h2>
          <p className="text-[12px] text-slate-500 mt-1">
            {isEdit ? "Ma'lumotlarni yangilab, saqlang" : "Bir necha daqiqada e'loningizni joylang"}
          </p>
        </div>
        {isEdit && (
          <button
            onClick={onCancelEdit}
            className="shrink-0 text-xs text-slate-500 hover:text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Bekor qilish
          </button>
        )}
      </div>

      {/* ── Rasmlar ── */}
      <div className="surface-card p-4">
        <Section icon={ImagePlus} title="Rasmlar" hint="Maksimal 8 ta" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {images.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 gap-3 hover:border-brand-green/50 hover:bg-brand-green/[0.03] transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/15 to-brand-green/5 flex items-center justify-center">
              <ImagePlus size={28} className="text-brand-green-dark" />
            </div>
            <p className="text-sm font-semibold text-brand">Rasm yuklash uchun bosing</p>
            <p className="text-xs text-slate-500">JPG, PNG, WEBP — 10 MB gacha, maksimal 8 ta</p>
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ aspectRatio: '1' }}>
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-brand-green text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                    ASOSIY
                  </span>
                )}
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/90 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {images.length < 8 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-brand-green/50 hover:text-brand-green-dark hover:bg-brand-green/[0.03] transition-colors"
                style={{ aspectRatio: '1' }}
              >
                <ImagePlus size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Asosiy ma'lumot ── */}
      <div className="surface-card p-4 space-y-3.5">
        <Section icon={Tag} title="Asosiy ma'lumot" />

        {/* Sarlavha */}
        <div>
          <label className={labelCls}>
            Sarlavha <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            placeholder="Masalan: Golshtin zotli sog'in sigir"
            maxLength={200}
            className={inputCls(errors.title)}
          />
          {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Kategoriya va narx */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelCls}>
              Kategoriya <span className="text-red-500">*</span>
            </label>
            <SelectWrap>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setDynamic({});
                  clearError('category');
                }}
                className={`${selectCls(errors.category)} ${category ? 'text-brand' : 'text-slate-400'}`}
              >
                <option value="" disabled>
                  Tanlang
                </option>
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-brand">
                    {c.label}
                  </option>
                ))}
              </select>
            </SelectWrap>
            {errors.category && <p className="text-[11px] text-red-500 mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className={labelCls}>
              Narx (so'm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearError('price');
              }}
              placeholder="0"
              className={inputCls(errors.price)}
            />
            {errors.price && <p className="text-[11px] text-red-500 mt-1">{errors.price}</p>}
          </div>
        </div>
      </div>

      {/* ── Manzil ── */}
      <div className="surface-card p-4 space-y-3.5">
        <Section icon={MapPin} title="Manzil" />
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelCls}>
              Viloyat <span className="text-red-500">*</span>
            </label>
            <SelectWrap>
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setDistrict('');
                  clearError('region');
                }}
                className={`${selectCls(errors.region)} ${region ? 'text-brand' : 'text-slate-500'}`}
              >
                <option value="" disabled>
                  Tanlang
                </option>
                {Object.keys(REGIONS_DATA).map((r) => (
                  <option key={r} value={r} className="bg-white text-brand">
                    {r}
                  </option>
                ))}
              </select>
            </SelectWrap>
            {errors.region && <p className="text-[11px] text-red-500 mt-1">{errors.region}</p>}
          </div>
          <div>
            <label className={labelCls}>
              Tuman / shahar <span className="text-red-500">*</span>
            </label>
            <SelectWrap>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  clearError('district');
                }}
                disabled={!region}
                className={`${selectCls(errors.district)} ${district ? 'text-brand' : 'text-slate-500'} disabled:opacity-50`}
              >
                <option value="" disabled>
                  {region ? 'Tanlang' : 'Avval viloyat'}
                </option>
                {districts.map((d) => (
                  <option key={d} value={d} className="bg-white text-brand">
                    {d}
                  </option>
                ))}
              </select>
            </SelectWrap>
            {errors.district && <p className="text-[11px] text-red-500 mt-1">{errors.district}</p>}
          </div>
        </div>
      </div>

      {/* ── Kategoriyaga xos maydonlar ── */}
      {fields.length > 0 && (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card p-4"
        >
          <div className="flex items-center gap-2 mb-3.5">
            {CatIcon && (
              <span className="section-ic">
                <CatIcon size={14} />
              </span>
            )}
            <h3 className="text-[13px] font-bold text-brand">
              {CATEGORIES.find((c) => c.id === category)?.label} ma'lumotlari
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {fields
              .filter((f) => f.type !== 'toggle')
              .map((f) => (
                <div key={f.key} className={f.type === 'select' && f.options?.length > 6 ? 'col-span-2' : ''}>
                  <label className="text-[10px] font-medium text-slate-500 mb-1 block">{f.label}</label>
                  {f.type === 'select' ? (
                    <SelectWrap>
                      <select
                        value={dynamic[f.key] ?? ''}
                        onChange={(e) => setDynField(f.key, e.target.value)}
                        className={`${selectCls()} ${dynamic[f.key] ? 'text-brand' : 'text-slate-500'}`}
                      >
                        <option value="">Tanlang</option>
                        {f.options.map((opt) => (
                          <option key={opt} value={opt} className="bg-white text-brand">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </SelectWrap>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      inputMode={f.type === 'number' ? 'numeric' : undefined}
                      value={dynamic[f.key] ?? ''}
                      onChange={(e) => setDynField(f.key, e.target.value)}
                      placeholder={f.placeholder || ''}
                      className={inputCls()}
                    />
                  )}
                </div>
              ))}
          </div>
          <div className="space-y-2.5 mt-2.5">
            {fields
              .filter((f) => f.type === 'toggle')
              .map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDynField(f.key, !dynamic[f.key])}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${
                    dynamic[f.key]
                      ? 'bg-brand-green/10 border-brand-green/40 text-brand-green-dark'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="text-sm font-medium">{f.label}</span>
                  <span
                    className={`w-10 rounded-full p-0.5 transition-colors ${dynamic[f.key] ? 'bg-brand-green' : 'bg-slate-200'}`}
                    style={{ height: 22 }}
                  >
                    <span
                      className="block w-[18px] h-[18px] rounded-full bg-white transition-transform"
                      style={{ transform: dynamic[f.key] ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </span>
                </button>
              ))}
          </div>
        </motion.div>
      )}

      {/* ── Tavsif ── */}
      <div className="surface-card p-4">
        <Section icon={FileText} title="Tavsif" hint="Ixtiyoriy" />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Hayvon holati, emlashlar, sotish sababi..."
          rows={4}
          maxLength={2000}
          className={`${inputCls()} resize-none`}
        />
      </div>

      {/* ── Yuborish ── */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-green to-brand-green-dark disabled:opacity-60 text-white font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-brand-green/25"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {images.some((i) => i.file) ? 'Rasmlar yuklanmoqda...' : 'Saqlanmoqda...'}
          </>
        ) : isEdit ? (
          'Saqlash'
        ) : (
          "E'lonni joylash"
        )}
      </button>
    </div>
  );
}
