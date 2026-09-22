import { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Video,
  Mic,
  Sparkles
} from 'lucide-react';
import type { SupportedLanguage } from '../../types';

import { TRANSLATIONS } from '../../i18n/translations';
import { validateMediaFile, verifyImageMagicBytes, fileToDataUrl } from '../../services/fileValidation';
import { CameraModal } from '../CameraModal';

export interface EvidenceMediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface EvidenceScreenProps {
  lang: SupportedLanguage;
  mediaItems: EvidenceMediaItem[];
  description: string;
  onMediaChange: (items: EvidenceMediaItem[]) => void;
  onDescriptionChange: (desc: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EvidenceScreen: React.FC<EvidenceScreenProps> = ({
  lang,
  mediaItems,
  description,
  onMediaChange,
  onDescriptionChange,
  onNext,
  onBack
}) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setValidationError(null);

    const remainingSlots = 3 - mediaItems.length;
    if (remainingSlots <= 0) {
      setValidationError('Maximum 3 photos allowed. Remove an existing photo to add another.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsValidating(true);

    try {
      const newItems: EvidenceMediaItem[] = [];

      for (const file of filesToProcess) {
        // 1. Basic validation (Type & Size <= 10MB)
        const check = validateMediaFile(file);
        if (!check.valid) {
          setValidationError(check.error || 'Invalid file');
          setIsValidating(false);
          return;
        }

        // 2. Binary magic bytes verification
        const magicCheck = await verifyImageMagicBytes(file);
        if (!magicCheck.valid) {
          setValidationError(magicCheck.error || 'File header validation failed');
          setIsValidating(false);
          return;
        }

        // 3. Convert to data URL for storage & instant preview
        const dataUrl = await fileToDataUrl(file);
        newItems.push({
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl
        });
      }

      onMediaChange([...mediaItems, ...newItems]);
    } catch (err) {
      console.error('File read error', err);
      setValidationError('Failed to read or validate selected image.');
    } finally {
      setIsValidating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (id: string) => {
    onMediaChange(mediaItems.filter(item => item.id !== id));
    setValidationError(null);
  };

  const charsLeft = 500 - description.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Title & Instructions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 2 of 5</span>
          <span className="text-xs text-slate-400">Optional but recommended</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">{t.evidenceTitle}</h2>
        <p className="text-xs text-slate-600 mt-0.5">{t.evidenceSubtitle}</p>
      </div>

      {/* Safety Alert for Evidence Collection */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={17} />
        <p className="text-xs text-amber-900 leading-relaxed font-medium">
          {t.evidenceSafety}
        </p>
      </div>

      {/* Photo Capture & Upload Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.photoUploadTitle} ({mediaItems.length}/3)
          </label>
          <span className="text-[11px] text-slate-400">JPG, PNG up to 10 MB</span>
        </div>

        {/* Hidden File Input (gallery upload) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Camera Modal */}
        {showCamera && (
          <CameraModal
            onCapture={async (file) => {
              setShowCamera(false);
              await handleFiles([file]);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={mediaItems.length >= 3 || isValidating}
            onClick={() => setShowCamera(true)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-slate-800 hover:text-blue-700 font-semibold text-xs transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={18} className="text-blue-600" />
            <span>{t.btnTakePhoto}</span>
          </button>

          <button
            type="button"
            disabled={mediaItems.length >= 3 || isValidating}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-slate-800 hover:text-blue-700 font-semibold text-xs transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} className="text-blue-600" />
            <span>{t.btnUploadPhoto}</span>
          </button>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Validating indicator */}
        {isValidating && (
          <div className="text-xs text-blue-600 flex items-center gap-2 py-1">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Validating image file headers...</span>
          </div>
        )}

        {/* Uploaded Thumbnails Grid */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-1">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-2xs">
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-red-600 text-white rounded-full p-1 transition shadow"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[10px] truncate px-1.5 py-0.5">
                  {(item.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.descriptionLabel}
          </label>
          <span className={`text-[11px] ${charsLeft < 40 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
            {charsLeft} {t.charRemaining}
          </span>
        </div>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
          placeholder={t.descriptionPlaceholder}
          className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 outline-none resize-none transition shadow-2xs"
        />
      </div>

      {/* Future-Ready Feature Placeholders (Clearly marked, no fake AI) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
          <Sparkles size={14} className="text-blue-500" />
          <span>Upcoming Observation Tools</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/60">
            <Video size={14} className="text-slate-400" />
            <span>Short video clips (Next release)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/60">
            <Mic size={14} className="text-slate-400" />
            <span>Voice note transcription (Next release)</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-3 flex items-center justify-between border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} />
          <span>{t.btnBack}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
        >
          <span>Continue to Location</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
