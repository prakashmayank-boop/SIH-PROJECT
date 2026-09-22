import { useState, useEffect, useCallback } from 'react';
import type {
  ScreenId,
  SupportedLanguage,
  IssueCategoryId,
  SeverityLevel,
  WaterDepthCategory,
  CitizenReport,
  PublicWarning
} from './types';
import { citizenApiService } from './services/citizenApi';
import { storageService } from './services/storage';

// Screens
import { CitizenPortalLayout } from './components/CitizenPortalLayout';
import { CitizenHomeScreen } from './components/screens/CitizenHomeScreen';
import { IssueCategoryScreen } from './components/screens/IssueCategoryScreen';
import { EvidenceScreen } from './components/screens/EvidenceScreen';
import type { EvidenceMediaItem } from './components/screens/EvidenceScreen';

import { LocationScreen } from './components/screens/LocationScreen';
import { SeverityDepthScreen } from './components/screens/SeverityDepthScreen';
import { ReviewSubmitScreen } from './components/screens/ReviewSubmitScreen';
import { SubmissionSuccessScreen } from './components/screens/SubmissionSuccessScreen';
import { MyReportsScreen } from './components/screens/MyReportsScreen';
import { ReportDetailsScreen } from './components/screens/ReportDetailsScreen';
import { NearbyWarningsScreen } from './components/screens/NearbyWarningsScreen';
import { SafeRouteScreen } from './components/screens/SafeRouteScreen';
import { HelpSafetyScreen } from './components/screens/HelpSafetyScreen';

export const CitizenApp: React.FC = () => {
  // Navigation & Language
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Form Reporting State
  const [category, setCategory] = useState<IssueCategoryId | null>(null);
  const [mediaItems, setMediaItems] = useState<EvidenceMediaItem[]>([]);
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(12.9345);
  const [longitude, setLongitude] = useState<number>(77.6265);
  const [accuracyM, setAccuracyM] = useState<number>(0);
  const [isManualLocation, setIsManualLocation] = useState<boolean>(false);
  const [landmark, setLandmark] = useState<string>('');
  const [roadName, setRoadName] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('VEHICLES_AFFECTED');
  const [waterDepth, setWaterDepth] = useState<WaterDepthCategory>('ANKLE_DEPTH');
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');

  // Draft Management State
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => {
    const draft = storageService.getSavedDraft();
    return !!(draft && draft.category);
  });

  // Reports & Warnings Data
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<PublicWarning[]>([]);

  // Enable scrolling on body for citizen portal (overrides admin dashboard's overflow:hidden)
  useEffect(() => {
    document.body.classList.add('citizen-portal-body');
    return () => {
      document.body.classList.remove('citizen-portal-body');
    };
  }, []);

  // Scroll to top on every screen transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeScreen]);

  // Connectivity Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Fetch reports & warnings
  const loadData = useCallback(async () => {
    try {
      const [fetchedReports, fetchedWarnings] = await Promise.all([
        citizenApiService.getMyReports(),
        citizenApiService.getNearbyWarnings()
      ]);
      setReports(fetchedReports);
      setWarnings(fetchedWarnings);
    } catch (err) {
      console.warn('Error loading reports or warnings', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, activeScreen]);

  // Auto-save draft when editing report
  const autoSaveCurrentDraft = useCallback((stepNumber: number) => {
    if (!category) return;
    storageService.saveDraft({
      step: stepNumber,
      category,
      description,
      water_depth_category: waterDepth,
      severity,
      latitude,
      longitude,
      location_accuracy_m: accuracyM,
      is_manual_location: isManualLocation,
      landmark,
      road_name: roadName,
      media_items: mediaItems.map(m => ({
        name: m.name,
        type: m.type,
        size: m.size,
        data_url: m.dataUrl
      })),
      consent_confirmed: consentConfirmed,
      saved_at: new Date().toISOString()
    });
    setHasSavedDraft(true);
  }, [category, description, waterDepth, severity, latitude, longitude, accuracyM, isManualLocation, landmark, roadName, mediaItems, consentConfirmed]);

  const handleResumeDraft = () => {
    const draft = storageService.getSavedDraft();
    if (!draft) return;

    if (draft.category) setCategory(draft.category);
    if (draft.description) setDescription(draft.description);
    if (draft.water_depth_category) setWaterDepth(draft.water_depth_category);
    if (draft.severity) setSeverity(draft.severity);
    if (draft.latitude) setLatitude(draft.latitude);
    if (draft.longitude) setLongitude(draft.longitude);
    if (draft.location_accuracy_m) setAccuracyM(draft.location_accuracy_m);
    if (draft.is_manual_location !== undefined) setIsManualLocation(draft.is_manual_location);
    if (draft.landmark) setLandmark(draft.landmark);
    if (draft.road_name) setRoadName(draft.road_name);
    if (draft.consent_confirmed !== undefined) setConsentConfirmed(draft.consent_confirmed);

    if (draft.media_items) {
      setMediaItems(
        draft.media_items.map((m, idx) => ({
          id: `draft-media-${idx}`,
          name: m.name,
          type: m.type,
          size: m.size,
          dataUrl: m.data_url
        }))
      );
    }

    // Navigate to appropriate wizard step
    switch (draft.step) {
      case 2:
        setActiveScreen('evidence');
        break;
      case 3:
        setActiveScreen('location');
        break;
      case 4:
        setActiveScreen('severity');
        break;
      case 5:
        setActiveScreen('review');
        break;
      default:
        setActiveScreen('category');
    }
  };

  const handleResetForm = () => {
    setCategory(null);
    setMediaItems([]);
    setDescription('');
    setLatitude(12.9345);
    setLongitude(77.6265);
    setAccuracyM(0);
    setIsManualLocation(false);
    setLandmark('');
    setRoadName('');
    setSeverity('VEHICLES_AFFECTED');
    setWaterDepth('ANKLE_DEPTH');
    setConsentConfirmed(false);
    storageService.deleteDraft();
    setHasSavedDraft(false);
  };

  // Submit Report
  const handleSubmitReport = async () => {
    if (!category) return;

    // Check anti-duplicate lock
    if (!storageService.acquireSubmissionLock()) {
      alert('A report submission is already in progress. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await citizenApiService.createReport({
        category,
        severity,
        description,
        water_depth_category: waterDepth,
        latitude,
        longitude,
        location_accuracy_m: accuracyM,
        is_manual_location: isManualLocation,
        landmark,
        road_name: roadName,
        media_data_urls: mediaItems.map(m => m.dataUrl),
        consent_confirmed: consentConfirmed
      });

      setSubmittedTicketId(report.public_ticket_id);
      setSubmittedAt(report.created_at);
      handleResetForm();
      setActiveScreen('success');
      loadData();
    } catch (err) {
      console.error('Submission failed', err);
      alert('Failed to submit report. Your draft has been preserved locally.');
    } finally {
      setIsSubmitting(false);
      storageService.releaseSubmissionLock();
    }
  };

  const handleSelectReport = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveScreen('report_details');
  };

  const selectedReport = reports.find(
    r => r.public_ticket_id === selectedTicketId || r.id === selectedTicketId
  );

  return (
    <CitizenPortalLayout
      activeScreen={activeScreen}
      lang={lang}
      isOnline={isOnline}
      onSelectScreen={(screen) => setActiveScreen(screen)}
      onLanguageChange={(newLang) => setLang(newLang)}
    >
      {/* Screen 1: Citizen Home */}
      {activeScreen === 'home' && (
        <CitizenHomeScreen
          lang={lang}
          onStartReport={() => setActiveScreen('category')}
          onOpenMyReports={() => setActiveScreen('my_reports')}
          onOpenWarnings={() => setActiveScreen('nearby_warnings')}
          onOpenSafeRoute={() => setActiveScreen('safe_route')}
          onOpenHelpSafety={() => setActiveScreen('help_safety')}
          hasSavedDraft={hasSavedDraft}
          onResumeDraft={handleResumeDraft}
        />
      )}

      {/* Screen 2: Issue Category */}
      {activeScreen === 'category' && (
        <IssueCategoryScreen
          lang={lang}
          selectedCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            autoSaveCurrentDraft(1);
          }}
          onNext={() => {
            autoSaveCurrentDraft(2);
            setActiveScreen('evidence');
          }}
          onBack={() => setActiveScreen('home')}
        />
      )}

      {/* Screen 3: Evidence */}
      {activeScreen === 'evidence' && (
        <EvidenceScreen
          lang={lang}
          mediaItems={mediaItems}
          description={description}
          onMediaChange={(items) => {
            setMediaItems(items);
            autoSaveCurrentDraft(2);
          }}
          onDescriptionChange={(desc) => {
            setDescription(desc);
            autoSaveCurrentDraft(2);
          }}
          onNext={() => {
            autoSaveCurrentDraft(3);
            setActiveScreen('location');
          }}
          onBack={() => setActiveScreen('category')}
        />
      )}

      {/* Screen 4: Location */}
      {activeScreen === 'location' && (
        <LocationScreen
          lang={lang}
          latitude={latitude}
          longitude={longitude}
          accuracyM={accuracyM}
          isManual={isManualLocation}
          landmark={landmark}
          roadName={roadName}
          onLocationChange={(lat, lon, acc, manual) => {
            setLatitude(lat);
            setLongitude(lon);
            setAccuracyM(acc);
            setIsManualLocation(manual);
            autoSaveCurrentDraft(3);
          }}
          onLandmarkChange={(lm) => {
            setLandmark(lm);
            autoSaveCurrentDraft(3);
          }}
          onRoadNameChange={(rn) => {
            setRoadName(rn);
            autoSaveCurrentDraft(3);
          }}
          onNext={() => {
            autoSaveCurrentDraft(4);
            setActiveScreen('severity');
          }}
          onBack={() => setActiveScreen('evidence')}
        />
      )}

      {/* Screen 5: Severity & Water Depth */}
      {activeScreen === 'severity' && (
        <SeverityDepthScreen
          lang={lang}
          severity={severity}
          waterDepth={waterDepth}
          onSeverityChange={(sev) => {
            setSeverity(sev);
            autoSaveCurrentDraft(4);
          }}
          onWaterDepthChange={(depth) => {
            setWaterDepth(depth);
            autoSaveCurrentDraft(4);
          }}
          onNext={() => {
            autoSaveCurrentDraft(5);
            setActiveScreen('review');
          }}
          onBack={() => setActiveScreen('location')}
        />
      )}

      {/* Screen 6: Review & Submit */}
      {activeScreen === 'review' && category && (
        <ReviewSubmitScreen
          lang={lang}
          category={category}
          mediaItems={mediaItems}
          description={description}
          latitude={latitude}
          longitude={longitude}
          accuracyM={accuracyM}
          isManual={isManualLocation}
          landmark={landmark}
          roadName={roadName}
          severity={severity}
          waterDepth={waterDepth}
          consentConfirmed={consentConfirmed}
          onConsentChange={(c) => {
            setConsentConfirmed(c);
            autoSaveCurrentDraft(5);
          }}
          onSubmit={handleSubmitReport}
          onBack={() => setActiveScreen('severity')}
          onEditStep={(step) => {
            if (step === 1) setActiveScreen('category');
            if (step === 2) setActiveScreen('evidence');
            if (step === 3) setActiveScreen('location');
            if (step === 4) setActiveScreen('severity');
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Screen 7: Submission Success */}
      {activeScreen === 'success' && (
        <SubmissionSuccessScreen
          lang={lang}
          ticketId={submittedTicketId}
          submittedAt={submittedAt}
          onViewReport={(ticketId) => {
            setSelectedTicketId(ticketId);
            setActiveScreen('report_details');
          }}
          onSubmitAnother={() => {
            handleResetForm();
            setActiveScreen('category');
          }}
          onBackHome={() => setActiveScreen('home')}
        />
      )}

      {/* Screen 8: My Reports */}
      {activeScreen === 'my_reports' && (
        <MyReportsScreen
          lang={lang}
          reports={reports}
          onSelectReport={handleSelectReport}
          onNewReport={() => {
            handleResetForm();
            setActiveScreen('category');
          }}
          onBack={() => setActiveScreen('home')}
        />
      )}

      {/* Screen 9: Report Details */}
      {activeScreen === 'report_details' && selectedReport && (
        <ReportDetailsScreen
          lang={lang}
          report={selectedReport}
          onBack={() => setActiveScreen('my_reports')}
          onReportUpdated={(updated) => {
            setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
          }}
        />
      )}

      {/* Screen 10: Nearby Warnings */}
      {activeScreen === 'nearby_warnings' && (
        <NearbyWarningsScreen
          lang={lang}
          warnings={warnings}
          onBack={() => setActiveScreen('home')}
        />
      )}

      {/* Screen 11: Safe Route Finder */}
      {activeScreen === 'safe_route' && (
        <SafeRouteScreen
          lang={lang}
          onBack={() => setActiveScreen('home')}
        />
      )}

      {/* Screen 12: Help & Safety */}
      {activeScreen === 'help_safety' && (
        <HelpSafetyScreen
          lang={lang}
          onBack={() => setActiveScreen('home')}
        />
      )}
    </CitizenPortalLayout>
  );
};
