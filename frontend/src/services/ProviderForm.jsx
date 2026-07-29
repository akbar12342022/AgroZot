import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Camera, CheckCircle2, Send, Trash2 } from 'lucide-react';
import { REGIONS_DATA } from '../constants/data';
import {
  SERVICE_TYPES,
  TRANSPORT_TYPES,
  CAPACITY_UNITS,
  PRICING_TYPES,
  BUTCHER_ANIMALS,
  FEED_KINDS,
  FEED_UNITS,
} from './servicesData';

/** Telefonni yozish paytida formatlash: +998 90 123 45 67 (RegisterScreen bilan bir xil) */
function formatPhoneInput(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  let out = '+998';
  if (digits.length > 0) out += ' ' + digits.slice(0, 2);
  if (digits.length > 2) out += ' ' + digits.slice(2, 5);
  if (digits.length > 5) out += ' ' + digits.slice(5, 7);
  if (digits.length > 7) out += ' ' + digits.slice(7, 9);
  return out;
}

// ─── Kichik forma bo'laklari (bir xil Tailwind uslubi) ───

const inputCls =
  'w-full bg-white border rounded-xl px-3.5 py-3 text-sm text-brand placeholder:text-slate-400 focus:outline-none transition-colors';
const okBorder = 'border-slate-200 focus:border-brand-green';
const errBorder = 'border-red-400 focus:border-red-500';

function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, error }) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} appearance-none pr-9 ${error ? errBorder : okBorder} ${
            value ? '' : 'text-slate-400'
          }`}
        >
          <option value="" disabled>
            {placeholder || 'Tanlang'}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-brand">
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    </Field>
  );
}

function RadioYesNo({ label, value, onChange, error }) {
  return (
    <Field label={label} error={error}>
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: true, t: 'Ha' },
          { v: false, t: "Yo'q" },
        ].map(({ v, t }) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(v)}
            className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              value === v
                ? 'border-brand-green bg-brand-green/10 text-brand-green-dark'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </Field>
  );
}

function CheckGroup({ label, options, values, onToggle, error }) {
  return (
    <Field label={label} error={error}>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`py-2.5 px-3 rounded-xl border text-[13px] font-semibold transition-all flex items-center gap-2 ${
                on
                  ? 'border-brand-green bg-brand-green/10 text-brand-green-dark'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  on ? 'bg-brand-green border-brand-green text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {on && <CheckCircle2 size={11} />}
              </span>
              <span className="truncate">{o}</span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function PhotoUpload({ label, hint, preview, onPick, onClear }) {
  const ref = useRef(null);
  return (
    <Field label={label}>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(URL.createObjectURL(f));
          e.target.value = '';
        }}
      />
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="" className="h-24 rounded-xl border border-slate-200 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full py-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-green/60 text-slate-500 hover:text-brand-green-dark flex flex-col items-center gap-1.5 transition-colors bg-white"
        >
          <Camera size={20} />
          <span className="text-xs font-semibold">{hint || 'Rasm yuklash (ixtiyoriy)'}</span>
        </button>
      )}
    </Field>
  );
}

// ─── Asosiy forma ───

const EMPTY = {
  region: '',
  district: '',
  phone: '',
  note: '',
  photo: null,
  // transport
  transport: '',
  capacity: '',
  capacityUnit: 'tonna',
  pricing: '',
  // butcher
  animals: [],
  experience: '',
  price: '',
  events: null,
  // feed
  feedKind: '',
  amount: '',
  unit: 'kg',
  delivery: null,
};

/**
 * "Xizmat ko'rsatuvchi bo'lish" arizasi — pastdan chiqadigan to'liq modal.
 * Avval yo'nalish tanlanadi (Qassob / Yuk tashish / Ozuqa), so'ng faqat shu
 * yo'nalishga tegishli maydonlar ochiladi. Yuborilgach onSubmit(provider) chaqiriladi.
 */
export default function ProviderForm({ open, onClose, onSubmit, userName, initialType = null }) {
  const [type, setType] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  // Profildagi xizmat kartochkasidan ochilganda yo'nalish oldindan tanlangan keladi
  useEffect(() => {
    if (open && initialType) setType(initialType);
  }, [open, initialType]);

  const set = (k, v) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const districts = useMemo(() => (f.region ? REGIONS_DATA[f.region] || [] : []), [f.region]);

  const reset = () => {
    setType(null);
    setF(EMPTY);
    setErrors({});
    setDone(false);
  };

  const close = () => {
    onClose();
    // Yopilish animatsiyasi tugagach tozalash
    setTimeout(reset, 350);
  };

  const validate = () => {
    const e = {};
    if (!f.region) e.region = 'Viloyatni tanlang';
    if (!f.district) e.district = 'Tumanni tanlang';
    if (f.phone.replace(/\D/g, '').length !== 12) e.phone = "To'liq telefon raqam kiriting";

    if (type === 'transport') {
      if (!f.transport) e.transport = 'Transport turini tanlang';
      if (!f.capacity || Number(f.capacity) <= 0) e.capacity = "Yuk hajmini kiriting";
      if (!f.pricing) e.pricing = 'Narxlash turini tanlang';
    }
    if (type === 'butcher') {
      if (!f.animals.length) e.animals = 'Kamida bitta hayvon turini belgilang';
      if (f.experience === '' || Number(f.experience) < 0) e.experience = 'Ish tajribasini kiriting';
      if (!f.price || Number(f.price) <= 0) e.price = 'Xizmat narxini kiriting';
      if (f.events === null) e.events = 'Javobni tanlang';
    }
    if (type === 'feed') {
      if (!f.feedKind) e.feedKind = 'Ozuqa turini tanlang';
      if (!f.amount || Number(f.amount) <= 0) e.amount = 'Miqdorini kiriting';
      if (!f.price || Number(f.price) <= 0) e.price = 'Narxini kiriting';
      if (f.delivery === null) e.delivery = 'Javobni tanlang';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const base = {
      id: 'u' + Date.now(),
      type,
      name: userName || 'Foydalanuvchi',
      region: f.region,
      district: f.district,
      phone: '+' + f.phone.replace(/\D/g, ''),
      note: f.note.trim(),
      photo: f.photo,
    };
    let extra = {};
    if (type === 'transport') {
      extra = {
        transport: f.transport,
        capacity: Number(f.capacity),
        capacityUnit: f.capacityUnit,
        pricing: f.pricing,
      };
    } else if (type === 'butcher') {
      extra = {
        animals: f.animals,
        experience: Number(f.experience),
        price: Number(f.price),
        events: f.events,
      };
    } else if (type === 'feed') {
      extra = {
        feedKind: f.feedKind,
        amount: Number(f.amount),
        unit: f.unit,
        price: Number(f.price),
        delivery: f.delivery,
      };
    }
    onSubmit({ ...base, ...extra });
    setDone(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[170] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-lg max-h-[92dvh] overflow-y-auto scrollbar-hide bg-brand-bg rounded-t-3xl md:rounded-3xl shadow-2xl"
          >
            {/* Sarlavha */}
            <div className="sticky top-0 z-10 glass-header border-b border-slate-200 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-[17px] font-extrabold text-brand leading-tight">
                  Xizmat ko'rsatuvchi bo'lish
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {done
                    ? 'Ariza qabul qilindi'
                    : type
                      ? "Ma'lumotlarni to'ldiring"
                      : "Avval yo'nalishingizni tanlang"}
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Yopish"
                className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300/70 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {done ? (
              /* ── Muvaffaqiyat ekrani ── */
              <div className="px-6 py-10 flex flex-col items-center text-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/40 flex items-center justify-center text-brand-green"
                >
                  <CheckCircle2 size={30} />
                </motion.span>
                <h3 className="text-lg font-extrabold text-brand mt-4">Arizangiz qabul qilindi! 🎉</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[17rem]">
                  Endi siz "Xizmatlar" bo'limida ko'rinasiz — mijozlar sizga to'g'ridan-to'g'ri
                  qo'ng'iroq qilishlari mumkin.
                </p>
                <button
                  onClick={close}
                  className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-green to-brand text-white text-sm font-bold shadow-lg shadow-brand-green/25 active:scale-[0.98] transition-transform"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                {/* ── 1. Yo'nalish tanlash kartalari ── */}
                <div className="grid grid-cols-3 gap-2.5">
                  {SERVICE_TYPES.map((s) => {
                    const active = type === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setType(s.id);
                          setErrors({});
                        }}
                        className={`relative rounded-2xl border-2 p-3.5 flex flex-col items-center gap-1.5 transition-all ${
                          active
                            ? 'border-brand-green bg-brand-green/[0.07] shadow-md shadow-brand-green/15'
                            : 'border-slate-200 bg-white hover:border-brand-green/40'
                        }`}
                      >
                        <span className="text-[26px] leading-none">{s.emoji}</span>
                        <span
                          className={`text-[12px] font-bold ${
                            active ? 'text-brand-green-dark' : 'text-slate-600'
                          }`}
                        >
                          {s.label}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-tight text-center hidden sm:block">
                          {s.tagline}
                        </span>
                        {active && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center shadow">
                            <CheckCircle2 size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── 2. Tanlangan yo'nalishga mos dinamik maydonlar ── */}
                <AnimatePresence mode="wait">
                  {type && (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Hudud — barcha yo'nalishlar uchun umumiy */}
                      <div className="grid grid-cols-2 gap-3">
                        <SelectField
                          label="Viloyat"
                          value={f.region}
                          onChange={(v) => {
                            set('region', v);
                            set('district', '');
                          }}
                          options={Object.keys(REGIONS_DATA)}
                          error={errors.region}
                        />
                        <SelectField
                          label="Tuman"
                          value={f.district}
                          onChange={(v) => set('district', v)}
                          options={districts}
                          placeholder={f.region ? 'Tanlang' : 'Avval viloyat'}
                          error={errors.district}
                        />
                      </div>

                      {/* 🚛 Yuk tashish maydonlari */}
                      {type === 'transport' && (
                        <>
                          <SelectField
                            label="Transport turi"
                            value={f.transport}
                            onChange={(v) => set('transport', v)}
                            options={TRANSPORT_TYPES}
                            error={errors.transport}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Yuk ko'tarish hajmi" error={errors.capacity}>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={f.capacity}
                                onChange={(e) => set('capacity', e.target.value)}
                                placeholder="5"
                                className={`${inputCls} ${errors.capacity ? errBorder : okBorder}`}
                              />
                            </Field>
                            <SelectField
                              label="Birlik"
                              value={f.capacityUnit}
                              onChange={(v) => set('capacityUnit', v)}
                              options={CAPACITY_UNITS}
                            />
                          </div>
                          <SelectField
                            label="Narxlash turi"
                            value={f.pricing}
                            onChange={(v) => set('pricing', v)}
                            options={PRICING_TYPES}
                            error={errors.pricing}
                          />
                        </>
                      )}

                      {/* 🔪 Qassob maydonlari */}
                      {type === 'butcher' && (
                        <>
                          <CheckGroup
                            label="Qanday hayvonlarni so'yadi?"
                            options={BUTCHER_ANIMALS}
                            values={f.animals}
                            onToggle={(o) =>
                              set(
                                'animals',
                                f.animals.includes(o)
                                  ? f.animals.filter((x) => x !== o)
                                  : [...f.animals, o]
                              )
                            }
                            error={errors.animals}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Ish tajribasi (yil)" error={errors.experience}>
                              <input
                                type="number"
                                min="0"
                                value={f.experience}
                                onChange={(e) => set('experience', e.target.value)}
                                placeholder="10"
                                className={`${inputCls} ${errors.experience ? errBorder : okBorder}`}
                              />
                            </Field>
                            <Field label="Xizmat narxi (so'm/bosh)" error={errors.price}>
                              <input
                                type="number"
                                min="0"
                                value={f.price}
                                onChange={(e) => set('price', e.target.value)}
                                placeholder="300 000"
                                className={`${inputCls} ${errors.price ? errBorder : okBorder}`}
                              />
                            </Field>
                          </div>
                          <RadioYesNo
                            label="To'y va ma'rakalarga xizmat ko'rsatadimi?"
                            value={f.events}
                            onChange={(v) => set('events', v)}
                            error={errors.events}
                          />
                        </>
                      )}

                      {/* 🌾 Ozuqa maydonlari */}
                      {type === 'feed' && (
                        <>
                          <SelectField
                            label="Ozuqa turi"
                            value={f.feedKind}
                            onChange={(v) => set('feedKind', v)}
                            options={FEED_KINDS}
                            error={errors.feedKind}
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <Field label="Miqdori" error={errors.amount}>
                                <input
                                  type="number"
                                  min="0"
                                  value={f.amount}
                                  onChange={(e) => set('amount', e.target.value)}
                                  placeholder="500"
                                  className={`${inputCls} ${errors.amount ? errBorder : okBorder}`}
                                />
                              </Field>
                            </div>
                            <SelectField
                              label="Birlik"
                              value={f.unit}
                              onChange={(v) => set('unit', v)}
                              options={FEED_UNITS}
                            />
                          </div>
                          <Field label="Narxi (so'm)" error={errors.price}>
                            <input
                              type="number"
                              min="0"
                              value={f.price}
                              onChange={(e) => set('price', e.target.value)}
                              placeholder="25 000"
                              className={`${inputCls} ${errors.price ? errBorder : okBorder}`}
                            />
                          </Field>
                          <RadioYesNo
                            label="Yetkazib berish (dostavka) bormi?"
                            value={f.delivery}
                            onChange={(v) => set('delivery', v)}
                            error={errors.delivery}
                          />
                        </>
                      )}

                      {/* Umumiy: telefon, rasm, izoh */}
                      <Field label="Telefon raqam" error={errors.phone}>
                        <input
                          type="tel"
                          value={f.phone}
                          onChange={(e) => set('phone', formatPhoneInput(e.target.value))}
                          onFocus={() => !f.phone && set('phone', '+998 ')}
                          placeholder="+998 90 123 45 67"
                          className={`${inputCls} ${errors.phone ? errBorder : okBorder}`}
                        />
                      </Field>

                      {(type === 'transport' || type === 'feed') && (
                        <PhotoUpload
                          label={
                            type === 'transport' ? 'Mashinangiz rasmini yuklang' : 'Mahsulot rasmi'
                          }
                          hint={
                            type === 'transport'
                              ? 'Mashinangiz rasmini yuklang'
                              : 'Mahsulot rasmini yuklang (ixtiyoriy)'
                          }
                          preview={f.photo}
                          onPick={(url) => set('photo', url)}
                          onClear={() => set('photo', null)}
                        />
                      )}

                      <Field label="Qo'shimcha ma'lumot">
                        <textarea
                          value={f.note}
                          onChange={(e) => set('note', e.target.value)}
                          rows={3}
                          maxLength={300}
                          placeholder="Xizmatingiz haqida qisqacha yozing..."
                          className={`${inputCls} ${okBorder} resize-none`}
                        />
                      </Field>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={submit}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-green to-brand text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-brand-green/30"
                      >
                        <Send size={16} /> Arizani yuborish
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
